import Dexie, { type EntityTable } from 'dexie'

export type Subscription = {
  id: string
  name: string
  price: number
  currency: 'IDR' | 'USD' | 'EUR' | 'OTHER'
  billingCycle: 'weekly' | 'monthly' | 'yearly' | 'custom'
  customCycleDays?: number
  nextRenewalDate: string
  paymentMethod?: string
  accountEmail?: string
  paymentStatus: 'ready' | 'need_top_up' | 'review_first'
  notes?: string
  createdAt: string
  updatedAt: string
}

class RenewalGuardDatabase extends Dexie {
  subscriptions!: EntityTable<Subscription, 'id'>

  constructor() {
    super('renewalGuardLite')
    this.version(1).stores({
      subscriptions: 'id, name, nextRenewalDate, paymentStatus, createdAt',
    })
  }
}

export const db = new RenewalGuardDatabase()
