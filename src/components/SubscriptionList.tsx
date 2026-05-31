import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { db, type Subscription } from '../db/database'

type SubscriptionListProps = {
  onAdd: () => void
  onEdit: (subscription: Subscription) => void
}

const paymentStatusLabels: Record<Subscription['paymentStatus'], string> = {
  ready: 'Ready',
  need_top_up: 'Need Top Up',
  review_first: 'Review First',
}

const paymentStatusStyles: Record<Subscription['paymentStatus'], string> = {
  ready: 'bg-emerald-50 text-emerald-700',
  need_top_up: 'bg-amber-50 text-amber-700',
  review_first: 'bg-slate-100 text-slate-600',
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
    return <MessageCard message="Loading your saved subscriptions..." />
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
        <MessageCard
          action={subscriptions.length === 0 ? <button className="mt-5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800" onClick={onAdd} type="button">Add your first subscription</button> : undefined}
          message={subscriptions.length === 0 ? 'No subscriptions saved yet. Add your first one to start tracking renewals.' : 'No subscriptions match your search.'}
        />
      )}
    </section>
  )
}

function SubscriptionCard({ onDelete, onEdit, subscription }: { onDelete: () => void; onEdit: () => void; subscription: Subscription }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-slate-900">{subscription.name}</h3>
          <p className="mt-1 text-sm font-bold text-teal-700">{formatPrice(subscription)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${paymentStatusStyles[subscription.paymentStatus]}`}>{paymentStatusLabels[subscription.paymentStatus]}</span>
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

function MessageCard({ action, message }: { action?: ReactNode; message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-card">
      <p className="mx-auto max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action}
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
