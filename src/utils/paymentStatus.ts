import type { Subscription } from '../db/database'

export const paymentStatusOptions: Array<{ label: string; value: Subscription['paymentStatus'] }> = [
  { label: 'Ready', value: 'ready' },
  { label: 'Need Top Up', value: 'need_top_up' },
  { label: 'Review First', value: 'review_first' },
]

export function changeSubscriptionPaymentStatus(subscription: Subscription, paymentStatus: Subscription['paymentStatus']): Subscription {
  return {
    ...subscription,
    paymentStatus,
    updatedAt: new Date().toISOString(),
  }
}
