import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSessionSecret, isSessionTokenValid } from '../../lib/auth.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  const secret = getSessionSecret()
  const cookie = parseCookie(request.headers.cookie)
  const authenticated = isSessionTokenValid(cookie.rg_session, secret)
  return response.status(200).json({ authenticated })
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
