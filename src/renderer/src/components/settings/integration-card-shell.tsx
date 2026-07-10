import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIntegrationCardShellClass } from './integration-card-presentation'

export type IntegrationCardStatusTone = 'connected' | 'attention' | 'neutral'

const STATUS_TONE_CLASSES: Record<IntegrationCardStatusTone, string> = {
  connected: 'border-status-success-border bg-status-success-background text-status-success',
  attention: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  neutral: 'border-border bg-background text-muted-foreground'
}

export function IntegrationCardShell(props: {
  icon: React.ReactNode
  name: string
  /** @deprecated Distilled cards omit body copy; kept optional for call sites mid-migration. */
  description?: React.ReactNode
  statusLabel: string
  statusTone: IntegrationCardStatusTone
  checking?: boolean
  className?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}): React.JSX.Element {
  const shellClass = useIntegrationCardShellClass(props.className)
  const status = props.checking ? (
    <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
  ) : (
    <span
      className={cn(
        'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        STATUS_TONE_CLASSES[props.statusTone]
      )}
    >
      {props.statusLabel}
    </span>
  )

  return (
    <div className={shellClass}>
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/30 text-muted-foreground">
          {props.icon}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="truncate text-[13px] font-medium leading-5 text-foreground">{props.name}</p>
          {status}
        </div>
        {props.actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {props.actions}
          </div>
        ) : null}
      </div>
      {props.children}
    </div>
  )
}

export function IntegrationCardDetails(props: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={cn('mt-2 space-y-1.5 border-t border-border/50 pt-2', props.className)}>
      {props.children}
    </div>
  )
}
