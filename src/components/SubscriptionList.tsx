import { useEffect, useMemo, useState } from 'react'
import { db, type Subscription } from '../db/database'
import { EmptyState } from './EmptyState'
import { PaymentStatusBadge, ReminderBadge } from './StatusBadge'
import { markSubscriptionAsPaid } from '../utils/renewalHistory'
import { getSubscriptionBorderClass } from '../utils/subscriptionStatus'
import { changeSubscriptionPaymentStatus, paymentStatusOptions } from '../utils/paymentStatus'
import { getReminderDaysBefore } from '../utils/reminderDays'

type SubscriptionListProps = {
  onAdd: () => void
  onEdit: (subscription: Subscription) => void
}

export function SubscriptionList({ onAdd, onEdit }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [search, setSearch] = useState('')
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
    if (!query) return subscriptions
    return subscriptions.filter((subscription) => subscription.name.toLocaleLowerCase().includes(query))
  }, [search, subscriptions])

  async function deleteSubscription(subscription: Subscription) {
    const shouldDelete = window.confirm(`Delete ${subscription.name}? This cannot be undone.`)
    if (!shouldDelete) return

    setMessage(undefined)

    try {
      await db.subscriptions.delete(subscription.id)
      setSubscriptions((currentSubscriptions) => currentSubscriptions.filter(({ id }) => id !== subscription.id))
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
    return <EmptyState description="Reading subscriptions stored on this device." icon="storage" title="Loading your subscriptions..." />
  }

  return (
    <section className="space-y-5">
      <div className="ui-card p-4 sm:p-5">
        <label className="block text-sm font-bold text-slate-700" htmlFor="subscription-search">Search subscriptions</label>
        <div className="relative mt-2">
          <svg aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
          <input className="field-control py-3 pl-11 pr-3.5" id="subscription-search" onChange={(event) => setSearch(event.target.value)} placeholder="Search by subscription name" type="search" value={search} />
        </div>
      </div>

      {message && <p className={message.type === 'success' ? 'feedback-success' : 'feedback-error'} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Saved subscriptions</h2>
          <p className="mt-1 text-sm text-slate-500">Sorted by nearest renewal date.</p>
        </div>
        <button className="btn-primary shrink-0" onClick={onAdd} type="button">Add new</button>
      </div>

      {visibleSubscriptions.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleSubscriptions.map((subscription) => (
            <SubscriptionCard isUpdatingPaymentStatus={updatingPaymentStatusId === subscription.id} key={subscription.id} onDelete={() => void deleteSubscription(subscription)} onEdit={() => onEdit(subscription)} onMarkAsPaid={() => void markAsPaid(subscription)} onPaymentStatusChange={(paymentStatus) => void updatePaymentStatus(subscription, paymentStatus)} subscription={subscription} />
          ))}
        </div>
      ) : (
        <EmptyState
          action={subscriptions.length === 0 ? <button className="btn-primary mt-5" onClick={onAdd} type="button">Add your first subscription</button> : undefined}
          description={subscriptions.length === 0 ? 'Add your first subscription to start tracking renewals.' : 'Try a different subscription name.'}
          icon="subscriptions"
          title={subscriptions.length === 0 ? 'No subscriptions yet' : 'No matching subscriptions'}
        />
      )}
    </section>
  )
}

function SubscriptionCard({ isUpdatingPaymentStatus, onDelete, onEdit, onMarkAsPaid, onPaymentStatusChange, subscription }: { isUpdatingPaymentStatus: boolean; onDelete: () => void; onEdit: () => void; onMarkAsPaid: () => void; onPaymentStatusChange: (paymentStatus: Subscription['paymentStatus']) => void; subscription: Subscription }) {
  const borderClass = getSubscriptionBorderClass(subscription)

  return (
    <article className={`ui-card ui-card-interactive p-4 sm:p-5 ${borderClass}`}>
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

      <dl className="mt-4 grid gap-3 border-y border-slate-100 py-4 text-sm sm:mt-5">
        <Detail label="Billing cycle" value={formatBillingCycle(subscription)} />
        <Detail label="Next renewal" value={formatDate(subscription.nextRenewalDate)} />
        <Detail label="Reminder window" value={`${getReminderDaysBefore(subscription)} days before`} />
        <Detail label="Payment method" value={subscription.paymentMethod || 'Not added'} />
        <Detail label="Account email" value={subscription.accountEmail || 'Not added'} />
      </dl>

      <label className="mt-4 block text-sm font-bold text-slate-700">
        Quick payment status
        <select aria-label={`Quick payment status for ${subscription.name}`} className="field-control mt-2 font-semibold text-slate-700" disabled={isUpdatingPaymentStatus} onChange={(event) => onPaymentStatusChange(event.target.value as Subscription['paymentStatus'])} value={subscription.paymentStatus}>
          {paymentStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className="btn-primary mr-auto min-h-10 px-3 py-2" onClick={onMarkAsPaid} type="button">Mark as Paid</button>
        <button className="btn-ghost text-teal-700 hover:bg-teal-50 hover:text-teal-800" onClick={onEdit} type="button">Edit</button>
        <button className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onDelete} type="button">Delete</button>
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
