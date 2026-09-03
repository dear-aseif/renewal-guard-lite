import { db, type RenewalHistory, type Subscription } from '../db/database'
import { advanceSubscriptionAfterPayment } from './renewal'
import { queueSubscriptionUpsert } from '../services/sync'

export function createRenewalHistory(subscription: Subscription, nextRenewalDate: string, paidDate = new Date().toISOString()): RenewalHistory {
  return {
    id: crypto.randomUUID(),
    subscriptionId: subscription.id,
    subscriptionName: subscription.name,
    paidDate,
    amount: subscription.price,
    currency: subscription.currency,
    previousRenewalDate: subscription.nextRenewalDate,
    nextRenewalDate,
  }
}

export async function markSubscriptionAsPaid(subscription: Subscription) {
  const updatedSubscription = advanceSubscriptionAfterPayment(subscription)
  const history = createRenewalHistory(subscription, updatedSubscription.nextRenewalDate, updatedSubscription.updatedAt)

  await db.transaction('rw', db.subscriptions, db.renewalHistory, db.outbox, async () => {
    await db.subscriptions.put(updatedSubscription)
    await db.renewalHistory.add(history)
    await queueSubscriptionUpsert(updatedSubscription)
  })

  return updatedSubscription
}
