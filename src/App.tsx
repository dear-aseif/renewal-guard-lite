import { useState } from 'react'
import { Icon, type IconName } from './components/icons'
import { SubscriptionForm } from './components/SubscriptionForm'
import type { Subscription } from './db/database'

type Page = 'dashboard' | 'subscriptions' | 'add'

type NavigationItem = {
  id: Page
  label: string
  icon: IconName
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
  { id: 'add', label: 'Add New', icon: 'add' },
]

const pageContent: Record<Page, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: 'Overview',
    title: 'Dashboard',
    description: 'Your renewal summary will appear here once you add subscriptions.',
  },
  subscriptions: {
    eyebrow: 'Your services',
    title: 'Subscriptions',
    description: 'Your saved subscriptions will appear here, ordered by the nearest renewal date.',
  },
  add: {
    eyebrow: 'New record',
    title: 'Add New',
    description: 'Save a subscription locally so you can keep its next renewal date close at hand.',
  },
}

function NavigationButton({ item, activePage, onSelect, mobile = false }: { item: NavigationItem; activePage: Page; onSelect: (page: Page) => void; mobile?: boolean }) {
  const isActive = activePage === item.id

  return (
    <button
      className={mobile
        ? `flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold transition ${isActive ? 'text-teal-700' : 'text-slate-500 hover:text-teal-700'}`
        : `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-teal-700'}`}
      onClick={() => onSelect(item.id)}
      type="button"
    >
      <Icon className={mobile ? 'h-5 w-5' : 'h-5 w-5'} name={item.icon} />
      <span>{item.label}</span>
    </button>
  )
}

function PlaceholderCard({ activePage }: { activePage: Page }) {
  const content = pageContent[activePage]
  const icon: IconName = activePage === 'dashboard' ? 'calendar' : activePage === 'subscriptions' ? 'subscriptions' : 'add'

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-card sm:px-10 sm:py-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Icon className="h-7 w-7" name={icon} />
      </div>
      <h2 className="mt-5 text-xl font-bold text-slate-800">A clear space for your renewals</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{content.description}</p>
      <p className="mt-6 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">Phase 1 foundation</p>
    </section>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [editingSubscription, setEditingSubscription] = useState<Subscription>()
  const [savedSubscription, setSavedSubscription] = useState<Subscription>()
  const content = pageContent[activePage]

  function navigateTo(page: Page) {
    if (page === 'add') setEditingSubscription(undefined)
    setActivePage(page)
  }

  function handleSaved(subscription: Subscription) {
    setSavedSubscription(subscription)
    setEditingSubscription(undefined)
  }

  function startEditing() {
    if (!savedSubscription) return
    setEditingSubscription(savedSubscription)
    setActivePage('add')
  }

  return (
    <div className="min-h-screen bg-canvas pb-20 md:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-5 py-6 md:block">
        <Brand />
        <nav aria-label="Primary navigation" className="mt-10 space-y-2">
          {navigationItems.map((item) => <NavigationButton activePage={activePage} item={item} key={item.id} onSelect={navigateTo} />)}
        </nav>
        <div className="absolute inset-x-5 bottom-6 rounded-2xl bg-teal-700 p-4 text-white">
          <Icon className="h-5 w-5" name="storage" />
          <p className="mt-3 text-sm font-bold">Offline-first</p>
          <p className="mt-1 text-xs leading-5 text-teal-100">Your subscription data stays on this device.</p>
        </div>
      </aside>

      <main className="md:ml-64">
        <header className="border-b border-slate-200 bg-white px-5 py-4 md:hidden">
          <Brand />
        </header>
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 md:py-12 lg:px-12">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{content.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{content.title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Simple subscription reminders, stored locally and ready for offline use.</p>
            </div>
            <div className="hidden rounded-2xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 sm:block">Local only</div>
          </div>
          {activePage === 'add' ? (
            <div className="space-y-5">
              {savedSubscription && (
                <div className="flex flex-col gap-3 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800 sm:flex-row sm:items-center sm:justify-between" role="status">
                  <p><span className="font-bold">Saved locally.</span> {savedSubscription.name} is stored on this device.</p>
                  {!editingSubscription && <button className="text-left font-bold text-teal-700 underline decoration-teal-300 underline-offset-4" onClick={startEditing} type="button">Edit saved subscription</button>}
                </div>
              )}
              <SubscriptionForm onCancelEdit={() => setEditingSubscription(undefined)} onSaved={handleSaved} subscription={editingSubscription} />
            </div>
          ) : <PlaceholderCard activePage={activePage} />}
        </div>
      </main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white/95 px-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden">
        {navigationItems.map((item) => <NavigationButton activePage={activePage} item={item} key={item.id} mobile onSelect={navigateTo} />)}
      </nav>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-card">
        <Icon className="h-6 w-6" name="shield" />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight text-slate-900">Renewal Guard</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Lite</p>
      </div>
    </div>
  )
}
