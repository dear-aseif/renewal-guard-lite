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
    <div className="ui-card border-dashed px-5 py-10 text-center sm:px-8 sm:py-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700 shadow-sm">
        <Icon className="h-7 w-7" name={icon} />
      </div>
      <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action}
    </div>
  )
}
