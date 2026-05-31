import { useEffect, useMemo, useState } from 'react'
import { db, type Subscription } from '../db/database'
import { EmptyState } from './EmptyState'
import { PaymentStatusBadge, ReminderBadge } from './StatusBadge'
import { getSubscriptionBorderClass } from '../utils/subscriptionStatus'

type SubscriptionListProps = {
  onAdd: () => void
  onEdit: (subscription: Subscription) => void
}

export function SubscriptionList({ onAdd, onEdit }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadSubscriptions() {
      try {
        const savedSubscriptions = await db.subscriptions.orderBy('nextRenewalDate').toArray()
        if (isCurrent) setSubscriptions(savedSubscriptions)
      } catch {
        if (isCurrent) setError('Your subscriptions could not be loaded. Please try again.')
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
    if (!query) return subscriptions
    return subscriptions.filter((subscription) => subscription.name.toLocaleLowerCase().includes(query))
  }, [search, subscriptions])

  async function deleteSubscription(subscription: Subscription) {
    const shouldDelete = window.confirm(`Delete ${subscription.name}? This cannot be undone.`)
    if (!shouldDelete) return

    setError('')

    try {
      await db.subscriptions.delete(subscription.id)
      setSubscriptions((currentSubscriptions) => currentSubscriptions.filter(({ id }) => id !== subscription.id))
    } catch {
      setError('The subscription could not be deleted. Please try again.')
    }
  }

  if (isLoading) {
    return <EmptyState description="Reading subscriptions stored on this device." icon="storage" title="Loading your subscriptions..." />
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <label className="block text-sm font-bold text-slate-700" htmlFor="subscription-search">Search subscriptions</label>
        <div className="relative mt-2">
          <svg aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
          <input className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" id="subscription-search" onChange={(event) => setSearch(event.target.value)} placeholder="Search by subscription name" type="search" value={search} />
        </div>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Saved subscriptions</h2>
          <p className="mt-1 text-sm text-slate-500">Sorted by nearest renewal date.</p>
        </div>
        <button className="shrink-0 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800" onClick={onAdd} type="button">Add new</button>
      </div>

      {visibleSubscriptions.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleSubscriptions.map((subscription) => (
            <SubscriptionCard key={subscription.id} onDelete={() => void deleteSubscription(subscription)} onEdit={() => onEdit(subscription)} subscription={subscription} />
          ))}
        </div>
      ) : (
        <EmptyState
          action={subscriptions.length === 0 ? <button className="mt-5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800" onClick={onAdd} type="button">Add your first subscription</button> : undefined}
          description={subscriptions.length === 0 ? 'Add your first subscription to start tracking renewals.' : 'Try a different subscription name.'}
          icon="subscriptions"
          title={subscriptions.length === 0 ? 'No subscriptions yet' : 'No matching subscriptions'}
        />
      )}
    </section>
  )
}

function SubscriptionCard({ onDelete, onEdit, subscription }: { onDelete: () => void; onEdit: () => void; subscription: Subscription }) {
  const borderClass = getSubscriptionBorderClass(subscription)

  return (
    <article className={`rounded-3xl border bg-white p-5 shadow-card ${borderClass}`}>
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-slate-900">{subscription.name}</h3>
          <p className="mt-1 text-sm font-bold text-teal-700">{formatPrice(subscription)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 min-[420px]:shrink-0 min-[420px]:justify-end">
          <ReminderBadge nextRenewalDate={subscription.nextRenewalDate} />
          <PaymentStatusBadge paymentStatus={subscription.paymentStatus} />
        </div>
      </div>

      <dl className="mt-5 grid gap-3 border-y border-slate-100 py-4 text-sm">
        <Detail label="Billing cycle" value={formatBillingCycle(subscription)} />
        <Detail label="Next renewal" value={formatDate(subscription.nextRenewalDate)} />
        <Detail label="Payment method" value={subscription.paymentMethod || 'Not added'} />
        <Detail label="Account email" value={subscription.accountEmail || 'Not added'} />
      </dl>

      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-xl px-3 py-2 text-sm font-bold text-teal-700 transition hover:bg-teal-50" onClick={onEdit} type="button">Edit</button>
        <button className="rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50" onClick={onDelete} type="button">Delete</button>
      </div>
    </article>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all text-right font-semibold text-slate-700">{value}</dd>
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
