import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { DEFAULT_REMINDER_DAYS_BEFORE, db, reminderDaysBeforeOptions, type ReminderDaysBefore, type RenewalHistory, type Subscription } from '../db/database'
import { markSubscriptionAsPaid } from '../utils/renewalHistory'
import { getReminderDaysBefore } from '../utils/reminderDays'

type SubscriptionFormProps = {
  subscription?: Subscription
  onSaved: (subscription: Subscription) => void
  onMarkedAsPaid: (subscription: Subscription) => void
  onCancelEdit: () => void
}

type FormValues = {
  name: string
  price: string
  currency: Subscription['currency']
  billingCycle: Subscription['billingCycle']
  customCycleDays: string
  nextRenewalDate: string
  paymentMethod: string
  accountEmail: string
  paymentStatus: Subscription['paymentStatus']
  reminderDaysBefore: ReminderDaysBefore
  notes: string
}

const emptyForm: FormValues = {
  name: '',
  price: '',
  currency: 'IDR',
  billingCycle: 'monthly',
  customCycleDays: '',
  nextRenewalDate: '',
  paymentMethod: '',
  accountEmail: '',
  paymentStatus: 'ready',
  reminderDaysBefore: DEFAULT_REMINDER_DAYS_BEFORE,
  notes: '',
}

function valuesFromSubscription(subscription?: Subscription): FormValues {
  if (!subscription) return emptyForm

  return {
    name: subscription.name,
    price: String(subscription.price),
    currency: subscription.currency,
    billingCycle: subscription.billingCycle,
    customCycleDays: subscription.customCycleDays ? String(subscription.customCycleDays) : '',
    nextRenewalDate: subscription.nextRenewalDate,
    paymentMethod: subscription.paymentMethod ?? '',
    accountEmail: subscription.accountEmail ?? '',
    paymentStatus: subscription.paymentStatus,
    reminderDaysBefore: getReminderDaysBefore(subscription),
    notes: subscription.notes ?? '',
  }
}

export function SubscriptionForm({ subscription, onSaved, onMarkedAsPaid, onCancelEdit }: SubscriptionFormProps) {
  const [values, setValues] = useState<FormValues>(() => valuesFromSubscription(subscription))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [renewalHistory, setRenewalHistory] = useState<RenewalHistory[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const isEditing = Boolean(subscription)

  useEffect(() => {
    setValues(valuesFromSubscription(subscription))
    setError('')
  }, [subscription])

  useEffect(() => {
    let isCurrent = true

    async function loadRenewalHistory() {
      if (!subscription) {
        setRenewalHistory([])
        return
      }

      setIsHistoryLoading(true)
      try {
        const history = await db.renewalHistory.where('subscriptionId').equals(subscription.id).toArray()
        if (isCurrent) setRenewalHistory(history.sort((first, second) => second.paidDate.localeCompare(first.paidDate)))
      } catch {
        if (isCurrent) setError('Renewal history could not be loaded. Please try again.')
      } finally {
        if (isCurrent) setIsHistoryLoading(false)
      }
    }

    void loadRenewalHistory()

    return () => {
      isCurrent = false
    }
  }, [subscription])

  function updateValue<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues((currentValues) => ({ ...currentValues, [key]: value }))
  }

  async function markAsPaid() {
    if (!subscription) return
    const shouldAdvance = window.confirm(`Mark ${subscription.name} as paid and move its renewal date forward?`)
    if (!shouldAdvance) return

    setError('')
    setIsSaving(true)

    try {
      const updatedSubscription = await markSubscriptionAsPaid(subscription)
      onMarkedAsPaid(updatedSubscription)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The subscription could not be marked as paid. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const price = Number(values.price)
    const customCycleDays = Number(values.customCycleDays)

    if (!values.name.trim() || !values.price || !values.nextRenewalDate) {
      setError('Please complete the required fields before saving.')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setError('Price must be zero or more.')
      return
    }

    if (values.billingCycle === 'custom' && (!Number.isInteger(customCycleDays) || customCycleDays < 1)) {
      setError('Custom cycle days must be a whole number of at least 1.')
      return
    }

    setIsSaving(true)

    try {
      const now = new Date().toISOString()
      const savedSubscription: Subscription = {
        id: subscription?.id ?? crypto.randomUUID(),
        name: values.name.trim(),
        price,
        currency: values.currency,
        billingCycle: values.billingCycle,
        ...(values.billingCycle === 'custom' ? { customCycleDays } : {}),
        nextRenewalDate: values.nextRenewalDate,
        ...(values.paymentMethod.trim() ? { paymentMethod: values.paymentMethod.trim() } : {}),
        ...(values.accountEmail.trim() ? { accountEmail: values.accountEmail.trim() } : {}),
        paymentStatus: values.paymentStatus,
        reminderDaysBefore: values.reminderDaysBefore,
        ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
        createdAt: subscription?.createdAt ?? now,
        updatedAt: now,
      }

      if (isEditing) {
        await db.subscriptions.put(savedSubscription)
      } else {
        await db.subscriptions.add(savedSubscription)
        setValues(emptyForm)
      }

      onSaved(savedSubscription)
    } catch {
      setError('The subscription could not be saved. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="relative space-y-6 overflow-hidden rounded-2xl border border-emerald-500/15 bg-neutral-950/75 p-4 shadow-card backdrop-blur-xl sm:p-6" onSubmit={handleSubmit}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/70 via-emerald-400/20 to-amber-400/40" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative border-b border-neutral-800/80 pb-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300">Local subscription record</p>
        </div>
        <h2 className="mt-3 text-xl font-light tracking-[-0.025em] text-slate-900">{isEditing ? 'Edit subscription' : 'Subscription details'}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Required fields are marked with an asterisk. Your data is saved locally on this device.</p>
      </div>

      {error && <p className="feedback-error" role="alert">{error}</p>}

      <div className="relative grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Name" required>
          <input className={inputClassName} onChange={(event) => updateValue('name', event.target.value)} placeholder="e.g. ChatGPT Plus" required type="text" value={values.name} />
        </Field>
        <Field label="Price" required>
          <input className={inputClassName} min="0" onChange={(event) => updateValue('price', event.target.value)} placeholder="0" required step="any" type="number" value={values.price} />
        </Field>
        <Field label="Currency" required>
          <select className={inputClassName} onChange={(event) => updateValue('currency', event.target.value as Subscription['currency'])} value={values.currency}>
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
        <Field label="Billing cycle" required>
          <select className={inputClassName} onChange={(event) => updateValue('billingCycle', event.target.value as Subscription['billingCycle'])} value={values.billingCycle}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
          </select>
        </Field>
        {values.billingCycle === 'custom' && (
          <Field label="Custom cycle days" required>
            <input className={inputClassName} min="1" onChange={(event) => updateValue('customCycleDays', event.target.value)} placeholder="e.g. 45" required step="1" type="number" value={values.customCycleDays} />
          </Field>
        )}
        <Field label="Next renewal date" required>
          <input className={inputClassName} onChange={(event) => updateValue('nextRenewalDate', event.target.value)} required type="date" value={values.nextRenewalDate} />
        </Field>
        <Field label="Payment method">
          <input className={inputClassName} onChange={(event) => updateValue('paymentMethod', event.target.value)} placeholder="e.g. Jago Visa" type="text" value={values.paymentMethod} />
        </Field>
        <Field label="Account email">
          <input className={inputClassName} onChange={(event) => updateValue('accountEmail', event.target.value)} placeholder="e.g. name@example.com" type="email" value={values.accountEmail} />
        </Field>
        <Field label="Payment status" required>
          <select className={inputClassName} onChange={(event) => updateValue('paymentStatus', event.target.value as Subscription['paymentStatus'])} value={values.paymentStatus}>
            <option value="ready">Ready</option>
            <option value="need_top_up">Need Top Up</option>
            <option value="review_first">Review First</option>
          </select>
        </Field>
        <Field label="Remind me before renewal" required>
          <select className={inputClassName} onChange={(event) => updateValue('reminderDaysBefore', Number(event.target.value) as ReminderDaysBefore)} value={values.reminderDaysBefore}>
            {reminderDaysBeforeOptions.map((days) => <option key={days} value={days}>{days} day{days === 1 ? '' : 's'} before</option>)}
          </select>
        </Field>
        <Field className="sm:col-span-2" label="Notes">
          <textarea className={`${inputClassName} min-h-28 resize-y`} onChange={(event) => updateValue('notes', event.target.value)} placeholder="Optional notes about this subscription" value={values.notes} />
        </Field>
      </div>

      {isEditing && (
        <section className="relative rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">Payment timeline</p>
          <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900">Renewal history</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Manual payments recorded locally on this device.</p>
          {isHistoryLoading ? (
            <p className="mt-4 text-sm font-semibold text-slate-500">Loading renewal history...</p>
          ) : renewalHistory.length > 0 ? (
            <div className="mt-4 space-y-3">
              {renewalHistory.map((history) => <RenewalHistoryItem history={history} key={history.id} />)}
            </div>
          ) : <p className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950/50 px-4 py-3 text-sm leading-6 text-slate-500">No renewal history yet. Mark this subscription as paid to add the first record.</p>}
        </section>
      )}

      <div className="relative flex flex-col-reverse gap-3 border-t border-neutral-800/80 pt-5 sm:flex-row sm:flex-wrap sm:justify-end">
        {isEditing && <button className="btn-ghost min-h-11 px-4" onClick={onCancelEdit} type="button">Cancel edit</button>}
        {isEditing && <button className="btn-secondary" disabled={isSaving} onClick={() => void markAsPaid()} type="button">Mark as Paid</button>}
        <button className="btn-primary px-5" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Save subscription'}
        </button>
      </div>
    </form>
  )
}

const inputClassName = 'field-control mt-2 hover:border-neutral-600 hover:bg-neutral-900 focus:bg-neutral-900'

function Field({ children, className = '', label, required = false }: { children: ReactNode; className?: string; label: string; required?: boolean }) {
  return (
    <label className={`group block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 ${className}`}>
      {label}{required && <span className="ml-1 text-emerald-300">*</span>}
      {children}
    </label>
  )
}


function RenewalHistoryItem({ history }: { history: RenewalHistory }) {
  return (
    <article className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-4 py-3 transition duration-200 hover:border-emerald-500/20">
      <div className="flex flex-col gap-1 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <p className="text-sm font-bold text-slate-800">{history.currency} {history.amount.toLocaleString()}</p>
        <p className="text-xs font-semibold text-slate-500">Paid {formatDateTime(history.paidDate)}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600">Renewal moved from <span className="font-semibold">{formatDate(history.previousRenewalDate)}</span> to <span className="font-semibold">{formatDate(history.nextRenewalDate)}</span>.</p>
    </article>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`))
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}
