import { useEffect, useState } from 'react'
import { getLastSyncedAt, getSyncStatus, subscribeSync, type SyncStatus } from '../services/sync'

export function useSyncController() {
  const [status, setStatus] = useState<SyncStatus>(() => getSyncStatus())
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function refreshLastSyncedAt() {
      const last = await getLastSyncedAt()
      if (isCurrent) setLastSyncedAt(last)
    }

    refreshLastSyncedAt()

    const unsubscribe = subscribeSync(() => {
      if (!isCurrent) return
      setStatus(getSyncStatus())
      void refreshLastSyncedAt()
    })

    return () => {
      isCurrent = false
      unsubscribe()
    }
  }, [])

  return { status, lastSyncedAt }
}
