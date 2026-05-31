import type { ReactNode } from 'react'
import { Icon, type IconName } from './icons'

type EmptyStateProps = {
  action?: ReactNode
  description: string
  icon: IconName
  title: string
}

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-9 text-center shadow-card sm:px-8 sm:py-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Icon className="h-6 w-6" name={icon} />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action}
    </div>
  )
}
