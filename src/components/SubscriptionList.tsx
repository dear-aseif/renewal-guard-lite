import { useEffect, useMemo, useState } from 'react'
import { db, type Subscription } from '../db/database'
import { EmptyState } from './EmptyState'
import { PaymentStatusBadge, ReminderBadge } from './StatusBadge'
import { markSubscriptionAsPaid } from '../utils/renewalHistory'
import { differenceInDays, getSubscriptionBorderClass, parseLocalDate, startOfToday } from '../utils/subscriptionStatus'
import { changeSubscriptionPaymentStatus, paymentStatusOptions } from '../utils/paymentStatus'
import { getReminderDaysBefore } from '../utils/reminderDays'

type SubscriptionListProps = {
  onAdd: () => void
  onEdit: (subscription: Subscription) => void
}

type SubscriptionFilter = 'all' | 'thisMonth' | 'dueNow' | 'nextSevenDays'

const filterOptions: { label: string; value: SubscriptionFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Due Now', value: 'dueNow' },
  { label: 'Next 7 Days', value: 'nextSevenDays' },
]

export function SubscriptionList({ onAdd, onEdit }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<SubscriptionFilter>('all')
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' }>()
  const [updatingPaymentStatusId, setUpdatingPaymentStatusId] = useState<string>()

  useEffect(() => {
    let isCurrent = true

    async function loadSubscriptions() {
      try {
        const savedSubscriptions = await db.subscriptions.orderBy('nextRenewalDate').toArray()
        if (isCurrent) setSubscriptions(savedSubscriptions)
      } catch {
        if (isCurrent) setMessage({ text: 'Your subscriptions could not be loaded. Please try again.', type: 'error' })
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadSubscriptions()

    return () => {
      isCurrent = false
    }
  }, [])

  const visibleSubscriptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return subscriptions.filter((subscription) => {
      const matchesSearch = !query || subscription.name.toLocaleLowerCase().includes(query)
      return matchesSearch && matchesFilter(subscription, activeFilter)
    })
  }, [activeFilter, search, subscriptions])

  useEffect(() => {
    if (!expandedSubscriptionId) return
    if (!visibleSubscriptions.some(({ id }) => id === expandedSubscriptionId)) setExpandedSubscriptionId(undefined)
  }, [expandedSubscriptionId, visibleSubscriptions])

  async function deleteSubscription(subscription: Subscription) {
    const shouldDelete = window.confirm(`Delete ${subscription.name}? This cannot be undone.`)
    if (!shouldDelete) return

    setMessage(undefined)

    try {
      await db.subscriptions.delete(subscription.id)
      setSubscriptions((currentSubscriptions) => currentSubscriptions.filter(({ id }) => id !== subscription.id))
      setExpandedSubscriptionId((currentId) => currentId === subscription.id ? undefined : currentId)
    } catch {
      setMessage({ text: 'The subscription could not be deleted. Please try again.', type: 'error' })
    }
  }

  async function updatePaymentStatus(subscription: Subscription, paymentStatus: Subscription['paymentStatus']) {
    setMessage(undefined)
    setUpdatingPaymentStatusId(subscription.id)

    try {
      const updatedSubscription = changeSubscriptionPaymentStatus(subscription, paymentStatus)
      await db.subscriptions.put(updatedSubscription)
      setSubscriptions((currentSubscriptions) => currentSubscriptions.map((currentSubscription) => currentSubscription.id === updatedSubscription.id ? updatedSubscription : currentSubscription))
      const statusLabel = paymentStatusOptions.find(({ value }) => value === paymentStatus)?.label ?? paymentStatus
      setMessage({ text: `${subscription.name} payment status updated to ${statusLabel}.`, type: 'success' })
    } catch {
      setMessage({ text: 'The payment status could not be updated. Please try again.', type: 'error' })
    } finally {
      setUpdatingPaymentStatusId(undefined)
    }
  }

  async function markAsPaid(subscription: Subscription) {
    const shouldAdvance = window.confirm(`Mark ${subscription.name} as paid and move its renewal date forward?`)
    if (!shouldAdvance) return

    setMessage(undefined)

    try {
      const updatedSubscription = await markSubscriptionAsPaid(subscription)
      setSubscriptions((currentSubscriptions) => currentSubscriptions
        .map((currentSubscription) => currentSubscription.id === updatedSubscription.id ? updatedSubscription : currentSubscription)
        .sort((first, second) => first.nextRenewalDate.localeCompare(second.nextRenewalDate)))
      setMessage({ text: `${subscription.name} marked as paid. Next renewal: ${formatDate(updatedSubscription.nextRenewalDate)}.`, type: 'success' })
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'The subscription could not be marked as paid. Please try again.', type: 'error' })
    }
  }

  if (isLoading) {
    return <EmptyState description="Reading subscription data stored on this device." icon="storage" title="Loading your subscriptions..." />
  }

  return (
    <section className="space-y-5">
      <div className="sticky top-16 z-10 rounded-2xl border border-emerald-500/15 bg-neutral-950/90 p-3 shadow-card backdrop-blur-xl sm:p-4 lg:top-4">
        <label className="block text-[15px] leading-6 font-bold text-slate-700 sm:text-sm" htmlFor="subscription-search">Search subscriptions</label>
        <div className="relative mt-2">
          <svg aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
          <input className="field-control py-3 pl-11 pr-3.5" id="subscription-search" onChange={(event) => setSearch(event.target.value)} placeholder="Search by subscription name" type="search" value={search} />
        </div>
        <div aria-label="Subscription filters" className="mt-3 flex gap-2 overflow-x-auto pb-1" role="list">
          {filterOptions.map((filter) => (
            <button aria-pressed={activeFilter === filter.value} className={`shrink-0 rounded-full border px-3 py-2 text-[13px] font-bold transition duration-200 ease-out ${activeFilter === filter.value ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200' : 'border-neutral-700 bg-neutral-900/80 text-slate-500 hover:border-emerald-500/40 hover:text-emerald-300'}`} key={filter.value} onClick={() => setActiveFilter(filter.value)} role="listitem" type="button">
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {message && <p className={message.type === 'success' ? 'feedback-success' : 'feedback-error'} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}

      <div className="flex flex-col items-stretch gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Saved subscriptions</h2>
          <p className="mt-1 text-[15px] leading-6 text-slate-500 sm:text-sm">Sorted by nearest renewal date.</p>
        </div>
        <button className="btn-primary hidden shrink-0 sm:inline-flex" onClick={onAdd} type="button">Add new</button>
      </div>

      {visibleSubscriptions.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {visibleSubscriptions.map((subscription) => (
            <SubscriptionCard expanded={expandedSubscriptionId === subscription.id} isUpdatingPaymentStatus={updatingPaymentStatusId === subscription.id} key={subscription.id} onDelete={() => void deleteSubscription(subscription)} onEdit={() => onEdit(subscription)} onMarkAsPaid={() => void markAsPaid(subscription)} onPaymentStatusChange={(paymentStatus) => void updatePaymentStatus(subscription, paymentStatus)} onToggle={() => setExpandedSubscriptionId((currentId) => currentId === subscription.id ? undefined : subscription.id)} subscription={subscription} />
          ))}
        </div>
      ) : (
        <EmptyState
          action={subscriptions.length === 0 ? <button className="btn-primary mt-5 hidden sm:inline-flex" onClick={onAdd} type="button">Add your first subscription</button> : undefined}
          description={subscriptions.length === 0 ? 'Add your first subscription to start tracking renewal dates and payment readiness.' : 'Try another name or clear the search field.'}
          icon="subscriptions"
          title={subscriptions.length === 0 ? 'No subscriptions yet' : 'No matching subscriptions'}
        />
      )}
    </section>
  )
}

function SubscriptionCard({ expanded, isUpdatingPaymentStatus, onDelete, onEdit, onMarkAsPaid, onPaymentStatusChange, onToggle, subscription }: { expanded: boolean; isUpdatingPaymentStatus: boolean; onDelete: () => void; onEdit: () => void; onMarkAsPaid: () => void; onPaymentStatusChange: (paymentStatus: Subscription['paymentStatus']) => void; onToggle: () => void; subscription: Subscription }) {
  const borderClass = getSubscriptionBorderClass(subscription)

  return (
    <article className={`ui-card ui-card-interactive overflow-hidden ${borderClass}`}>
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">{subscription.name}</h3>
            <p className="font-bold text-teal-700">{formatPrice(subscription)}</p>
          </div>
          <p className="mt-1 text-[15px] leading-6 font-semibold text-slate-500 sm:text-sm">{formatRenewalTiming(subscription.nextRenewalDate)}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <ReminderBadge nextRenewalDate={subscription.nextRenewalDate} />
            <PaymentStatusBadge paymentStatus={subscription.paymentStatus} />
          </div>
        </div>
        <button aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${subscription.name} subscription details`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/80 text-emerald-300 transition duration-200 hover:border-emerald-500/40 hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400" onClick={onToggle} type="button">
          <svg aria-hidden="true" className={`h-4 w-4 transition duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-neutral-800/80 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
          <dl className="grid gap-3 text-[15px] leading-6 sm:grid-cols-2 sm:text-sm">
            <Detail label="Billing cycle" value={formatBillingCycle(subscription)} />
            <Detail label="Next renewal" value={formatDate(subscription.nextRenewalDate)} />
            <Detail label="Reminder window" value={`${getReminderDaysBefore(subscription)} days before`} />
            <Detail label="Payment method" value={subscription.paymentMethod || 'Not added'} />
            <Detail label="Account email" value={subscription.accountEmail || 'Not added'} />
            <Detail label="Created" value={formatDateTime(subscription.createdAt)} />
            <Detail label="Updated" value={formatDateTime(subscription.updatedAt)} />
          </dl>
          {subscription.notes && <p className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 text-[15px] leading-6 text-slate-500 sm:text-sm">{subscription.notes}</p>}

          <label className="mt-4 block text-[15px] leading-6 font-bold text-slate-700 sm:text-sm">
            Payment readiness
            <select aria-label={`Payment readiness for ${subscription.name}`} className="field-control mt-2 font-semibold text-slate-700" disabled={isUpdatingPaymentStatus} onChange={(event) => onPaymentStatusChange(event.target.value as Subscription['paymentStatus'])} value={subscription.paymentStatus}>
              {paymentStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <div className="mt-4 grid grid-cols-2 gap-2 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:justify-end">
            <button className="btn-primary col-span-2 w-full px-3 py-2 min-[420px]:mr-auto min-[420px]:w-auto" onClick={onMarkAsPaid} type="button">Mark as Paid</button>
            <button className="btn-ghost w-full text-teal-700 hover:bg-teal-50 hover:text-teal-800 min-[420px]:w-auto" onClick={onEdit} type="button">Edit</button>
            <button className="btn-ghost w-full text-red-600 hover:bg-red-50 hover:text-red-700 min-[420px]:w-auto" onClick={onDelete} type="button">Delete</button>
          </div>
        </div>
      )}
    </article>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between min-[420px]:gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 break-all text-left font-semibold text-slate-700 min-[420px]:text-right">{value}</dd>
    </div>
  )
}


function formatBillingCycle(subscription: Subscription) {
  if (subscription.billingCycle === 'custom') return `Every ${subscription.customCycleDays} days`
  return `${subscription.billingCycle[0].toUpperCase()}${subscription.billingCycle.slice(1)}`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`))
}

function formatPrice(subscription: Subscription) {
  return `${subscription.currency} ${subscription.price.toLocaleString()}`
}

function matchesFilter(subscription: Subscription, filter: SubscriptionFilter) {
  if (filter === 'all') return true

  const today = startOfToday()
  const renewalDate = parseLocalDate(subscription.nextRenewalDate)

  if (filter === 'thisMonth') {
    return renewalDate.getFullYear() === today.getFullYear() && renewalDate.getMonth() === today.getMonth()
  }

  const daysUntilRenewal = differenceInDays(subscription.nextRenewalDate)
  if (filter === 'dueNow') return daysUntilRenewal >= 0 && daysUntilRenewal <= 3
  return daysUntilRenewal >= 0 && daysUntilRenewal <= 7
}

function formatRenewalTiming(date: string) {
  const daysUntilRenewal = differenceInDays(date)
  if (daysUntilRenewal < 0) return `${formatDate(date)} · overdue`
  if (daysUntilRenewal === 0) return 'Renews today'
  if (daysUntilRenewal === 1) return 'Renewal in 1 day'
  return `Renewal in ${daysUntilRenewal} days`
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}
