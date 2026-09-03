// Row mappers between Turso snake_case rows and the camelCase Subscription type.

import type { SubscriptionRow, PushSubscriptionRow } from './types.js'
import type { Subscription, ReminderDaysBefore } from './types.js'

export function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    currency: row.currency,
    billingCycle: row.billing_cycle,
    customCycleDays: row.custom_cycle_days ?? undefined,
    nextRenewalDate: row.next_renewal_date,
    paymentMethod: row.payment_method ?? undefined,
    accountEmail: row.account_email ?? undefined,
    paymentStatus: row.payment_status,
    reminderDaysBefore: row.reminder_days_before as ReminderDaysBefore,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function subscriptionToParams(subscription: Subscription, deletedAt: string | null = null) {
  return {
    id: subscription.id,
    name: subscription.name,
    price: subscription.price,
    currency: subscription.currency,
    billing_cycle: subscription.billingCycle,
    custom_cycle_days: subscription.customCycleDays ?? null,
    next_renewal_date: subscription.nextRenewalDate,
    payment_method: subscription.paymentMethod ?? null,
    account_email: subscription.accountEmail ?? null,
    payment_status: subscription.paymentStatus,
    reminder_days_before: subscription.reminderDaysBefore,
    notes: subscription.notes ?? null,
    created_at: subscription.createdAt,
    updated_at: subscription.updatedAt,
    deleted_at: deletedAt,
  }
}

export function rowToPushSubscription(row: PushSubscriptionRow) {
  return {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  }
}
