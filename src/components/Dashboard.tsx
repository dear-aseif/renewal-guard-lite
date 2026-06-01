import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { db, type Subscription } from '../db/database'
import { EmptyState } from './EmptyState'
import { PaymentStatusBadge, ReminderBadge } from './StatusBadge'
import { markSubscriptionAsPaid } from '../utils/renewalHistory'
import { differenceInDays, getSubscriptionBorderClass, parseLocalDate, startOfToday } from '../utils/subscriptionStatus'
import { changeSubscriptionPaymentStatus, paymentStatusOptions } from '../utils/paymentStatus'
import { getReminderDaysBefore } from '../utils/reminderDays'

type CurrencyTotals = Partial<Record<Subscription['currency'], number>>

type DashboardProps = {
  onAdd: () => void
}

export function Dashboard({ onAdd }: DashboardProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updatingPaymentStatusId, setUpdatingPaymentStatusId] = useState<string>()

  useEffect(() => {
    let isCurrent = true

    async function loadSubscriptions() {
      try {
        const savedSubscriptions = await db.subscriptions.orderBy('nextRenewalDate').toArray()
        if (isCurrent) setSubscriptions(savedSubscriptions)
      } catch {
        if (isCurrent) setError('Your dashboard could not be loaded. Please try again.')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadSubscriptions()

    return () => {
      isCurrent = false
    }
  }, [])

  const dashboard = useMemo(() => buildDashboardData(subscriptions), [subscriptions])

  async function updatePaymentStatus(subscription: Subscription, paymentStatus: Subscription['paymentStatus']) {
    setError('')
    setSuccess('')
    setUpdatingPaymentStatusId(subscription.id)

    try {
      const updatedSubscription = changeSubscriptionPaymentStatus(subscription, paymentStatus)
      await db.subscriptions.put(updatedSubscription)
      setSubscriptions((currentSubscriptions) => currentSubscriptions.map((currentSubscription) => currentSubscription.id === updatedSubscription.id ? updatedSubscription : currentSubscription))
      const statusLabel = paymentStatusOptions.find(({ value }) => value === paymentStatus)?.label ?? paymentStatus
      setSuccess(`${subscription.name} payment status updated to ${statusLabel}.`)
    } catch {
      setError('The payment status could not be updated. Please try again.')
    } finally {
      setUpdatingPaymentStatusId(undefined)
    }
  }

  async function markAsPaid(subscription: Subscription) {
    const shouldAdvance = window.confirm(`Mark ${subscription.name} as paid and move its renewal date forward?`)
    if (!shouldAdvance) return

    setError('')
    setSuccess('')

    try {
      const updatedSubscription = await markSubscriptionAsPaid(subscription)
      setSubscriptions((currentSubscriptions) => currentSubscriptions
        .map((currentSubscription) => currentSubscription.id === updatedSubscription.id ? updatedSubscription : currentSubscription)
        .sort((first, second) => first.nextRenewalDate.localeCompare(second.nextRenewalDate)))
      setSuccess(`${subscription.name} marked as paid. Next renewal: ${formatDate(updatedSubscription.nextRenewalDate)}.`)
    } catch (markAsPaidError) {
      setError(markAsPaidError instanceof Error ? markAsPaidError.message : 'The subscription could not be marked as paid. Please try again.')
    }
  }

  if (isLoading) return <EmptyState description="Reading your locally saved subscriptions." icon="storage" title="Loading your renewal summary..." />

  if (error) return <p className="feedback-error" role="alert">{error}</p>

  if (subscriptions.length === 0) {
    return <EmptyState action={<button className="btn-primary mt-5" onClick={onAdd} type="button">Add your first subscription</button>} description="Add your first subscription to see your renewal summary." icon="subscriptions" title="No subscriptions yet" />
  }

  const renderRenewalCard = (subscription: Subscription) => <RenewalCard isUpdatingPaymentStatus={updatingPaymentStatusId === subscription.id} key={subscription.id} onMarkAsPaid={() => void markAsPaid(subscription)} onPaymentStatusChange={(paymentStatus) => void updatePaymentStatus(subscription, paymentStatus)} subscription={subscription} />

  return (
    <div className="space-y-8">
      {success && <p className="feedback-success" role="status">{success}</p>}
      <section aria-labelledby="renewal-summary-title">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300">Renewal metrics</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900" id="renewal-summary-title">Renewal summary</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500 sm:text-right">Totals stay separated by currency. No conversions are applied.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard code="MTH" label="This month" totals={dashboard.thisMonth} />
          <SummaryCard code="7D" label="Next 7 days" totals={dashboard.nextSevenDays} />
          <SummaryCard code="30D" label="Next 30 days" totals={dashboard.nextThirtyDays} />
        </div>
      </section>

      <DashboardSection description="Overdue, due today, urgent, inside your reminder window, or waiting for a payment review." title="Needs Attention">
        <RenewalCardGrid emptyDescription="Overdue renewals and payment reminders will appear here." emptyTitle="No items need attention" renderSubscription={renderRenewalCard} subscriptions={dashboard.needsAttention} />
      </DashboardSection>

      <DashboardSection description="Renewals due within 7 days that do not already need attention." title="Next 7 Days">
        <RenewalCardGrid emptyDescription="Renewals due in the next 7 days will appear here." emptyTitle="No renewals in the next 7 days" renderSubscription={renderRenewalCard} subscriptions={dashboard.nextSevenDaysGroup} />
      </DashboardSection>

      <DashboardSection description="Renewals due in 8–30 days that do not already appear above." title="Next 30 Days">
        <RenewalCardGrid emptyDescription="Renewals due in the next 30 days will appear here." emptyTitle="No renewals in the next 30 days" renderSubscription={renderRenewalCard} subscriptions={dashboard.nextThirtyDaysGroup} />
      </DashboardSection>

      <DashboardSection description="Renewals more than 30 days away that do not already need attention." title="Later">
        <RenewalCardGrid emptyDescription="Renewals more than 30 days away will appear here." emptyTitle="No later renewals" renderSubscription={renderRenewalCard} subscriptions={dashboard.later} />
      </DashboardSection>
    </div>
  )
}

function RenewalCardGrid({ emptyDescription, emptyTitle, renderSubscription, subscriptions }: { emptyDescription: string; emptyTitle: string; renderSubscription: (subscription: Subscription) => ReactNode; subscriptions: Subscription[] }) {
  if (subscriptions.length === 0) return <EmptyState description={emptyDescription} icon="calendar" title={emptyTitle} />

  return <div className="grid gap-3 lg:grid-cols-2">{subscriptions.map(renderSubscription)}</div>
}

function SummaryCard({ code, label, totals }: { code: string; label: string; totals: CurrencyTotals }) {
  const currencyTotals = Object.entries(totals) as [Subscription['currency'], number][]
  const currencyLabel = `${currencyTotals.length} ${currencyTotals.length === 1 ? 'currency' : 'currencies'}`

  return (
    <article className="group relative overflow-hidden rounded-xl border border-emerald-500/15 bg-neutral-950/75 p-4 shadow-card backdrop-blur-xl transition duration-200 hover:border-emerald-400/30 hover:shadow-card-hover">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/70 via-emerald-400/20 to-amber-400/40" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl transition duration-200 group-hover:bg-emerald-500/15" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">{code}</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-700">{label}</h3>
        </div>
        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
      </div>
      {currencyTotals.length > 0 ? (
        <dl className="relative mt-5 space-y-3">
          {currencyTotals.map(([currency, total]) => (
            <div key={currency}>
              <dt className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-300">{currency}</dt>
              <dd className="mt-1 break-words text-2xl font-light leading-7 tracking-[-0.03em] text-slate-900">{total.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      ) : <p className="relative mt-5 text-lg font-light tracking-tight text-slate-400">No renewals</p>}
      <p className="relative mt-5 border-t border-neutral-800/80 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">{currencyLabel}</p>
    </article>
  )
}

function DashboardSection({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

function RenewalCard({ isUpdatingPaymentStatus, onMarkAsPaid, onPaymentStatusChange, subscription }: { isUpdatingPaymentStatus: boolean; onMarkAsPaid: () => void; onPaymentStatusChange: (paymentStatus: Subscription['paymentStatus']) => void; subscription: Subscription }) {
  const borderClass = getSubscriptionBorderClass(subscription)

  return (
    <article className={`ui-card ui-card-interactive rounded-2xl p-4 ${borderClass}`}>
      <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-900">{subscription.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{formatDate(subscription.nextRenewalDate)}</p>
        </div>
        <ReminderBadge nextRenewalDate={subscription.nextRenewalDate} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
        <p className="font-bold text-teal-700">{subscription.currency} {subscription.price.toLocaleString()}</p>
        <PaymentStatusBadge paymentStatus={subscription.paymentStatus} />
      </div>
      <label className="mt-3 block text-xs font-bold text-slate-600">
        Quick payment status
        <select aria-label={`Quick payment status for ${subscription.name}`} className="field-control mt-1.5 py-2.5 font-semibold text-slate-700" disabled={isUpdatingPaymentStatus} onChange={(event) => onPaymentStatusChange(event.target.value as Subscription['paymentStatus'])} value={subscription.paymentStatus}>
          {paymentStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <button className="btn-secondary mt-3 w-full min-h-10 py-2" onClick={onMarkAsPaid} type="button">Mark as Paid</button>
    </article>
  )
}


function buildDashboardData(subscriptions: Subscription[]) {
  const today = startOfToday()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const inRange = (subscription: Subscription, start: Date, end: Date) => {
    const renewalDate = parseLocalDate(subscription.nextRenewalDate)
    return renewalDate >= start && renewalDate <= end
  }

  const needsAttention = subscriptions.filter(needsAttentionNow)
  const needsAttentionIds = new Set(needsAttention.map(({ id }) => id))
  const withoutAttentionItems = subscriptions.filter(({ id }) => !needsAttentionIds.has(id))

  return {
    thisMonth: totalByCurrency(subscriptions.filter((subscription) => inRange(subscription, startOfMonth, endOfMonth))),
    nextSevenDays: totalByCurrency(subscriptions.filter((subscription) => inRange(subscription, today, addDays(today, 7)))),
    nextThirtyDays: totalByCurrency(subscriptions.filter((subscription) => inRange(subscription, today, addDays(today, 30)))),
    needsAttention,
    nextSevenDaysGroup: withoutAttentionItems.filter((subscription) => inDaysRange(subscription, 0, 7)),
    nextThirtyDaysGroup: withoutAttentionItems.filter((subscription) => inDaysRange(subscription, 8, 30)),
    later: withoutAttentionItems.filter((subscription) => differenceInDays(subscription.nextRenewalDate) > 30),
  }
}


function needsAttentionNow(subscription: Subscription) {
  const daysUntilRenewal = differenceInDays(subscription.nextRenewalDate)
  return daysUntilRenewal <= 3
    || daysUntilRenewal <= getReminderDaysBefore(subscription)
    || subscription.paymentStatus === 'need_top_up'
    || subscription.paymentStatus === 'review_first'
}

function inDaysRange(subscription: Subscription, start: number, end: number) {
  const daysUntilRenewal = differenceInDays(subscription.nextRenewalDate)
  return daysUntilRenewal >= start && daysUntilRenewal <= end
}

function totalByCurrency(subscriptions: Subscription[]) {
  return subscriptions.reduce<CurrencyTotals>((totals, subscription) => {
    totals[subscription.currency] = (totals[subscription.currency] ?? 0) + subscription.price
    return totals
  }, {})
}


function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parseLocalDate(date))
}
