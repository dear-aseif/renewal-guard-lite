// Cloud sync service: queues local mutations in Dexie's outbox, flushes them
// to the server, then pulls and merges remote changes (last-write-wins).
// Works fully offline: mutations always land in Dexie first.

import { db, type OutboxEntry, type Subscription } from '../db/database'
import type { SyncPullResponse, SyncPushRequest } from '../../lib/types'

const DEVICE_ID_KEY = 'deviceId'
const LAST_SYNCED_AT_KEY = 'lastSyncedAt'

let syncInFlight = false
const syncSubscribers = new Set<() => void>()

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'
let syncStatus: SyncStatus = 'idle'

export function getSyncStatus(): SyncStatus {
  return syncStatus
}

export function subscribeSync(listener: () => void) {
  syncSubscribers.add(listener)
  return () => { syncSubscribers.delete(listener) }
}

function setSyncStatus(next: SyncStatus) {
  syncStatus = next
  syncSubscribers.forEach((listener) => listener())
}

async function getDeviceId(): Promise<string> {
  const existing = await db.syncMeta.get(DEVICE_ID_KEY)
  if (existing) return existing.value

  const deviceId = crypto.randomUUID()
  await db.syncMeta.put({ key: DEVICE_ID_KEY, value: deviceId })
  return deviceId
}

export async function getLastSyncedAt(): Promise<string | null> {
  const meta = await db.syncMeta.get(LAST_SYNCED_AT_KEY)
  return meta?.value ?? null
}

export async function queueSubscriptionUpsert(subscription: Subscription) {
  const entry = {
    id: crypto.randomUUID(),
    type: 'put' as const,
    subscriptionId: subscription.id,
    subscription,
    createdAt: new Date().toISOString(),
  }
  await db.outbox.add(entry)
}

/** Writes a subscription locally AND queues it for cloud sync. */
export async function saveSubscriptionLocally(subscription: Subscription) {
  await db.subscriptions.put(subscription)
  await queueSubscriptionUpsert(subscription)
}

/** Deletes a subscription locally (cascade) AND queues the removal for sync. */
export async function deleteSubscriptionLocally(id: string) {
  await db.deleteSubscriptionCascade(id)
  await queueSubscriptionDelete(id)
}

export async function queueSubscriptionDelete(id: string, updatedAt = new Date().toISOString()) {
  const subscription = await db.subscriptions.get(id)
  const entry = {
    id: crypto.randomUUID(),
    type: 'delete' as const,
    subscriptionId: id,
    subscription: subscription ?? {
      id,
      name: '',
      price: 0,
      currency: 'OTHER' as Subscription['currency'],
      billingCycle: 'monthly' as Subscription['billingCycle'],
      nextRenewalDate: '',
      paymentStatus: 'ready' as Subscription['paymentStatus'],
      reminderDaysBefore: 7 as Subscription['reminderDaysBefore'],
      createdAt: updatedAt,
      updatedAt,
    },
    createdAt: updatedAt,
  }
  await db.outbox.add(entry)
}

/**
 * Performs one sync round: flush local outbox, then pull remote changes.
 * Safe to call repeatedly — it short-circuits when a round is already running.
 */
export async function syncNow(): Promise<{ ok: boolean; error?: string }> {
  if (syncInFlight) return { ok: true }
  syncInFlight = true
  setSyncStatus('syncing')

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await buildPushPayload()),
    })

    if (!response.ok) {
      if (response.status === 401) {
        setSyncStatus('error')
        return { ok: false, error: 'unauthorized' }
      }
      setSyncStatus('error')
      return { ok: false, error: 'sync-failed' }
    }

    await pullRemote()
    setSyncStatus('idle')
    return { ok: true }
  } catch {
    setSyncStatus('offline')
    return { ok: false, error: 'offline' }
  } finally {
    syncInFlight = false
  }
}

async function buildPushPayload(): Promise<SyncPushRequest> {
  const deviceId = await getDeviceId()
  const lastSyncedAt = await getLastSyncedAt()

  const outbox = await db.outbox.orderBy('createdAt').toArray()

  // Reduce the outbox to one final action per subscription (chronological last
  // wins). This avoids sending stale versions or redundant work to the server.
  const finalActionBySubscription = new Map<string, OutboxEntry>()
  for (const entry of outbox) {
    finalActionBySubscription.set(entry.subscriptionId, entry)
  }

  const upserts: Subscription[] = []
  const deletes: { id: string; updatedAt: string }[] = []
  for (const entry of finalActionBySubscription.values()) {
    if (entry.type === 'delete') {
      deletes.push({ id: entry.subscriptionId, updatedAt: entry.createdAt })
    } else {
      upserts.push(entry.subscription)
    }
  }

  return { deviceId, lastSyncedAt, upserts, deletes }
}

async function pullRemote() {
  const lastSyncedAt = await getLastSyncedAt()
  const query = lastSyncedAt ? `?since=${encodeURIComponent(lastSyncedAt)}` : ''
  const response = await fetch(`/api/sync${query}`)

  if (!response.ok) {
    if (response.status === 401) throw new Error('unauthorized')
    throw new Error('pull-failed')
  }

  const data = (await response.json()) as SyncPullResponse
  await mergePull(data)

  // Advance the checkpoint to the newest updatedAt we actually processed,
  // not the server clock, so the next incremental pull cannot skip records.
  const updatedAts = data.subscriptions
    .map((subscription) => subscription.updatedAt)
    .concat(data.deletedIds.map((deleted) => deleted.updatedAt))
  const newestUpdatedAt = updatedAts.length > 0 ? updatedAts.sort()[updatedAts.length - 1] : undefined
  if (newestUpdatedAt) {
    await db.syncMeta.put({ key: LAST_SYNCED_AT_KEY, value: newestUpdatedAt })
  }

  // Clear the entire outbox only after both push and pull succeeded.
  await db.outbox.clear()
}

async function mergePull(data: SyncPullResponse) {
  await db.transaction('rw', db.subscriptions, async () => {
    const existingById = new Map((await db.subscriptions.toArray()).map((subscription) => [subscription.id, subscription]))

    for (const remote of data.subscriptions) {
      const local = existingById.get(remote.id)
      if (!local || remote.updatedAt >= local.updatedAt) {
        await db.subscriptions.put(remote)
      }
    }

    for (const deleted of data.deletedIds) {
      const local = existingById.get(deleted.id)
      if (!local || deleted.updatedAt >= local.updatedAt) {
        await db.subscriptions.delete(deleted.id)
      }
    }
  })
}
