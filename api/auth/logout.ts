import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSessionCookieHeader } from '../../lib/auth.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  response.setHeader('Set-Cookie', clearSessionCookieHeader())
  return response.status(200).json({ ok: true })
}
