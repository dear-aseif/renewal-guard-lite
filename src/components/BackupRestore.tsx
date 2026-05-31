import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { db } from '../db/database'
import { createBackup, isBackupRecommended, LAST_BACKUP_AT_KEY, parseBackup } from '../utils/backup'
import { Icon } from './icons'

export function BackupRestore() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lastBackupAt, setLastBackupAt] = useState(() => localStorage.getItem(LAST_BACKUP_AT_KEY))
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' }>()
  const [isWorking, setIsWorking] = useState(false)
  const backupRecommended = isBackupRecommended(lastBackupAt)

  async function exportBackup() {
    setMessage(undefined)
    setIsWorking(true)

    try {
      const [subscriptions, renewalHistory] = await Promise.all([db.subscriptions.toArray(), db.renewalHistory.toArray()])
      const backup = createBackup(subscriptions, renewalHistory)
      const downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `renewal-guard-backup-${backup.exportedAt.slice(0, 10)}.json`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
      localStorage.setItem(LAST_BACKUP_AT_KEY, backup.exportedAt)
      setLastBackupAt(backup.exportedAt)
      setMessage({ text: 'Backup exported successfully. Keep the JSON file somewhere safe.', type: 'success' })
    } catch {
      setMessage({ text: 'The backup could not be exported. Please try again.', type: 'error' })
    } finally {
      setIsWorking(false)
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setMessage(undefined)
    setIsWorking(true)

    try {
      const backup = parseBackup(await file.text())
      const shouldReplace = window.confirm(`Replace all local subscriptions with ${backup.subscriptions.length} subscription${backup.subscriptions.length === 1 ? '' : 's'} from this backup?`)
      if (!shouldReplace) return

      await db.transaction('rw', db.subscriptions, db.renewalHistory, async () => {
        await db.subscriptions.clear()
        await db.renewalHistory.clear()
        await db.subscriptions.bulkAdd(backup.subscriptions)
        await db.renewalHistory.bulkAdd(backup.renewalHistory)
      })
      setMessage({ text: `Import complete. ${backup.subscriptions.length} local subscription${backup.subscriptions.length === 1 ? '' : 's'} restored.`, type: 'success' })
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'The backup could not be imported. Please choose a valid backup file.', type: 'error' })
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className={`rounded-3xl border p-5 shadow-card sm:p-6 ${backupRecommended ? 'border-amber-200 bg-amber-50' : 'border-teal-100 bg-teal-50'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${backupRecommended ? 'text-amber-700' : 'text-teal-700'}`}>Backup status</p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">{backupRecommended ? 'Backup recommended' : 'Backup is up to date'}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{lastBackupAt ? `Last backup: ${formatDateTime(lastBackupAt)}` : 'Last backup: Never'}</p>
          </div>
          <Icon className={`h-7 w-7 shrink-0 ${backupRecommended ? 'text-amber-700' : 'text-teal-700'}`} name="storage" />
        </div>
      </div>

      {message && <p className={message.type === 'success' ? 'feedback-success' : 'feedback-error'} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <BackupCard description="Download every locally saved subscription as a JSON file. Nothing is uploaded." title="Export JSON backup">
          <button className="btn-primary mt-5 w-full" disabled={isWorking} onClick={() => void exportBackup()} type="button">Export JSON</button>
        </BackupCard>

        <BackupCard description="Choose a Renewal Guard JSON backup. Existing local subscriptions are replaced only after you confirm." title="Import JSON backup">
          <input accept="application/json,.json" className="hidden" onChange={(event) => void importBackup(event)} ref={fileInputRef} type="file" />
          <button className="btn-secondary mt-5 w-full" disabled={isWorking} onClick={() => fileInputRef.current?.click()} type="button">Choose JSON file</button>
        </BackupCard>
      </div>

      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-500">Manual backup only. Files stay on your device unless you choose to move them yourself.</p>
    </section>
  )
}

function BackupCard({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <article className="ui-card ui-card-interactive p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {children}
    </article>
  )
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}
