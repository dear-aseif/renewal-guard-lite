import type { Subscription } from '../db/database'
import { getReminderStatus, paymentStatusStyles, reminderStatusStyles } from '../utils/subscriptionStatus'

const badgeClassName = 'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold'

export function ReminderBadge({ nextRenewalDate }: { nextRenewalDate: string }) {
  const status = reminderStatusStyles[getReminderStatus(nextRenewalDate)]
  return <span className={`${badgeClassName} ${status.badgeClass}`}>{status.label}</span>
}

export function PaymentStatusBadge({ paymentStatus }: { paymentStatus: Subscription['paymentStatus'] }) {
  const status = paymentStatusStyles[paymentStatus]
  return <span className={`${badgeClassName} ${status.badgeClass}`}>{status.label}</span>
}
