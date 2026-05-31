import type { Subscription } from '../db/database'

export type ReminderStatus = 'overdue' | 'today' | 'urgent' | 'soon' | 'upcoming' | 'safe'

type StatusStyle = {
  badgeClass: string
  borderClass: string
  dotClass: string
  label: string
}

export const paymentStatusStyles: Record<Subscription['paymentStatus'], StatusStyle> = {
  ready: { badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700', borderClass: 'border-slate-200', dotClass: 'bg-emerald-500', label: 'Ready' },
  need_top_up: { badgeClass: 'border-amber-300 bg-amber-50 text-amber-800', borderClass: 'border-amber-300', dotClass: 'bg-amber-500', label: 'Need Top Up' },
  review_first: { badgeClass: 'border-violet-200 bg-violet-50 text-violet-700', borderClass: 'border-violet-200', dotClass: 'bg-violet-500', label: 'Review First' },
}

export const reminderStatusStyles: Record<ReminderStatus, StatusStyle> = {
  overdue: { badgeClass: 'border-red-200 bg-red-50 text-red-700', borderClass: 'border-red-300', dotClass: 'bg-red-500', label: 'Overdue' },
  today: { badgeClass: 'border-rose-200 bg-rose-50 text-rose-700', borderClass: 'border-rose-300', dotClass: 'bg-rose-500', label: 'Today' },
  urgent: { badgeClass: 'border-orange-200 bg-orange-50 text-orange-700', borderClass: 'border-orange-300', dotClass: 'bg-orange-500', label: 'Urgent' },
  soon: { badgeClass: 'border-amber-200 bg-amber-50 text-amber-700', borderClass: 'border-amber-200', dotClass: 'bg-amber-400', label: 'Soon' },
  upcoming: { badgeClass: 'border-teal-200 bg-teal-50 text-teal-700', borderClass: 'border-teal-200', dotClass: 'bg-teal-500', label: 'Upcoming' },
  safe: { badgeClass: 'border-slate-200 bg-slate-50 text-slate-600', borderClass: 'border-slate-200', dotClass: 'bg-slate-400', label: 'Safe' },
}

export function getReminderStatus(nextRenewalDate: string): ReminderStatus {
  const daysUntilRenewal = differenceInDays(nextRenewalDate)

  if (daysUntilRenewal < 0) return 'overdue'
  if (daysUntilRenewal === 0) return 'today'
  if (daysUntilRenewal <= 3) return 'urgent'
  if (daysUntilRenewal <= 7) return 'soon'
  if (daysUntilRenewal <= 30) return 'upcoming'
  return 'safe'
}

export function getSubscriptionBorderClass(subscription: Subscription) {
  const reminderStatus = getReminderStatus(subscription.nextRenewalDate)
  if (reminderStatus === 'overdue' || reminderStatus === 'today') return reminderStatusStyles[reminderStatus].borderClass
  if (subscription.paymentStatus === 'need_top_up') return paymentStatusStyles.need_top_up.borderClass
  if (subscription.paymentStatus === 'review_first') return paymentStatusStyles.review_first.borderClass
  return reminderStatusStyles[reminderStatus].borderClass
}

export function differenceInDays(date: string) {
  return Math.round((parseLocalDate(date).getTime() - startOfToday().getTime()) / 86_400_000)
}

export function parseLocalDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

export function startOfToday() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}
