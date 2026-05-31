import type { Subscription } from '../db/database'

export type ReminderStatus = 'overdue' | 'today' | 'urgent' | 'soon' | 'upcoming' | 'safe'

type StatusStyle = {
  badgeClass: string
  borderClass: string
  label: string
}

export const paymentStatusStyles: Record<Subscription['paymentStatus'], StatusStyle> = {
  ready: { badgeClass: 'bg-emerald-50 text-emerald-700', borderClass: 'border-slate-200', label: 'Ready' },
  need_top_up: { badgeClass: 'bg-amber-100 text-amber-800', borderClass: 'border-amber-300', label: 'Need Top Up' },
  review_first: { badgeClass: 'bg-slate-100 text-slate-700', borderClass: 'border-slate-200', label: 'Review First' },
}

export const reminderStatusStyles: Record<ReminderStatus, StatusStyle> = {
  overdue: { badgeClass: 'bg-red-100 text-red-800', borderClass: 'border-red-300', label: 'Overdue' },
  today: { badgeClass: 'bg-red-100 text-red-800', borderClass: 'border-red-300', label: 'Today' },
  urgent: { badgeClass: 'bg-amber-100 text-amber-800', borderClass: 'border-amber-300', label: 'Urgent' },
  soon: { badgeClass: 'bg-amber-50 text-amber-700', borderClass: 'border-amber-200', label: 'Soon' },
  upcoming: { badgeClass: 'bg-teal-50 text-teal-700', borderClass: 'border-teal-200', label: 'Upcoming' },
  safe: { badgeClass: 'bg-slate-100 text-slate-600', borderClass: 'border-slate-200', label: 'Safe' },
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
