import type { Subscription } from '../db/database'

export type ReminderStatus = 'overdue' | 'today' | 'urgent' | 'soon' | 'upcoming' | 'safe'

type StatusStyle = {
  badgeClass: string
  borderClass: string
  dotClass: string
  label: string
}

export const paymentStatusStyles: Record<Subscription['paymentStatus'], StatusStyle> = {
  ready: { badgeClass: 'border-lime-400/25 bg-lime-400/10 text-lime-300', borderClass: 'border-neutral-800', dotClass: 'bg-lime-400', label: 'Ready' },
  need_top_up: { badgeClass: 'border-gold-400/35 bg-gold-400/10 text-gold-300', borderClass: 'border-gold-400/40', dotClass: 'bg-gold-400', label: 'Need Top Up' },
  review_first: { badgeClass: 'border-violet-500/30 bg-violet-500/10 text-violet-300', borderClass: 'border-violet-500/35', dotClass: 'bg-violet-400', label: 'Review First' },
}

export const reminderStatusStyles: Record<ReminderStatus, StatusStyle> = {
  overdue: { badgeClass: 'border-red-500/40 bg-red-500/10 text-red-300', borderClass: 'border-red-500/45', dotClass: 'bg-red-400', label: 'Overdue' },
  today: { badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-300', borderClass: 'border-rose-500/45', dotClass: 'bg-rose-400', label: 'Today' },
  urgent: { badgeClass: 'border-orange-500/40 bg-orange-500/10 text-orange-300', borderClass: 'border-orange-500/40', dotClass: 'bg-orange-400', label: 'Urgent' },
  soon: { badgeClass: 'border-gold-400/25 bg-gold-400/10 text-gold-300', borderClass: 'border-gold-400/25', dotClass: 'bg-gold-400', label: 'Soon' },
  upcoming: { badgeClass: 'border-lime-400/25 bg-lime-400/10 text-lime-300', borderClass: 'border-lime-400/20', dotClass: 'bg-lime-400', label: 'Upcoming' },
  safe: { badgeClass: 'border-neutral-700 bg-neutral-900/70 text-slate-500', borderClass: 'border-neutral-800', dotClass: 'bg-slate-400', label: 'Safe' },
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
