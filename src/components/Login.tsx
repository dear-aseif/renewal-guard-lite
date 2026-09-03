import { useState, type FormEvent } from 'react'
import { login } from '../services/auth'
import { Icon } from './icons'

export function Login({ onLoggedIn, onContinueOffline }: { onLoggedIn: () => void; onContinueOffline: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(password)
      if (result.ok) {
        onLoggedIn()
        return
      }
      setError(result.error === 'incorrect' ? 'Incorrect password. Please try again.' : result.error === 'offline' ? 'You appear to be offline. Check your connection and try again.' : 'Could not sign in. Please try again.')
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.13),_transparent_30rem)] px-4">
      <div className="w-full max-w-sm">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-neutral-950/80 p-6 shadow-card backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/70 via-emerald-400/20 to-amber-400/40" />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-neutral-950 shadow-button">
              <Icon className="h-6 w-6" name="shield" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">Renewal Guard</p>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Sign in</p>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-light tracking-[-0.025em] text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">Enter your password to view your subscriptions on this device.</p>

          {error && <p className="feedback-error mt-4" role="alert">{error}</p>}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block font-mono text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
              Password
              <input
                autoComplete="current-password"
                autoFocus
                className="field-control mt-2"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                required
                type="password"
                value={password}
              />
            </label>
            <button className="btn-primary w-full" disabled={isSubmitting || !password} type="submit">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 border-t border-neutral-800/80 pt-4 text-center">
            <button className="text-sm font-semibold text-slate-500 transition duration-200 hover:text-emerald-300" onClick={onContinueOffline} type="button">Continue offline — local only</button>
          </div>
        </div>
        <p className="mt-4 text-center text-xs leading-5 text-slate-500">Your data syncs to your private cloud database and stays on your devices.</p>
      </div>
    </div>
  )
}
