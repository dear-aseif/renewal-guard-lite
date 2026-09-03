import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSessionSecret, isSessionTokenValid } from '../lib/auth.js'
import { getDb } from '../lib/db.js'
import { rowToSubscription, subscriptionToParams } from '../lib/mappers.js'
import type { SubscriptionRow, SyncPullResponse, SyncPushRequest } from '../lib/types.js'
import { isSubscription } from '../lib/validation.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!isAuthenticated(request)) {
    return response.status(401).json({ error: 'Not authenticated.' })
  }

  if (request.method === 'POST') {
    return handlePush(request, response)
  }

  if (request.method === 'GET') {
    return handlePull(request, response)
  }

  response.setHeader('Allow', 'GET, POST')
  return response.status(405).json({ error: 'Method not allowed.' })
}

function isAuthenticated(request: VercelRequest): boolean {
  const secret = getSessionSecret()
  const cookie = parseCookie(request.headers.cookie)
  return isSessionTokenValid(cookie.rg_session, secret)
}

async function handlePush(request: VercelRequest, response: VercelResponse) {
  const body = request.body as SyncPushRequest | undefined
  if (!body || !Array.isArray(body.upserts) || !Array.isArray(body.deletes)) {
    return response.status(400).json({ error: 'Invalid sync payload.' })
  }

  const invalidUpsert = body.upserts.find((item) => !isSubscription(item))
  if (invalidUpsert) {
    return response.status(400).json({ error: 'Sync contains an invalid subscription.' })
  }

  const db = getDb()

  try {
    const statements = [
      ...body.upserts.map((subscription) => ({
        sql: `
          INSERT INTO subscriptions (
            id, name, price, currency, billing_cycle, custom_cycle_days,
            next_renewal_date, payment_method, account_email, payment_status,
            reminder_days_before, notes, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
          ON CONFLICT (id) DO UPDATE SET
            name = excluded.name,
            price = excluded.price,
            currency = excluded.currency,
            billing_cycle = excluded.billing_cycle,
            custom_cycle_days = excluded.custom_cycle_days,
            next_renewal_date = excluded.next_renewal_date,
            payment_method = excluded.payment_method,
            account_email = excluded.account_email,
            payment_status = excluded.payment_status,
            reminder_days_before = excluded.reminder_days_before,
            notes = excluded.notes,
            updated_at = excluded.updated_at,
            deleted_at = NULL
          WHERE excluded.updated_at > subscriptions.updated_at
            OR subscriptions.deleted_at IS NOT NULL
        `,
        args: Object.values(subscriptionToParams(subscription)),
      })),
      ...body.deletes.map((deleted) => ({
        sql: `
          UPDATE subscriptions
          SET deleted_at = ?, updated_at = ?
          WHERE id = ? AND (updated_at < ? OR deleted_at IS NULL)
        `,
        args: [deleted.updatedAt, deleted.updatedAt, deleted.id, deleted.updatedAt],
      })),
    ]

    if (statements.length > 0) {
      await db.batch(statements)
    }
  } catch (error) {
    console.error('sync push failed', error)
    return response.status(500).json({ error: 'Sync could not be saved.' })
  }

  return response.status(200).json({ ok: true })
}

async function handlePull(request: VercelRequest, response: VercelResponse) {
  const since = typeof request.query.since === 'string' ? request.query.since : null
  const db = getDb()

  try {
    const result = since
      ? await db.execute({
          sql: 'SELECT * FROM subscriptions WHERE updated_at > ?',
          args: [since],
        })
      : await db.execute('SELECT * FROM subscriptions')

    const rows = result.rows as unknown as SubscriptionRow[]
    const subscriptions = rows.filter((row) => !row.deleted_at).map(rowToSubscription)
    const deletedIds = rows.filter((row) => row.deleted_at).map((row) => ({ id: row.id, updatedAt: row.deleted_at as string }))

    const payload: SyncPullResponse = {
      serverTime: new Date().toISOString(),
      subscriptions,
      deletedIds,
    }
    return response.status(200).json(payload)
  } catch (error) {
    console.error('sync pull failed', error)
    return response.status(500).json({ error: 'Sync could not be loaded.' })
  }
}

function parseCookie(header: string | undefined): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((part) => {
      const index = part.indexOf('=')
      if (index === -1) return [part.trim(), '']
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()]
    }),
  )
}
