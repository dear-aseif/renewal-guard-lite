// Types shared between the Vite client and Vercel Functions.
// Keep this dependency-free so both sides can import it.

export type SubscriptionCurrency = 'IDR' | 'USD' | 'EUR' | 'OTHER'
export type BillingCycle = 'weekly' | 'monthly' | 'yearly' | 'custom'
export type PaymentStatus = 'ready' | 'need_top_up' | 'review_first'
export type ReminderDaysBefore = 1 | 3 | 7 | 14 | 30

export type Subscription = {
  id: string
  name: string
  price: number
  currency: SubscriptionCurrency
  billingCycle: BillingCycle
  customCycleDays?: number
  nextRenewalDate: string // YYYY-MM-DD
  paymentMethod?: string
  accountEmail?: string
  paymentStatus: PaymentStatus
  reminderDaysBefore: ReminderDaysBefore
  notes?: string
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

export type SubscriptionRow = {
  id: string
  name: string
  price: number
  currency: SubscriptionCurrency
  billing_cycle: BillingCycle
  custom_cycle_days: number | null
  next_renewal_date: string
  payment_method: string | null
  account_email: string | null
  payment_status: PaymentStatus
  reminder_days_before: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PushSubscriptionRow = {
  endpoint: string
  p256dh: string
  auth: string
  device_label: string | null
  created_at: string
  updated_at: string
}

export type SyncPushRequest = {
  deviceId: string
  lastSyncedAt: string | null
  upserts: Subscription[]
  deletes: { id: string; updatedAt: string }[]
}

export type SyncPullResponse = {
  serverTime: string
  subscriptions: Subscription[]
  deletedIds: { id: string; updatedAt: string }[]
}
