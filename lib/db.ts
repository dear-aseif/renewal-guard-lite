import { createClient, type Client } from '@libsql/client'

let client: Client | null = null

/**
 * Returns a shared Turso client. Vercel Functions are stateless, so this
 * lazily creates a client per cold start using environment variables.
 */
export function getDb(): Client {
  if (client) return client

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.')
  }

  client = createClient({ url, authToken })
  return client
}
