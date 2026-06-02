import { reminderDaysBeforeOptions, type RenewalHistory, type Subscription } from '../db/database'
import { withDefaultReminderDaysBefore } from './reminderDays'

export const APP_VERSION = '0.1.0'
export const LAST_BACKUP_AT_KEY = 'renewalGuardLite.lastBackupAt'

export type SubscriptionBackup = {
  subscriptions: Subscription[]
  renewalHistory: RenewalHistory[]
  exportedAt: string
  appVersion: string
}

export function createBackup(subscriptions: Subscription[], renewalHistory: RenewalHistory[] = []): SubscriptionBackup {
  return {
    subscriptions: subscriptions.map(withDefaultReminderDaysBefore),
    renewalHistory,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
  }
}

export function parseBackup(content: string): SubscriptionBackup {
  let backup: unknown

  try {
    backup = JSON.parse(content)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (!isRecord(backup) || !Array.isArray(backup.subscriptions) || !isIsoDateTime(backup.exportedAt) || typeof backup.appVersion !== 'string') {
    throw new Error('This file is not a Renewal Guard backup.')
  }

  if (!backup.subscriptions.every(isSubscription)) {
    throw new Error('This backup contains invalid subscription data.')
  }

  const renewalHistory = backup.renewalHistory ?? []
  if (!Array.isArray(renewalHistory) || !renewalHistory.every(isRenewalHistory)) {
    throw new Error('This backup contains invalid renewal history data.')
  }

  const ids = backup.subscriptions.map(({ id }) => id)
  if (new Set(ids).size !== ids.length) {
    throw new Error('This backup contains duplicate subscription IDs.')
  }

  const historyIds = renewalHistory.map(({ id }) => id)
  if (new Set(historyIds).size !== historyIds.length) {
    throw new Error('This backup contains duplicate renewal history IDs.')
  }

  const subscriptionIds = new Set(ids)
  if (renewalHistory.some(({ subscriptionId }) => !subscriptionIds.has(subscriptionId))) {
    throw new Error('This backup contains renewal history for an unknown subscription.')
  }

  return {
    ...(backup as Omit<SubscriptionBackup, 'renewalHistory'>),
    subscriptions: backup.subscriptions.map((subscription) => withDefaultReminderDaysBefore(subscription as Subscription)),
    renewalHistory,
  }
}

export function isBackupRecommended(lastBackupAt: string | null) {
  if (!lastBackupAt || !isIsoDateTime(lastBackupAt)) return true
  return Date.now() - new Date(lastBackupAt).getTime() > 14 * 86_400_000
}

function isSubscription(value: unknown): value is Subscription {
  if (!isRecord(value)) return false

  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.name === 'string'
    && value.name.length > 0
    && typeof value.price === 'number'
    && Number.isFinite(value.price)
    && value.price >= 0
    && isOneOf(value.currency, ['IDR', 'USD', 'EUR', 'OTHER'])
    && isOneOf(value.billingCycle, ['weekly', 'monthly', 'yearly', 'custom'])
    && isOptionalPositiveInteger(value.customCycleDays)
    && (value.billingCycle !== 'custom' || typeof value.customCycleDays === 'number')
    && isDateInputValue(value.nextRenewalDate)
    && isOptionalString(value.paymentMethod)
    && isOptionalString(value.accountEmail)
    && isOneOf(value.paymentStatus, ['ready', 'need_top_up', 'review_first'])
    && isOptionalReminderDaysBefore(value.reminderDaysBefore)
    && isOptionalString(value.notes)
    && isIsoDateTime(value.createdAt)
    && isIsoDateTime(value.updatedAt)
}

function isRenewalHistory(value: unknown): value is RenewalHistory {
  if (!isRecord(value)) return false

  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.subscriptionId === 'string'
    && value.subscriptionId.length > 0
    && typeof value.subscriptionName === 'string'
    && value.subscriptionName.length > 0
    && isIsoDateTime(value.paidDate)
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && value.amount >= 0
    && isOneOf(value.currency, ['IDR', 'USD', 'EUR', 'OTHER'])
    && isDateInputValue(value.previousRenewalDate)
    && isDateInputValue(value.nextRenewalDate)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isOneOf<const Value extends string>(value: unknown, allowedValues: readonly Value[]): value is Value {
  return typeof value === 'string' && allowedValues.includes(value as Value)
}

function isOptionalReminderDaysBefore(value: unknown) {
  return value === undefined || (typeof value === 'number' && reminderDaysBeforeOptions.includes(value as Subscription['reminderDaysBefore']))
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function isOptionalPositiveInteger(value: unknown) {
  return value === undefined || (typeof value === 'number' && Number.isInteger(value) && value > 0)
}

function isDateInputValue(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && toDateInputValue(date) === value
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isIsoDateTime(value: unknown) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}
