import { DEFAULT_REMINDER_DAYS_BEFORE, type Subscription } from '../db/database'

export function getReminderDaysBefore(subscription: Pick<Subscription, 'reminderDaysBefore'>) {
  return subscription.reminderDaysBefore ?? DEFAULT_REMINDER_DAYS_BEFORE
}

export function withDefaultReminderDaysBefore(subscription: Subscription): Subscription {
  return {
    ...subscription,
    reminderDaysBefore: getReminderDaysBefore(subscription),
  }
}
