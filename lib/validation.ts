// Validates subscription records coming from the client before upsert,
// mirroring the checks the app already applies on save.

import type { Subscription, SubscriptionCurrency, BillingCycle, PaymentStatus, ReminderDaysBefore } from './types'

const currencies: SubscriptionCurrency[] = ['IDR', 'USD', 'EUR', 'OTHER']
const billingCycles: BillingCycle[] = ['weekly', 'monthly', 'yearly', 'custom']
const paymentStatuses: PaymentStatus[] = ['ready', 'need_top_up', 'review_first']
const reminderDays = [1, 3, 7, 14, 30]

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isOneOf<Value extends string>(value: unknown, allowed: readonly Value[]): value is Value {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isOptionalPositiveInt(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === 'number' && Number.isInteger(value) && value > 0)
}

export function isDateInputValue(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime())
}

export function isIsoDateTime(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

export function isSubscription(value: unknown): value is Subscription {
  if (!isRecord(value)) return false

  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.name === 'string'
    && value.name.trim().length > 0
    && typeof value.price === 'number'
    && Number.isFinite(value.price)
    && value.price >= 0
    && isOneOf(value.currency, currencies)
    && isOneOf(value.billingCycle, billingCycles)
    && isOptionalPositiveInt(value.customCycleDays)
    && (value.billingCycle !== 'custom' || typeof value.customCycleDays === 'number')
    && isDateInputValue(value.nextRenewalDate)
    && isOptionalString(value.paymentMethod)
    && isOptionalString(value.accountEmail)
    && isOneOf(value.paymentStatus, paymentStatuses)
    && (value.reminderDaysBefore === undefined || (typeof value.reminderDaysBefore === 'number' && (reminderDays as number[]).includes(value.reminderDaysBefore)))
    && isOptionalString(value.notes)
    && isIsoDateTime(value.createdAt)
    && isIsoDateTime(value.updatedAt)
}

export function sanitizeSubscription(input: Subscription): Subscription {
  return {
    ...input,
    name: input.name.trim(),
    customCycleDays: input.billingCycle === 'custom' ? input.customCycleDays : undefined,
    paymentMethod: input.paymentMethod?.trim() || undefined,
    accountEmail: input.accountEmail?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    reminderDaysBefore: (input.reminderDaysBefore ?? 7) as ReminderDaysBefore,
  }
}
