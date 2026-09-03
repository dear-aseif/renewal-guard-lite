// Client-side push subscription helpers. Called only from a user gesture.

export type PushPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export async function getPermissionState(): Promise<PushPermissionState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported'
  }

  if (!('Notification' in window)) return 'unsupported'

  try {
    const permission = await navigator.permissions.query({ name: 'notifications' as PermissionName })
    return permission.state as PushPermissionState
  } catch {
    return Notification.permission as PushPermissionState
  }
}

export async function enablePushNotifications(): Promise<{ ok: boolean; error?: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, error: 'unsupported' }
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!publicKey) {
    return { ok: false, error: 'not-configured' }
  }

  try {
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') {
      return { ok: false, error: permission === 'denied' ? 'denied' : 'dismissed' }
    }

    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    const subscriptionJson = subscription.toJSON()
    const endpoint = subscription.endpoint
    const keys = subscriptionJson.keys as { p256dh: string; auth: string } | undefined
    if (!keys) return { ok: false, error: 'no-keys' }

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, keys, deviceLabel: platformLabel() }),
      credentials: 'same-origin',
    })

    if (!response.ok) return { ok: false, error: 'server' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'failed' }
  }
}

export async function disablePushNotifications(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        credentials: 'same-origin',
      })
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
