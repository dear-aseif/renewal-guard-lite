import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSessionSecret, isSessionTokenValid } from '../lib/auth'
import { getDb } from '../lib/db'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  if (!isAuthenticated(request)) {
    return response.status(401).json({ error: 'Not authenticated.' })
  }

  const { endpoint } = request.body ?? {}
  if (typeof endpoint !== 'string' || !endpoint) {
    return response.status(400).json({ error: 'endpoint is required.' })
  }

  const db = getDb()

  try {
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?',
      args: [endpoint],
    })
    return response.status(200).json({ ok: true })
  } catch (error) {
    console.error('push unsubscribe failed', error)
    return response.status(500).json({ error: 'Push subscription could not be removed.' })
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
