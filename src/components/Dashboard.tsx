import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { db, type Subscription } from '../db/database'
import { EmptyState } from './EmptyState'
import { PaymentStatusBadge, ReminderBadge } from './StatusBadge'
import { markSubscriptionAsPaid } from '../utils/renewalHistory'
import { differenceInDays, getSubscriptionBorderClass, parseLocalDate, startOfToday } from '../utils/subscriptionStatus'
import { changeSubscriptionPaymentStatus, paymentStatusOptions } from '../utils/paymentStatus'

type CurrencyTotals = Partial<Record<Subscription['currency'], number>>
type SummaryFilter = 'activeThisMonth' | 'thisMonth' | 'dueNow' | 'nextSevenDays'
type SubscriptionWithOptionalStatus = Subscription & { status?: string }

type DashboardProps = {
  onAdd: () => void
}

export function Dashboard({ onAdd }: DashboardProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [toast, setToast] = useState('')
  const [updatingPaymentStatusId, setUpdatingPaymentStatusId] = useState<string>()
  const [selectedSummary, setSelectedSummary] = useState<SummaryFilter>('thisMonth')
  const selectedRenewalsRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!toast) return

    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function showToast(message: string) {
    setToast(message)
  }

  async function updatePaymentStatus(subscription: Subscription, paymentStatus: Subscription['paymentStatus']) {
    setError('')
    setSuccess('')
    setUpdatingPaymentStatusId(subscription.id)

    try {
      const updatedSubscription = changeSubscriptionPaymentStatus(subscription, paymentStatus)
      await db.subscriptions.put(updatedSubscription)
      setSubscriptions((currentSubscriptions) => currentSubscriptions.map((currentSubscription) => currentSubscription.id === updatedSubscription.id ? updatedSubscription : currentSubscription))
      const statusLabel = paymentStatusOptions.find(({ value }) => value === paymentStatus)?.label ?? paymentStatus
      const message = `${subscription.name} payment status updated to ${statusLabel}.`
      setSuccess(message)
      showToast('Payment status updated')
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
      const message = `${subscription.name} marked as paid. Next renewal: ${formatDate(updatedSubscription.nextRenewalDate)}.`
      setSuccess(message)
      showToast('Marked as paid')
    } catch (markAsPaidError) {
      setError(markAsPaidError instanceof Error ? markAsPaidError.message : 'The subscription could not be marked as paid. Please try again.')
    }
  }

  if (isLoading) return <EmptyState description="Reading subscription data stored on this device." icon="storage" title="Preparing your renewal summary..." />

  if (error) return <p className="feedback-error" role="alert">{error}</p>

  if (subscriptions.length === 0) {
    return <EmptyState action={<button className="btn-primary mt-5" onClick={onAdd} type="button">Add your first subscription</button>} description="Add a subscription to start tracking upcoming payments and renewal reminders." icon="subscriptions" title="No subscriptions yet" />
  }

  const renderRenewalCard = (subscription: Subscription) => <RenewalCard isUpdatingPaymentStatus={updatingPaymentStatusId === subscription.id} key={subscription.id} onMarkAsPaid={() => void markAsPaid(subscription)} onPaymentStatusChange={(paymentStatus) => void updatePaymentStatus(subscription, paymentStatus)} subscription={subscription} />
  const selectedSummaryContent = getSelectedSummaryContent(dashboard, selectedSummary)

  function selectSummary(summary: SummaryFilter) {
    setSelectedSummary(summary)
    window.requestAnimationFrame(() => selectedRenewalsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }))
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {success && <p className="feedback-success" role="status">{success}</p>}
      <section aria-labelledby="renewal-summary-title">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-300 sm:text-[10px] sm:tracking-[0.18em]">Renewal metrics</p>
            <h2 className="mt-2 text-[30px] font-light leading-9 tracking-[-0.025em] text-slate-900 sm:text-4xl" id="renewal-summary-title">Renewal summary</h2>
          </div>
          <p className="max-w-md text-[15px] leading-6 text-slate-500 sm:text-right sm:text-sm">Select a card to review the matching renewals. Totals stay separated by currency.</p>
        </div>
        <CountSummaryCard active={selectedSummary === 'activeThisMonth'} count={dashboard.activeThisMonthSubscriptions.length} label="Active This Month" onSelect={() => selectSummary('activeThisMonth')} />
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-4">
          <SummaryCard active={selectedSummary === 'thisMonth'} code="MTH" description="Renewals scheduled in the current calendar month." featured label="This Month" onSelect={() => selectSummary('thisMonth')} subscriptions={dashboard.thisMonthSubscriptions} totals={dashboard.thisMonth} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4">
            <SummaryCard active={selectedSummary === 'dueNow'} attention code="NOW" description="Overdue or renewing within the next 3 days." label="Due Now" onSelect={() => selectSummary('dueNow')} subscriptions={dashboard.dueNow} totals={dashboard.dueNowTotals} />
            <SummaryCard active={selectedSummary === 'nextSevenDays'} code="7D" description="Renewals scheduled from today through the next 7 days." label="Next 7 Days" onSelect={() => selectSummary('nextSevenDays')} subscriptions={dashboard.nextSevenDaysSubscriptions} totals={dashboard.nextSevenDays} />
          </div>
        </div>
        <div className="mt-5 scroll-mt-20 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-card backdrop-blur-xl sm:p-5" ref={selectedRenewalsRef}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-300 sm:text-[10px]">Showing</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Showing: {selectedSummaryContent.title}</h3>
            </div>
            <p className="text-[15px] leading-6 text-slate-500 sm:text-right sm:text-sm">{selectedSummaryContent.subscriptions.length} matching subscription{selectedSummaryContent.subscriptions.length === 1 ? '' : 's'}</p>
          </div>
          <RenewalCardGrid emptyDescription={selectedSummaryContent.emptyDescription} emptyTitle={selectedSummaryContent.emptyTitle} renderSubscription={renderRenewalCard} subscriptions={selectedSummaryContent.subscriptions} />
        </div>
      </section>
      {toast && (
        <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm rounded-xl border border-emerald-400/35 bg-neutral-900/95 px-4 py-3 text-center text-[15px] font-semibold leading-5 text-emerald-100 shadow-card-hover backdrop-blur-xl lg:bottom-6" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function RenewalCardGrid({ emptyDescription, emptyTitle, renderSubscription, subscriptions }: { emptyDescription: string; emptyTitle: string; renderSubscription: (subscription: Subscription) => ReactNode; subscriptions: Subscription[] }) {
  if (subscriptions.length === 0) return <EmptyState description={emptyDescription} icon="calendar" title={emptyTitle} />

  return <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">{subscriptions.map(renderSubscription)}</div>
}

function CountSummaryCard({ active, count, label, onSelect }: { active: boolean; count: number; label: string; onSelect: () => void }) {
  return (
    <button aria-pressed={active} className={`group relative w-full overflow-hidden rounded-xl border bg-neutral-900/90 p-3 text-left shadow-card backdrop-blur-xl transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:p-4 ${active ? 'border-emerald-400/70 ring-1 ring-emerald-400/30' : 'border-neutral-700/80 hover:border-emerald-400/45'}`} onClick={onSelect} type="button">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/80 via-emerald-400/30 to-amber-400/50" />
      <span className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-emerald-500/15 blur-2xl transition duration-200 group-hover:bg-emerald-500/20" />
      <span className="relative flex items-start justify-between gap-3">
        <span>
          <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-300 sm:text-[10px]">Active count</span>
          <span className="mt-2 block text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{label}</span>
        </span>
        <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${active ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-neutral-700 bg-neutral-800/80 text-slate-500'}`}>{active ? 'Active' : 'View'}</span>
      </span>
      <span className="relative mt-4 block text-3xl font-light leading-9 tracking-[-0.03em] text-slate-900">{count}</span>
      <span className="relative mt-2 block border-t border-neutral-700/70 pt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400 sm:text-[10px]">subscriptions</span>
    </button>
  )
}

function SummaryCard({ active, attention = false, code, description, featured = false, label, onSelect, subscriptions, totals }: { active: boolean; attention?: boolean; code: string; description: string; featured?: boolean; label: string; onSelect: () => void; subscriptions: Subscription[]; totals: CurrencyTotals }) {
  const currencyTotals = Object.entries(totals) as [Subscription['currency'], number][]
  const currencyLabel = `${currencyTotals.length} ${currencyTotals.length === 1 ? 'currency' : 'currencies'}`
  const borderClass = attention
    ? active ? 'border-orange-400/80 ring-1 ring-orange-400/45' : 'border-orange-500/60 hover:border-orange-400/80'
    : active ? 'border-emerald-400/70 ring-1 ring-emerald-400/30' : 'border-neutral-700/80 hover:border-emerald-400/45'

  return (
    <button aria-pressed={active} className={`group relative w-full overflow-hidden rounded-xl border bg-neutral-900/90 p-4 text-left shadow-card backdrop-blur-xl transition duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${featured ? 'sm:min-h-64 sm:p-5' : 'p-3 sm:min-h-40 sm:p-4'} ${borderClass}`} onClick={onSelect} type="button">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/80 via-emerald-400/30 to-amber-400/50" />
      <span className={`pointer-events-none absolute -right-8 -top-8 rounded-full blur-2xl transition duration-200 ${attention ? 'bg-orange-500/20 group-hover:bg-orange-500/30' : 'bg-emerald-500/15 group-hover:bg-emerald-500/20'} ${featured ? 'h-28 w-28' : 'h-20 w-20'}`} />
      <span className="relative flex items-start justify-between gap-3">
        <span>
          <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-300 sm:text-[10px]">{code}</span>
          <span className={`mt-2 block font-semibold tracking-tight text-slate-900 ${featured ? 'text-xl' : 'text-base sm:text-lg'}`}>{label}</span>
        </span>
        <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${active ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-neutral-700 bg-neutral-800/80 text-slate-500'}`}>{active ? 'Active' : 'View'}</span>
      </span>
      <span className={`relative mt-2 max-w-md text-[15px] leading-6 text-slate-500 sm:block sm:text-sm ${featured ? 'block' : 'hidden'}`}>{description}</span>
      {currencyTotals.length > 0 ? (
        <span className="relative mt-5 flex flex-wrap gap-x-5 gap-y-3">
          {currencyTotals.map(([currency, total]) => (
            <span className="inline-flex min-w-0 items-baseline gap-1.5 whitespace-nowrap" key={currency}>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-300 sm:text-[10px]">{currency}</span>
              <span className={`${featured ? 'text-3xl leading-9' : 'text-xl leading-7 sm:text-2xl'} font-light tracking-[-0.03em] text-slate-900`}>{total.toLocaleString()}</span>
            </span>
          ))}
        </span>
      ) : <span className="relative mt-5 block text-lg font-light tracking-tight text-slate-400">No renewals</span>}
      <span className="relative mt-5 block border-t border-neutral-700/70 pt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400 sm:text-[10px]">{subscriptions.length} subscription{subscriptions.length === 1 ? '' : 's'} · {currencyLabel}</span>
    </button>
  )
}

function getSelectedSummaryContent(dashboard: ReturnType<typeof buildDashboardData>, selectedSummary: SummaryFilter) {
  if (selectedSummary === 'activeThisMonth') return { emptyDescription: 'No active subscriptions renew during the current calendar month.', emptyTitle: 'No active subscriptions this month', subscriptions: dashboard.activeThisMonthSubscriptions, title: 'Active This Month' }
  if (selectedSummary === 'dueNow') return { emptyDescription: 'Nothing is overdue or renewing within the next 3 days.', emptyTitle: 'Nothing is due now', subscriptions: dashboard.dueNow, title: 'Due Now' }
  if (selectedSummary === 'nextSevenDays') return { emptyDescription: 'No subscriptions renew from today through the next 7 days.', emptyTitle: 'No renewals in the next 7 days', subscriptions: dashboard.nextSevenDaysSubscriptions, title: 'Next 7 Days' }
  return { emptyDescription: 'No subscriptions renew during the current calendar month.', emptyTitle: 'No renewals this month', subscriptions: dashboard.thisMonthSubscriptions, title: 'This Month' }
}


function RenewalCard({ isUpdatingPaymentStatus, onMarkAsPaid, onPaymentStatusChange, subscription }: { isUpdatingPaymentStatus: boolean; onMarkAsPaid: () => void; onPaymentStatusChange: (paymentStatus: Subscription['paymentStatus']) => void; subscription: Subscription }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const borderClass = getSubscriptionBorderClass(subscription)

  return (
    <article className={`ui-card ui-card-interactive rounded-xl ${borderClass}`}>
      <button aria-expanded={isExpanded} aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${subscription.name} subscription details`} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition duration-200 hover:bg-neutral-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:p-4" onClick={() => setIsExpanded((currentState) => !currentState)} type="button">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-slate-900">{subscription.name}</h3>
          <p className="mt-1 text-[15px] leading-6 font-semibold text-slate-500 sm:text-sm">{formatDate(subscription.nextRenewalDate)}</p>
        </div>
        <ReminderBadge nextRenewalDate={subscription.nextRenewalDate} />
        <svg aria-hidden="true" className={`h-4 w-4 shrink-0 text-emerald-300 transition duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isExpanded && (
        <div className="border-t border-neutral-800/80 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[15px] leading-6 sm:text-sm">
            <p className="font-bold text-teal-700">{subscription.currency} {subscription.price.toLocaleString()}</p>
            <PaymentStatusBadge paymentStatus={subscription.paymentStatus} />
          </div>
          <label className="mt-3 block font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500 sm:text-[10px] sm:tracking-[0.12em]">
            Payment readiness
            <select aria-label={`Payment readiness for ${subscription.name}`} className="field-control mt-1.5 py-2.5 font-semibold text-slate-700" disabled={isUpdatingPaymentStatus} onChange={(event) => onPaymentStatusChange(event.target.value as Subscription['paymentStatus'])} value={subscription.paymentStatus}>
              {paymentStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button className="btn-secondary mt-3 w-full min-h-10 py-2" disabled={isUpdatingPaymentStatus} onClick={onMarkAsPaid} type="button">Mark as Paid</button>
        </div>
      )}
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

  const thisMonthSubscriptions = subscriptions.filter((subscription) => inRange(subscription, startOfMonth, endOfMonth))
  const activeThisMonthSubscriptions = thisMonthSubscriptions.filter(isActiveSubscription)
  const dueNow = subscriptions.filter(isDueNow)
  const nextSevenDaysSubscriptions = subscriptions.filter((subscription) => inRange(subscription, today, addDays(today, 7)))

  return {
    activeThisMonthSubscriptions,
    thisMonth: totalByCurrency(thisMonthSubscriptions),
    thisMonthSubscriptions,
    dueNow,
    dueNowTotals: totalByCurrency(dueNow),
    nextSevenDays: totalByCurrency(nextSevenDaysSubscriptions),
    nextSevenDaysSubscriptions,
  }
}


function isActiveSubscription(subscription: Subscription) {
  return (subscription as SubscriptionWithOptionalStatus).status !== 'cancelled'
}

function isDueNow(subscription: Subscription) {
  const daysUntilRenewal = differenceInDays(subscription.nextRenewalDate)
  return daysUntilRenewal <= 3
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
