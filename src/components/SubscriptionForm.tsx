import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { db, type Subscription } from '../db/database'

type SubscriptionFormProps = {
  subscription?: Subscription
  onSaved: (subscription: Subscription) => void
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
    notes: subscription.notes ?? '',
  }
}

export function SubscriptionForm({ subscription, onSaved, onCancelEdit }: SubscriptionFormProps) {
  const [values, setValues] = useState<FormValues>(() => valuesFromSubscription(subscription))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(subscription)

  useEffect(() => {
    setValues(valuesFromSubscription(subscription))
    setError('')
  }, [subscription])

  function updateValue<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues((currentValues) => ({ ...currentValues, [key]: value }))
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
    <form className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-7" onSubmit={handleSubmit}>
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit subscription' : 'Subscription details'}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Required fields are marked with an asterisk. Your data is saved locally on this device.</p>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
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
        <Field className="sm:col-span-2" label="Notes">
          <textarea className={`${inputClassName} min-h-28 resize-y`} onChange={(event) => updateValue('notes', event.target.value)} placeholder="Optional notes about this subscription" value={values.notes} />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        {isEditing && <button className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100" onClick={onCancelEdit} type="button">Cancel edit</button>}
        <button className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Save subscription'}
        </button>
      </div>
    </form>
  )
}

const inputClassName = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'

function Field({ children, className = '', label, required = false }: { children: ReactNode; className?: string; label: string; required?: boolean }) {
  return (
    <label className={`block text-sm font-bold text-slate-700 ${className}`}>
      {label}{required && <span className="ml-1 text-teal-700">*</span>}
      {children}
    </label>
  )
}
