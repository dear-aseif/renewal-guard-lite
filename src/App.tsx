import { useCallback, useEffect, useState } from 'react'
import { BackupRestore } from './components/BackupRestore'
import { Dashboard } from './components/Dashboard'
import { Icon, type IconName } from './components/icons'
import { Login } from './components/Login'
import { SubscriptionForm } from './components/SubscriptionForm'
import { SubscriptionList } from './components/SubscriptionList'
import { db, type Subscription } from './db/database'
import { checkAuthenticated, logout } from './services/auth'
import { getSyncStatus, syncNow, type SyncStatus } from './services/sync'
import { useSyncController } from './hooks/useSyncController'

type Page = 'dashboard' | 'subscriptions' | 'add' | 'backup'

type NavigationItem = {
  id: Page
  label: string
  icon: IconName
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'add', label: 'Add New', icon: 'add' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
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
  const isPrimaryMobileAction = mobile && item.id === 'add'

  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      className={mobile
        ? `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-bold transition duration-200 ease-out motion-safe:active:scale-[0.98] ${isPrimaryMobileAction ? `-mt-5 min-h-16 rounded-pill border border-lime-400/50 bg-lime-400 text-inkbase shadow-button-hover hover:bg-lime-300 ${isActive ? 'ring-2 ring-lime-300/60 ring-offset-2 ring-offset-neutral-950' : ''}` : `min-h-14 rounded-pill py-2 ${isActive ? 'bg-lime-400/10 text-lime-300' : 'text-slate-500 hover:bg-neutral-900 hover:text-lime-300'}`}`
        : `flex w-full items-center gap-3 rounded-pill px-3 py-3 text-sm font-semibold transition duration-200 ease-out motion-safe:active:scale-[0.98] ${isActive ? 'bg-lime-400/10 text-lime-300' : 'text-slate-500 hover:bg-neutral-900 hover:text-lime-300'}`}
      onClick={() => onSelect(item.id)}
      type="button"
    >
      <Icon className={mobile ? 'h-5 w-5' : 'h-5 w-5'} name={item.icon} />
      <span>{item.label}</span>
    </button>
  )
}



function BackupUtilityButton({ activePage, onSelect }: { activePage: Page; onSelect: (page: Page) => void }) {
  const isActive = activePage === 'backup'

  return (
    <button aria-current={isActive ? 'page' : undefined} aria-label="Open Backup and Restore" className={`inline-flex min-h-11 items-center gap-2 rounded-pill border px-3 py-2 text-xs font-semibold transition duration-300 ease-out motion-safe:active:scale-[0.98] ${isActive ? 'border-lime-400/50 bg-lime-400/15 text-lime-200' : 'border-neutral-700 bg-neutral-900/80 text-slate-500 hover:border-lime-400/40 hover:text-lime-300'}`} onClick={() => onSelect('backup')} type="button">
      <Icon className="h-4 w-4" name="storage" />
      <span className="hidden min-[380px]:inline">Backup</span>
    </button>
  )
}

function SyncIndicator({ status, lastSyncedAt, onSync }: { status: SyncStatus; lastSyncedAt: string | null; onSync: () => void }) {
  const label = status === 'syncing' ? 'Syncing…' : status === 'offline' ? 'Offline — changes queued' : status === 'error' ? 'Sync issue' : lastSyncedAt ? 'Synced' : 'Not synced yet'
  const dotClass = status === 'syncing' ? 'animate-pulse bg-lime-300' : status === 'offline' ? 'bg-gold-400' : status === 'error' ? 'bg-red-400' : 'bg-lime-400'

  return (
    <button aria-label={status === 'syncing' ? 'Syncing' : 'Sync now'} className="group inline-flex min-h-9 items-center gap-2 rounded-pill border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-xs font-semibold text-slate-400 transition duration-300 hover:border-lime-400/40 hover:text-lime-300" onClick={onSync} title={lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : undefined} type="button">
      <span className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(158,230,110,0.6)] ${dotClass}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-pill px-3 py-2.5 text-left text-xs font-semibold text-slate-500 transition duration-200 hover:bg-neutral-900 hover:text-lime-300" onClick={onLogout} type="button">
      <Icon className="h-4 w-4" name="storage" />
      <span>Sign out</span>
    </button>
  )
}

function SignInButton({ onSignIn }: { onSignIn: () => void }) {
  return (
    <button className="inline-flex min-h-9 w-full items-center gap-2 rounded-pill border border-lime-400/40 bg-lime-400/10 px-3 py-1.5 text-xs font-bold text-lime-300 transition duration-200 hover:bg-lime-400/20" onClick={onSignIn} type="button">
      <span className="h-2 w-2 rounded-full bg-lime-300" />
      <span>Sign in to sync</span>
    </button>
  )
}

function AuthSyncControl({ authMode, lastSyncedAt, onSignIn, onSync, status }: { authMode: AuthMode; lastSyncedAt: string | null; onSignIn: () => void; onSync: () => void; status: SyncStatus }) {
  if (authMode === 'signedIn') {
    return <SyncIndicator lastSyncedAt={lastSyncedAt} onSync={onSync} status={status} />
  }
  return <SignInButton onSignIn={onSignIn} />
}

type AuthMode = 'checking' | 'signedIn' | 'local'

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [editingSubscription, setEditingSubscription] = useState<Subscription>()
  const [savedSubscription, setSavedSubscription] = useState<Subscription>()
  const [savedMessage, setSavedMessage] = useState('Saved locally.')
  const [hasSubscriptions, setHasSubscriptions] = useState<boolean>()
  const [authMode, setAuthMode] = useState<AuthMode>('checking')
  const [showLogin, setShowLogin] = useState(false)
  const { status: syncStatus, lastSyncedAt } = useSyncController()
  const content = pageContent[activePage]
  const showPageHeader = activePage !== 'dashboard' || hasSubscriptions === false
  const isSyncingEnabled = authMode === 'signedIn'

  // Verify the session cookie on first load.
  useEffect(() => {
    let isCurrent = true

    async function bootstrap() {
      const authenticated = await checkAuthenticated()
      if (!isCurrent) return
      if (authenticated) {
        setAuthMode('signedIn')
        void syncNow()
      } else {
        // No valid session: stay offline-first and let the user choose to sign in.
        setAuthMode('local')
      }
    }

    void bootstrap()

    return () => {
      isCurrent = false
    }
  }, [])

  // Re-sync whenever the app comes back online (only when signed in).
  const handleOnline = useCallback(() => {
    if (isSyncingEnabled && getSyncStatus() !== 'syncing') void syncNow()
  }, [isSyncingEnabled])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [handleOnline])

  useEffect(() => {
    if (activePage !== 'dashboard') return

    let isCurrent = true

    async function checkForSubscriptions() {
      try {
        const subscriptionCount = await db.subscriptions.count()
        if (isCurrent) setHasSubscriptions(subscriptionCount > 0)
      } catch {
        if (isCurrent) setHasSubscriptions(false)
      }
    }

    void checkForSubscriptions()

    return () => {
      isCurrent = false
    }
  }, [activePage])

  if (authMode === 'checking') {
    return <div className="flex min-h-screen items-center justify-center bg-canvas"><p className="text-sm font-semibold text-slate-500">Loading…</p></div>
  }

  if (showLogin) {
    return <Login onContinueOffline={() => setShowLogin(false)} onLoggedIn={() => { setShowLogin(false); setAuthMode('signedIn'); void syncNow() }} />
  }

  async function handleLogout() {
    await logout()
    setAuthMode('local')
    setActivePage('dashboard')
  }

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
    <div className="min-h-screen bg-canvas bg-[radial-gradient(circle_at_top_right,_rgba(158,230,110,0.13),_transparent_30rem)] pb-24 lg:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-800 bg-neutral-950/85 px-5 py-6 backdrop-blur-xl lg:block">
        <Brand />
        <nav aria-label="Primary navigation" className="mt-10 space-y-2">
          {navigationItems.map((item) => <NavigationButton activePage={activePage} item={item} key={item.id} onSelect={navigateTo} />)}
        </nav>
        <div className="mt-8">
          <AuthSyncControl authMode={authMode} lastSyncedAt={lastSyncedAt} onSignIn={() => setShowLogin(true)} onSync={() => void syncNow()} status={syncStatus} />
        </div>
        <div className="absolute inset-x-5 bottom-6 space-y-1">
          <div className="rounded-card-lg border border-lime-400/20 bg-gradient-to-br from-lime-400/20 to-gold-400/10 p-4 text-lime-100 shadow-card">
            <Icon className="h-5 w-5" name="storage" />
            <p className="mt-3 text-sm font-bold">Cloud-synced</p>
            <p className="mt-1 text-xs leading-5 text-teal-100">Your subscriptions sync to your private database and stay safe across devices.</p>
          </div>
          {authMode === 'signedIn' && <LogoutButton onLogout={() => void handleLogout()} />}
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/85 px-4 py-3.5 backdrop-blur-xl lg:hidden">
          <Brand />
          <div className="flex items-center gap-2">
            <AuthSyncControl authMode={authMode} lastSyncedAt={lastSyncedAt} onSignIn={() => setShowLogin(true)} onSync={() => void syncNow()} status={syncStatus} />
            <BackupUtilityButton activePage={activePage} onSelect={navigateTo} />
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-12 lg:py-8">
          <div className="mb-5 hidden items-center justify-end gap-2 lg:flex">
            <AuthSyncControl authMode={authMode} lastSyncedAt={lastSyncedAt} onSignIn={() => setShowLogin(true)} onSync={() => void syncNow()} status={syncStatus} />
            <BackupUtilityButton activePage={activePage} onSelect={navigateTo} />
          </div>
          {showPageHeader && <section className="gradient-shell relative mb-6 overflow-hidden shadow-card sm:mb-8" aria-labelledby="page-title">
            <div className="relative overflow-hidden rounded-[25px] border border-neutral-800/80 bg-neutral-950/85 px-4 py-5 backdrop-blur-xl sm:px-6 sm:py-6">
              <div className="pointer-events-none absolute inset-0 opacity-40 archive-grid" />
              <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-lime-400/10 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(158,230,110,0.9)]" />
                    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lime-300 sm:text-[10px] sm:tracking-[0.2em]">{content.eyebrow}</p>
                  </div>
                  <h1 className="mt-3 text-[30px] font-light leading-9 tracking-[-0.025em] text-slate-900 sm:text-4xl" id="page-title">{content.title}</h1>
                  <p className="mt-2 max-w-xl text-[15px] leading-6 text-slate-500 sm:text-sm">{content.description}</p>
                </div>
                <div className="hidden rounded-pill border border-lime-400/20 bg-neutral-950/70 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-lime-300 shadow-sm backdrop-blur sm:block">Local only</div>
              </div>
              <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-800/80 pt-3 font-mono text-[11px] leading-4 uppercase tracking-[0.1em] text-slate-400 sm:text-[10px] sm:tracking-[0.12em]">
                <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-lime-400" />Offline-first workspace</span>
                <span>Private by default</span>
              </div>
            </div>
          </section>}
          {activePage === 'add' ? (
            <div className="space-y-5">
              {savedSubscription && (
                <div className="flex flex-col gap-3 rounded-[18px] border border-lime-400/25 bg-lime-400/10 px-4 py-3 text-[15px] leading-6 text-lime-200 sm:text-sm shadow-card backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between" role="status">
                  <p><span className="font-bold">{savedMessage}</span> {savedSubscription.name} is stored on this device.</p>
                  {!editingSubscription && <button className="text-left font-semibold text-lime-300 underline decoration-lime-400/50 underline-offset-4 transition duration-200 ease-out hover:text-lime-200 active:text-lime-100" onClick={() => startEditing(savedSubscription)} type="button">Edit saved subscription</button>}
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

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 flex items-end gap-1 border-t border-neutral-800 bg-neutral-950/90 px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_30px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl lg:hidden">
        {navigationItems.map((item) => <NavigationButton activePage={activePage} item={item} key={item.id} mobile onSelect={navigateTo} />)}
      </nav>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-lime-400 to-gold-400 text-inkbase shadow-button">
        <Icon className="h-6 w-6" name="shield" />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight text-slate-900">Renewal Guard</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-400">Lite</p>
      </div>
    </div>
  )
}
