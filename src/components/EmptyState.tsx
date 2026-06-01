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
    <div className="relative overflow-hidden rounded-xl border border-dashed border-emerald-500/20 bg-neutral-950/60 px-5 py-10 text-center shadow-card backdrop-blur-xl sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.08)]">
        <Icon className="h-7 w-7" name={icon} />
      </div>
      <p className="mt-5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">Local workspace</p>
      <h3 className="mt-2 text-lg font-light tracking-[-0.02em] text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action}
    </div>
  )
}
