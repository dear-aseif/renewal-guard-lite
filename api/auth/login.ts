import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSessionToken, getSessionSecret, isPasswordValid, sessionCookieHeader } from '../../lib/auth.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

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
