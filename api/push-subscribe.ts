import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSessionSecret, isSessionTokenValid } from '../lib/auth.js'
import { getDb } from '../lib/db.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  if (!isAuthenticated(request)) {
    return response.status(401).json({ error: 'Not authenticated.' })
  }

  const { endpoint, keys, deviceLabel } = request.body ?? {}
  if (typeof endpoint !== 'string' || !endpoint
    || typeof keys?.p256dh !== 'string' || !keys.p256dh
    || typeof keys?.auth !== 'string' || !keys.auth) {
    return response.status(400).json({ error: 'endpoint, keys.p256dh and keys.auth are required.' })
  }

  const db = getDb()
  const now = new Date().toISOString()

  try {
    await db.execute({
      sql: `
        INSERT INTO push_subscriptions (endpoint, p256dh, auth, device_label, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (endpoint) DO UPDATE SET
          p256dh = excluded.p256dh,
          auth = excluded.auth,
          device_label = excluded.device_label,
          updated_at = excluded.updated_at
      `,
      args: [endpoint, keys.p256dh, keys.auth, typeof deviceLabel === 'string' ? deviceLabel : null, now, now],
    })
    return response.status(200).json({ ok: true })
  } catch (error) {
    console.error('push subscribe failed', error)
    return response.status(500).json({ error: 'Push subscription could not be saved.' })
  }
}

function isAuthenticated(request: VercelRequest): boolean {
  const secret = getSessionSecret()
  const cookie = parseCookie(request.headers.cookie)
  return isSessionTokenValid(cookie.rg_session, secret)
}

function parseCookie(header: string | undefined): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((part) => {
      const index = part.indexOf('=')
      if (index === -1) return [part.trim(), '']
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()]
    }),
  )
}
