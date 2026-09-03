// Signed session-cookie helpers for a single-user app.
// We sign the session with HMAC-SHA256 using SESSION_SECRET. The cookie is
// HttpOnly, SameSite=Lax, Secure (in production) so it is not readable by JS.

import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_COOKIE = 'rg_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

export function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function signSession(payload: string, secret: string): string {
  return `${payload}.${sign(payload, secret)}`
}

export function verifySession(token: string, secret: string): boolean {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex <= 0 || dotIndex === token.length - 1) return false

  const payload = token.slice(0, dotIndex)
  const signature = token.slice(dotIndex + 1)
  const expected = sign(payload, secret)

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (signatureBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(signatureBuffer, expectedBuffer)
}

export function timingSafeCompare(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET must be set.')
  return secret
}

export function isPasswordValid(password: string): boolean {
  const expected = process.env.APP_PASSWORD
  if (!expected || expected.length < 12) return false
  return timingSafeCompare(password, expected)
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`
}

export function clearSessionCookieHeader(): string {
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

const SESSION_PAYLOAD = 'rg-user'

export function createSessionToken(secret: string): string {
  return signSession(SESSION_PAYLOAD, secret)
}

export function isSessionTokenValid(token: string | undefined | null, secret: string): boolean {
  if (!token) return false
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex <= 0) return false
  return verifySession(token, secret)
}
