import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSessionCookieHeader, createSessionToken, getSessionSecret, isPasswordValid, isSessionTokenValid, sessionCookieHeader } from '../lib/auth'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'POST' && request.url?.endsWith('/api/auth/login')) {
    return handleLogin(request, response)
  }

  if (request.method === 'POST' && request.url?.endsWith('/api/auth/logout')) {
    response.setHeader('Set-Cookie', clearSessionCookieHeader())
    return response.status(200).json({ ok: true })
  }

  if (request.method === 'GET' && request.url?.endsWith('/api/auth/me')) {
    return handleMe(request, response)
  }

  response.setHeader('Allow', 'GET, POST')
  return response.status(405).json({ error: 'Method not allowed.' })
}

async function handleLogin(request: VercelRequest, response: VercelResponse) {
  if (typeof request.body?.password !== 'string') {
    return response.status(400).json({ error: 'Password is required.' })
  }

  if (!isPasswordValid(request.body.password)) {
    return response.status(401).json({ error: 'Incorrect password.' })
  }

  const secret = getSessionSecret()
  const token = createSessionToken(secret)
  response.setHeader('Set-Cookie', sessionCookieHeader(token))
  return response.status(200).json({ ok: true })
}

function handleMe(request: VercelRequest, response: VercelResponse) {
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
