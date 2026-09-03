import Dexie, { type EntityTable } from 'dexie'

export const reminderDaysBeforeOptions = [1, 3, 7, 14, 30] as const
export type ReminderDaysBefore = typeof reminderDaysBeforeOptions[number]
export const DEFAULT_REMINDER_DAYS_BEFORE: ReminderDaysBefore = 7

export type RenewalHistory = {
  id: string
  subscriptionId: string
  subscriptionName: string
  paidDate: string
  amount: number
  currency: Subscription['currency']
  previousRenewalDate: string
  nextRenewalDate: string
}

export type Subscription = {
  id: string
  name: string
  price: number
  currency: 'IDR' | 'USD' | 'EUR' | 'OTHER'
  billingCycle: 'weekly' | 'monthly' | 'yearly' | 'custom'
  customCycleDays?: number
  nextRenewalDate: string
  paymentMethod?: string
  accountEmail?: string
  paymentStatus: 'ready' | 'need_top_up' | 'review_first'
  reminderDaysBefore: ReminderDaysBefore
  notes?: string
  createdAt: string
  updatedAt: string
}

export type OutboxEntry = {
  id: string
  type: 'put' | 'delete' | 'markPaid'
  subscriptionId: string
  subscription: Subscription
  createdAt: string
}

export type SyncMetaKey = 'deviceId' | 'lastSyncedAt'
export type SyncMeta = { key: SyncMetaKey; value: string }

class RenewalGuardDatabase extends Dexie {
  subscriptions!: EntityTable<Subscription, 'id'>
  renewalHistory!: EntityTable<RenewalHistory, 'id'>
  outbox!: EntityTable<OutboxEntry, 'id'>
  syncMeta!: EntityTable<SyncMeta, 'key'>

  constructor() {
    super('renewalGuardLite')
    this.version(1).stores({
      subscriptions: 'id, name, nextRenewalDate, paymentStatus, createdAt',
    })
    this.version(2).stores({
      subscriptions: 'id, name, nextRenewalDate, paymentStatus, createdAt',
    }).upgrade((transaction) => transaction.table<Subscription>('subscriptions').toCollection().modify((subscription) => {
      subscription.reminderDaysBefore ??= DEFAULT_REMINDER_DAYS_BEFORE
    }))
    this.version(3).stores({
      subscriptions: 'id, name, nextRenewalDate, paymentStatus, createdAt',
      renewalHistory: 'id, subscriptionId, paidDate',
    })
    this.version(4).stores({
      subscriptions: 'id, name, nextRenewalDate, paymentStatus, createdAt, updatedAt',
      renewalHistory: 'id, subscriptionId, paidDate',
      outbox: 'id, subscriptionId, createdAt',
      syncMeta: 'key',
    })
  }

  async deleteSubscriptionCascade(id: string) {
    await this.transaction('rw', this.subscriptions, this.renewalHistory, async () => {
      await this.renewalHistory.where('subscriptionId').equals(id).delete()
      await this.subscriptions.delete(id)
    })
  }
}

export const db = new RenewalGuardDatabase()
