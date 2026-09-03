import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { getDb } from '../lib/db'
import type { SubscriptionRow, PushSubscriptionRow } from '../lib/types'

const CRON_HEADER = 'x-vercel-cron-schedule'
const VERIFIED_CRON_USER_AGENT = 'vercel-cron/1.0'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  if (!isAuthorizedCron(request)) {
    return response.status(401).json({ error: 'Unauthorized.' })
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return response.status(500).json({ error: 'VAPID keys are not configured.' })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const db = getDb()
  const today = toDateInputValue(new Date())

  try {
    // Subscriptions renewing within their reminder window, plus anything overdue.
    const subscriptionResult = await db.execute({
      sql: `SELECT * FROM subscriptions
            WHERE deleted_at IS NULL
              AND next_renewal_date <= date(?, '+' || reminder_days_before || ' days')
            ORDER BY next_renewal_date ASC`,
      args: [today],
    })
    const subscriptions = subscriptionResult.rows as unknown as SubscriptionRow[]

    // Decide the notification "day key" for each subscription:
    //  - overdue (next_renewal_date < today)  -> key 'overdue' so we notify once,
    //    and never again until it is marked paid.
    //  - today or future within the window     -> key = next_renewal_date so each
    //    renewal date is notified at most once.
    const due = subscriptions.map((subscription) => ({
      subscription,
      dayKey: subscription.next_renewal_date < today ? 'overdue' : subscription.next_renewal_date,
    }))

    const notifiedResult = await db.execute({
      sql: 'SELECT subscription_id, day FROM notified_days WHERE day = ? OR day = ?',
      args: [today, 'overdue'],
    })
    const notifiedToday = new Set(notifiedResult.rows.map((row) => `${row.subscription_id}:${row.day}`))
    const fresh = due.filter(({ subscription, dayKey }) => !notifiedToday.has(`${subscription.id}:${dayKey}`))

    if (fresh.length === 0) {
      return response.status(200).json({ ok: true, notified: 0, skipped: due.length })
    }

    const pushResult = await db.execute('SELECT * FROM push_subscriptions')
    const pushSubscriptions = pushResult.rows as unknown as PushSubscriptionRow[]

    let notified = 0
    const results: { id: string; status: string }[] = []

    for (const { subscription, dayKey } of fresh) {
      const daysLeft = differenceInDays(subscription.next_renewal_date, today)
      const title = daysLeft < 0 ? `Overdue: ${subscription.name}` : daysLeft === 0 ? `Renews today: ${subscription.name}` : `Renewal in ${daysLeft} day${daysLeft === 1 ? '' : 's'}: ${subscription.name}`
      const body = `${subscription.currency} ${subscription.price.toLocaleString()} · next renewal ${subscription.next_renewal_date}`

      const payload = JSON.stringify({ title, body, url: '/' })

      let sentToAny = false
      for (const pushSubscription of pushSubscriptions) {
        try {
          await webpush.sendNotification({ endpoint: pushSubscription.endpoint, keys: { p256dh: pushSubscription.p256dh, auth: pushSubscription.auth } }, payload)
          sentToAny = true
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await db.execute({ sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?', args: [pushSubscription.endpoint] })
          } else {
            console.error(`push failed for ${pushSubscription.endpoint}`, error)
          }
        }
      }

      if (sentToAny) {
        await db.execute({ sql: 'INSERT OR IGNORE INTO notified_days (subscription_id, day) VALUES (?, ?)', args: [subscription.id, dayKey] })
        notified += 1
      }
      results.push({ id: subscription.id, status: sentToAny ? 'notified' : 'no-device' })
    }

    return response.status(200).json({ ok: true, notified, results })
  } catch (error) {
    console.error('cron failed', error)
    return response.status(500).json({ error: 'Cron failed.' })
  }
}

function isAuthorizedCron(request: VercelRequest): boolean {
  // Vercel sets this header/user-agent when it invokes the cron. We also accept
  // a CRON_SECRET query param so you can trigger a manual test with curl.
  if (request.headers[CRON_HEADER] && request.headers['user-agent'] === VERIFIED_CRON_USER_AGENT) {
    return true
  }

  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.query.secret === secret)
}

function differenceInDays(dateInput: string, fromInput: string): number {
  const from = new Date(`${fromInput}T00:00:00`).getTime()
  const target = new Date(`${dateInput}T00:00:00`).getTime()
  return Math.round((target - from) / 86_400_000)
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
