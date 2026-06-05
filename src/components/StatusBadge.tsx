import type { Subscription } from '../db/database'
import { getReminderStatus, paymentStatusStyles, reminderStatusStyles } from '../utils/subscriptionStatus'

const badgeClassName = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.06em] sm:text-[10px] sm:tracking-[0.08em] shadow-sm'

export function ReminderBadge({ nextRenewalDate }: { nextRenewalDate: string }) {
  const status = reminderStatusStyles[getReminderStatus(nextRenewalDate)]
  return <span className={`${badgeClassName} ${status.badgeClass}`}><span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${status.dotClass}`} />{status.label}</span>
}

export function PaymentStatusBadge({ paymentStatus }: { paymentStatus: Subscription['paymentStatus'] }) {
  const status = paymentStatusStyles[paymentStatus]
  return <span className={`${badgeClassName} ${status.badgeClass}`}><span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${status.dotClass}`} />{status.label}</span>
}
