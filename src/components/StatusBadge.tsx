import type { Subscription } from '../db/database'
import { getReminderStatus, paymentStatusStyles, reminderStatusStyles } from '../utils/subscriptionStatus'

const badgeClassName = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none shadow-sm'

export function ReminderBadge({ nextRenewalDate }: { nextRenewalDate: string }) {
  const status = reminderStatusStyles[getReminderStatus(nextRenewalDate)]
  return <span className={`${badgeClassName} ${status.badgeClass}`}><span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />{status.label}</span>
}

export function PaymentStatusBadge({ paymentStatus }: { paymentStatus: Subscription['paymentStatus'] }) {
  const status = paymentStatusStyles[paymentStatus]
  return <span className={`${badgeClassName} ${status.badgeClass}`}><span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />{status.label}</span>
}
