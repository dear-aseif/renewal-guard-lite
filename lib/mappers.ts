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

/**
 * Params for an INSERT that writes deleted_at as a literal NULL, so the
 * value list has exactly one entry per column placeholder.
 */
export function subscriptionToUpsertParams(subscription: Subscription) {
  const params = subscriptionToParams(subscription)
  return {
    id: params.id,
    name: params.name,
    price: params.price,
    currency: params.currency,
    billing_cycle: params.billing_cycle,
    custom_cycle_days: params.custom_cycle_days,
    next_renewal_date: params.next_renewal_date,
    payment_method: params.payment_method,
    account_email: params.account_email,
    payment_status: params.payment_status,
    reminder_days_before: params.reminder_days_before,
    notes: params.notes,
    created_at: params.created_at,
    updated_at: params.updated_at,
  }
}

export function rowToPushSubscription(row: PushSubscriptionRow) {
  return {
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
  }
}
