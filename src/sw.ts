/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

// The precache manifest is injected by vite-plugin-pwa at build time.
precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

// Offline app-shell fallback for navigations.
const navigationRoute = new NavigationRoute(createHandlerBoundToURL('/index.html'))
registerRoute(navigationRoute)

self.skipWaiting()
clientsClaim()

type PushPayload = {
  title?: string
  body?: string
  url?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {}
  try {
    payload = event.data ? (event.data.json() as PushPayload) : {}
  } catch {
    // Non-JSON payloads are ignored.
  }

  const title = payload.title ?? 'Renewal Guard'
  const options: NotificationOptions = {
    body: payload.body ?? 'A subscription needs your attention.',
    icon: '/renewal-guard-icon.svg',
    badge: '/renewal-guard-icon.svg',
    data: { url: payload.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of allClients) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(targetUrl)
        return
      }
    }
    await self.clients.openWindow(targetUrl)
  })())
})

// Keep the server-side subscription fresh when the browser rotates keys.
// The TS WebWorker lib types this event as a plain Event, so we cast inside.
self.addEventListener('pushsubscriptionchange', ((event: Event) => {
  const extendableEvent = event as ExtendableEvent
  extendableEvent.waitUntil((async () => {
    const publicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? ''
    if (!publicKey) return

    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
    const endpoint = subscription.endpoint
    const keys = subscription.toJSON().keys as { p256dh: string; auth: string } | undefined
    if (keys) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, keys }),
        credentials: 'same-origin',
      })
    }
  })())
}) as EventListener)

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
