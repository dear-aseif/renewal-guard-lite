import type { Subscription } from '../db/database'

export function advanceSubscriptionAfterPayment(subscription: Subscription): Subscription {
  const renewalDate = parseLocalDate(subscription.nextRenewalDate)

  switch (subscription.billingCycle) {
    case 'weekly':
      renewalDate.setDate(renewalDate.getDate() + 7)
      break
    case 'monthly':
      addMonthsClamped(renewalDate, 1)
      break
    case 'yearly':
      addMonthsClamped(renewalDate, 12)
      break
    case 'custom':
      if (!subscription.customCycleDays) throw new Error('Custom cycle days are required before marking this subscription as paid.')
      renewalDate.setDate(renewalDate.getDate() + subscription.customCycleDays)
      break
  }

  return {
    ...subscription,
    nextRenewalDate: toDateInputValue(renewalDate),
    paymentStatus: 'ready',
    updatedAt: new Date().toISOString(),
  }
}

function parseLocalDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, lastDay))
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
