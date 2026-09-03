import { useEffect, useState } from 'react'
import { disablePushNotifications, enablePushNotifications, getPushSupportState, hasPushSubscription, type PushSupportState } from '../services/push'
import { Icon } from './icons'

export function NotificationSetup() {
  const [support, setSupport] = useState<PushSupportState>('unsupported')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' }>()
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadState() {
      const [supportState, subscribed] = await Promise.all([getPushSupportState(), hasPushSubscription()])
      if (!isCurrent) return
      setSupport(supportState)
      setIsSubscribed(subscribed)
    }

    void loadState()

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleEnable() {
    setMessage(undefined)
    setIsWorking(true)

    try {
      const result = await enablePushNotifications()
      if (result.ok) {
        setIsSubscribed(await hasPushSubscription())
        setMessage({ text: 'Notifications enabled. You will be reminded before each renewal.', type: 'success' })
        return
      }
      setSupport(await getPushSupportState())
      const errorText = result.error === 'denied'
        ? 'Notifications are blocked. Allow them in your browser settings, then try again.'
        : result.error === 'unsupported'
          ? 'This browser does not support push notifications.'
          : result.error === 'not-configured'
            ? 'Notifications are not configured yet on the server.'
            : 'Could not enable notifications. Please try again.'
      setMessage({ text: errorText, type: 'error' })
    } finally {
      setIsWorking(false)
    }
  }

  async function handleDisable() {
    setMessage(undefined)
    setIsWorking(true)

    try {
      await disablePushNotifications()
      setIsSubscribed(await hasPushSubscription())
      setSupport(await getPushSupportState())
      setMessage({ text: 'Notifications disabled for this device.', type: 'success' })
    } finally {
      setIsWorking(false)
    }
  }

  const isSupported = support !== 'unsupported'
  const isDenied = support === 'denied'

  return (
    <article className="ui-card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/70 via-emerald-400/20 to-amber-400/40" />
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
          <Icon className="h-5 w-5" name="calendar" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">Renewal notifications</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {!isSupported
              ? 'Your browser does not support push notifications. Use the backup page to keep a copy of your data instead.'
              : isDenied
                ? 'Notifications are blocked in your browser. Allow them to receive renewal reminders.'
                : isSubscribed
                  ? 'You will get a push notification on this device when a subscription is about to renew.'
                  : 'Turn on push notifications so Renewal Guard can remind you before a renewal — even when the app is closed.'}
          </p>
        </div>
      </div>

      {message && <p className={`${message.type === 'success' ? 'feedback-success' : 'feedback-error'} mt-4`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}

      {isSupported && (
        <div className="mt-5">
          {isSubscribed ? (
            <button className="btn-secondary" disabled={isWorking} onClick={() => void handleDisable()} type="button">{isWorking ? 'Working…' : 'Turn off notifications'}</button>
          ) : (
            <button className="btn-primary" disabled={isWorking || isDenied} onClick={() => void handleEnable()} type="button">{isWorking ? 'Working…' : 'Enable notifications'}</button>
          )}
        </div>
      )}
    </article>
  )
}
