import { useState } from 'react'
import { BackupRestore } from './components/BackupRestore'
import { Dashboard } from './components/Dashboard'
import { Icon, type IconName } from './components/icons'
import { SubscriptionForm } from './components/SubscriptionForm'
import { SubscriptionList } from './components/SubscriptionList'
import type { Subscription } from './db/database'

type Page = 'dashboard' | 'subscriptions' | 'add' | 'backup'

type NavigationItem = {
  id: Page
  label: string
  icon: IconName
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
  { id: 'add', label: 'Add New', icon: 'add' },
  { id: 'backup', label: 'Backup', icon: 'storage' },
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
  backup: {
    eyebrow: 'Local files',
    title: 'Backup & Restore',
    description: 'Export or restore a manual JSON backup without uploading your data.',
  },
}

function NavigationButton({ item, activePage, onSelect, mobile = false }: { item: NavigationItem; activePage: Page; onSelect: (page: Page) => void; mobile?: boolean }) {
  const isActive = activePage === item.id

  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      className={mobile
        ? `flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-bold transition duration-200 ease-out motion-safe:active:scale-[0.98] ${isActive ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-500 hover:bg-neutral-900 hover:text-emerald-300'}`
        : `flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition duration-200 ease-out motion-safe:active:scale-[0.98] ${isActive ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-500 hover:bg-neutral-900 hover:text-emerald-300'}`}
      onClick={() => onSelect(item.id)}
      type="button"
    >
      <Icon className={mobile ? 'h-5 w-5' : 'h-5 w-5'} name={item.icon} />
      <span>{item.label}</span>
    </button>
  )
}


export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [editingSubscription, setEditingSubscription] = useState<Subscription>()
  const [savedSubscription, setSavedSubscription] = useState<Subscription>()
  const [savedMessage, setSavedMessage] = useState('Saved locally.')
  const content = pageContent[activePage]

  function navigateTo(page: Page) {
    if (page === 'add') {
      setEditingSubscription(undefined)
      setSavedSubscription(undefined)
      setSavedMessage('Saved locally.')
    }
    setActivePage(page)
  }

  function handleSaved(subscription: Subscription) {
    setSavedMessage('Saved locally.')
    setSavedSubscription(subscription)
    setEditingSubscription(undefined)
  }

  function handleMarkedAsPaid(subscription: Subscription) {
    setSavedMessage('Marked as paid locally.')
    setSavedSubscription(subscription)
    setEditingSubscription(undefined)
  }

  function startEditing(subscription: Subscription) {
    setSavedSubscription(undefined)
    setEditingSubscription(subscription)
    setActivePage('add')
  }

  return (
    <div className="min-h-screen bg-canvas bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.13),_transparent_30rem)] pb-24 lg:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-800 bg-neutral-950/85 px-5 py-6 backdrop-blur-xl lg:block">
        <Brand />
        <nav aria-label="Primary navigation" className="mt-10 space-y-2">
          {navigationItems.map((item) => <NavigationButton activePage={activePage} item={item} key={item.id} onSelect={navigateTo} />)}
        </nav>
        <div className="absolute inset-x-5 bottom-6 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-amber-500/10 p-4 text-emerald-100 shadow-card">
          <Icon className="h-5 w-5" name="storage" />
          <p className="mt-3 text-sm font-bold">Offline-first</p>
          <p className="mt-1 text-xs leading-5 text-teal-100">Your subscription data stays on this device.</p>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/85 px-4 py-3.5 backdrop-blur-xl lg:hidden">
          <Brand />
        </header>
        <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-12 lg:py-12">
          <section className="relative mb-6 overflow-hidden rounded-2xl bg-[linear-gradient(to_right_bottom,rgba(16,185,129,0.28),rgba(38,38,38,0.24),rgba(245,158,11,0.18))] p-px shadow-card sm:mb-8" aria-labelledby="page-title">
            <div className="relative overflow-hidden rounded-[15px] border border-neutral-800/80 bg-neutral-950/85 px-4 py-5 backdrop-blur-xl sm:px-6 sm:py-6">
              <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300 sm:text-[10px] sm:tracking-[0.2em]">{content.eyebrow}</p>
                  </div>
                  <h1 className="mt-3 text-[30px] font-light leading-9 tracking-[-0.025em] text-slate-900 sm:text-4xl" id="page-title">{content.title}</h1>
                  <p className="mt-2 max-w-xl text-[15px] leading-6 text-slate-500 sm:text-sm">{content.description}</p>
                </div>
                <div className="hidden rounded-full border border-emerald-500/20 bg-neutral-950/70 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-300 shadow-sm backdrop-blur sm:block">Local only</div>
              </div>
              <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-800/80 pt-3 font-mono text-[11px] leading-4 uppercase tracking-[0.1em] text-slate-400 sm:text-[10px] sm:tracking-[0.12em]">
                <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-400" />Offline-first workspace</span>
                <span>Private by default</span>
              </div>
            </div>
          </section>
          {activePage === 'add' ? (
            <div className="space-y-5">
              {savedSubscription && (
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[15px] leading-6 text-emerald-200 sm:text-sm shadow-card backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between" role="status">
                  <p><span className="font-bold">{savedMessage}</span> {savedSubscription.name} is stored on this device.</p>
                  {!editingSubscription && <button className="text-left font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-4 transition duration-200 ease-out hover:text-emerald-200 active:text-emerald-100" onClick={() => startEditing(savedSubscription)} type="button">Edit saved subscription</button>}
                </div>
              )}
              <SubscriptionForm onCancelEdit={() => setEditingSubscription(undefined)} onMarkedAsPaid={handleMarkedAsPaid} onSaved={handleSaved} subscription={editingSubscription} />
            </div>
          ) : activePage === 'subscriptions' ? (
            <SubscriptionList onAdd={() => navigateTo('add')} onEdit={startEditing} />
          ) : activePage === 'backup' ? (
            <BackupRestore />
          ) : <Dashboard onAdd={() => navigateTo('add')} />}
        </div>
      </main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-neutral-800 bg-neutral-950/90 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_30px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl lg:hidden">
        {navigationItems.map((item) => <NavigationButton activePage={activePage} item={item} key={item.id} mobile onSelect={navigateTo} />)}
      </nav>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-neutral-950 shadow-button">
        <Icon className="h-6 w-6" name="shield" />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight text-slate-900">Renewal Guard</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Lite</p>
      </div>
    </div>
  )
}
