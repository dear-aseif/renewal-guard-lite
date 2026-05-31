import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { db, type Subscription } from '../db/database'
import { EmptyState } from './EmptyState'
import { PaymentStatusBadge, ReminderBadge } from './StatusBadge'
import { differenceInDays, getSubscriptionBorderClass, parseLocalDate, startOfToday } from '../utils/subscriptionStatus'

type CurrencyTotals = Partial<Record<Subscription['currency'], number>>

type DashboardProps = {
  onAdd: () => void
}

export function Dashboard({ onAdd }: DashboardProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (isLoading) return <EmptyState description="Reading your locally saved subscriptions." icon="storage" title="Loading your renewal summary..." />

  if (error) return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>

  if (subscriptions.length === 0) {
    return <EmptyState action={<button className="mt-5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800" onClick={onAdd} type="button">Add your first subscription</button>} description="Add your first subscription to see your renewal summary." icon="subscriptions" title="No subscriptions yet" />
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Renewal summary</h2>
          <p className="mt-1 text-sm text-slate-500">Totals stay separated by currency. No conversions are applied.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <SummaryCard label="This month" totals={dashboard.thisMonth} />
          <SummaryCard label="Next 7 days" totals={dashboard.nextSevenDays} />
          <SummaryCard label="Next 30 days" totals={dashboard.nextThirtyDays} />
        </div>
      </section>

      <DashboardSection description="Overdue, due today, urgent, or waiting for a top up." title="Needs Attention">
        {dashboard.needsAttention.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {dashboard.needsAttention.map((subscription) => <RenewalCard key={subscription.id} subscription={subscription} />)}
          </div>
        ) : <EmptyState description="Your urgent renewals and top-up reminders will appear here." icon="shield" title="No items need attention" />}
      </DashboardSection>

      <DashboardSection description="Your closest renewal dates, sorted from nearest to furthest." title="Nearest upcoming renewals">
        {dashboard.upcoming.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {dashboard.upcoming.map((subscription) => <RenewalCard key={subscription.id} subscription={subscription} />)}
          </div>
        ) : <EmptyState description="Future renewal dates will appear here after you add them." icon="calendar" title="No upcoming renewals" />}
      </DashboardSection>
    </div>
  )
}

function SummaryCard({ label, totals }: { label: string; totals: CurrencyTotals }) {
  const currencyTotals = Object.entries(totals) as [Subscription['currency'], number][]

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{label}</p>
      {currencyTotals.length > 0 ? (
        <div className="mt-4 space-y-2">
          {currencyTotals.map(([currency, total]) => <p className="text-xl font-bold tracking-tight text-slate-900" key={currency}>{currency} {total.toLocaleString()}</p>)}
        </div>
      ) : <p className="mt-4 text-xl font-bold tracking-tight text-slate-400">No renewals</p>}
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

function RenewalCard({ subscription }: { subscription: Subscription }) {
  const borderClass = getSubscriptionBorderClass(subscription)

  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-card ${borderClass}`}>
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

  return {
    thisMonth: totalByCurrency(subscriptions.filter((subscription) => inRange(subscription, startOfMonth, endOfMonth))),
    nextSevenDays: totalByCurrency(subscriptions.filter((subscription) => inRange(subscription, today, addDays(today, 7)))),
    nextThirtyDays: totalByCurrency(subscriptions.filter((subscription) => inRange(subscription, today, addDays(today, 30)))),
    needsAttention: subscriptions.filter((subscription) => differenceInDays(subscription.nextRenewalDate) <= 3 || subscription.paymentStatus === 'need_top_up'),
    upcoming: subscriptions.filter((subscription) => differenceInDays(subscription.nextRenewalDate) >= 0).slice(0, 6),
  }
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
