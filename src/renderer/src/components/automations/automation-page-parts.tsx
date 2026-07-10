import React from 'react'
import type { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AutomationRun } from '../../../../shared/automations-types'

export function formatAutomationDateTime(value: number | null | undefined): string {
  if (!value) {
    return 'Never'
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(value)
}

export function formatAutomationRelativeTime(
  value: number | null | undefined,
  now = Date.now()
): string | null {
  if (!value) {
    return null
  }
  const diffMs = value - now
  const absMs = Math.abs(diffMs)
  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs
  const format = (amount: number, unit: string): string => `${amount}${unit}`
  let text: string
  if (absMs < minuteMs) {
    text = 'now'
  } else if (absMs < hourMs) {
    text = format(Math.round(absMs / minuteMs), 'm')
  } else if (absMs < dayMs) {
    text = format(Math.round(absMs / hourMs), 'h')
  } else {
    text = format(Math.round(absMs / dayMs), 'd')
  }
  if (text === 'now') {
    return text
  }
  return diffMs >= 0 ? `in ${text}` : `${text} ago`
}

export function formatAutomationDateTimeWithRelative(
  value: number | null | undefined,
  now = Date.now()
): string {
  const absolute = formatAutomationDateTime(value)
  const relative = formatAutomationRelativeTime(value, now)
  return relative ? `${absolute} (${relative})` : absolute
}

export function getAutomationRunStatusVariant(
  status: AutomationRun['status']
): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'dispatched' || status === 'completed') {
    return 'secondary'
  }
  if (status.startsWith('skipped')) {
    return 'outline'
  }
  if (status === 'dispatch_failed') {
    return 'destructive'
  }
  return 'dot'
}

export function getAutomationRunStatusLabel(status: AutomationRun['status']): string {
  switch (status) {
    case 'pending':
      return 'Queued'
    case 'dispatching':
      return 'Starting'
    case 'dispatched':
      return 'Launched'
    case 'completed':
      return 'Done'
    case 'skipped_precheck':
      return 'Precheck skipped'
    case 'skipped_missed':
      return 'Skipped'
    case 'skipped_unavailable':
      return 'Unavailable'
    case 'skipped_needs_interactive_auth':
      return 'Needs credentials'
    case 'dispatch_failed':
      return 'Failed'
  }
}

export function Field({
  label,
  children,
  className
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

export function Metric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-card px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 truncate text-[15px] font-semibold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  )
}

/**
 * High-contrast list row: thick left rail when selected, roomy padding.
 * Intentionally different from prior muted card/stack styles.
 */
export function automationListItemClass(selected: boolean): string {
  return cn(
    'group mb-0 block w-full border-b border-border/60 px-4 py-4 text-left transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40',
    selected
      ? 'border-l-4 border-l-foreground bg-background'
      : 'border-l-4 border-l-transparent bg-transparent hover:bg-background/80'
  )
}
