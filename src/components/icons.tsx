import type { SVGProps } from 'react'

export type IconName = 'dashboard' | 'subscriptions' | 'add' | 'shield' | 'calendar' | 'storage'

type IconProps = SVGProps<SVGSVGElement> & { name: IconName }

export function Icon({ name, ...props }: IconProps) {
  const paths: Record<IconName, JSX.Element> = {
    dashboard: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    subscriptions: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 5h6M9 12h6m-6 4h4" />,
    add: <path d="M12 5v14m-7-7h14" />,
    shield: <path d="M12 3 19 6v5c0 4.2-2.9 8.1-7 9.5C7.9 19.1 5 15.2 5 11V6l7-3Zm-3 9 2 2 4-4" />,
    calendar: <path d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
    storage: <path d="M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm-8 3v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7m-16 5v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5" />,
  }

  return (
    <svg aria-hidden="true" fill={name === 'dashboard' ? 'currentColor' : 'none'} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" {...props}>
      {paths[name]}
    </svg>
  )
}
