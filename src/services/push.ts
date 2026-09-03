// Client-side push subscription helpers. Called only from a user gesture.
//
// Two separate concepts:
//  - browser permission (Notification.permission): "is this site allowed to
//    show notifications at all?"
//  - push subscription (pushManager.getSubscription()): "is this device
//    registered to receive pushes from our server?"
// The UI toggle should reflect the SUBSCRIPTION, not the permission.

export type PushSupportState = 'unsupported' | 'default' | 'granted' | 'denied'

export async function getPushSupportState(): Promise<PushSupportState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }

  try {
    const permission = await navigator.permissions.query({ name: 'notifications' as PermissionName })
    return permission.state as PushSupportState
  } catch {
    return Notification.permission as PushSupportState
  }
}

/** True when this device has an active push subscription in the browser. */
export async function hasPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch {
    return false
  }
}

export type PushEnableResult = { ok: boolean; error?: string }

export async function enablePushNotifications(): Promise<PushEnableResult> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, error: 'unsupported' }
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!publicKey) {
    return { ok: false, error: 'not-configured' }
  }

  let permission = Notification.permission
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission()
    } catch (error) {
      return { ok: false, error: `permission-error: ${errorMessage(error)}` }
    }
  }
  if (permission !== 'granted') {
    return { ok: false, error: permission === 'denied' ? 'denied' : 'dismissed' }
  }

  let registration: ServiceWorkerRegistration
  try {
    registration = await navigator.serviceWorker.ready
  } catch (error) {
    return { ok: false, error: `sw-not-ready: ${errorMessage(error)}` }
  }

  try {
    const existing = await registration.pushManager.getSubscription()
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    const subscriptionJson = subscription.toJSON()
    const endpoint = subscription.endpoint
    const keys = subscriptionJson.keys as { p256dh: string; auth: string } | undefined
    if (!keys) return { ok: false, error: 'no-keys' }

    let response: Response
    try {
      response = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, keys, deviceLabel: platformLabel() }),
        credentials: 'same-origin',
      })
    } catch (error) {
      return { ok: false, error: `network-error: ${errorMessage(error)}` }
    }

    if (!response.ok) {
      return { ok: false, error: `server-http-${response.status}` }
    }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: `subscribe-error: ${errorMessage(error)}` }
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function disablePushNotifications(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      try {
        await fetch('/api/push/unregister', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
          credentials: 'same-origin',
        })
      } catch {
        // Server removal is best-effort; still unsubscribe locally.
      }
      await subscription.unsubscribe()
    }
  } catch {
    // Best-effort removal.
  }
}

function platformLabel(): string {
  const userAgent = navigator.userAgent
  if (/android/i.test(userAgent)) return 'Android'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS'
  if (/mac/i.test(userAgent)) return 'macOS'
  if (/win/i.test(userAgent)) return 'Windows'
  if (/linux/i.test(userAgent)) return 'Linux'
  return 'Unknown device'
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }
  return outputArray
}
