import { RefreshCw } from '@/lib/icons'
import { USAGE_PANEL_SHELL_CLASS } from './usage-panel-shell'

type ClaudeUsageLoadingStateProps = {
  title?: string
  summaryCardCount?: number
  summaryGridClassName?: string
}

export function ClaudeUsageLoadingState({
  title = 'Claude Usage Tracking',
  summaryCardCount = 8,
  summaryGridClassName = 'md:grid-cols-2 xl:grid-cols-4'
}: ClaudeUsageLoadingStateProps): React.JSX.Element {
  return (
    <div className={USAGE_PANEL_SHELL_CLASS}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-xs font-semibold tracking-tight text-foreground">{title}</h3>
          <div className="h-2.5 w-40 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />
          <div
            aria-hidden
            className="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border border-transparent bg-foreground/80"
          >
            <span className="pointer-events-none block size-3 translate-x-3 rounded-full bg-background shadow-sm" />
          </div>
        </div>
      </div>

      <div className="h-2.5 w-48 animate-pulse rounded bg-muted/60" />

      <div className={`grid gap-2 ${summaryGridClassName}`}>
        {Array.from({ length: summaryCardCount }, (_, index) => (
          <div
            key={index}
            className="space-y-2 rounded-md border border-border/50 bg-muted/15 px-3 py-2"
          >
            <div className="h-2.5 w-24 animate-pulse rounded bg-muted/70" />
            <div className="h-6 w-20 animate-pulse rounded bg-muted/60" />
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-border/40 pt-3">
        <div className="mb-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
          <div className="h-2.5 w-56 animate-pulse rounded bg-muted/60" />
        </div>
        <div className="grid h-40 grid-cols-10 items-end gap-2">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="flex h-full flex-col justify-end gap-1.5">
              <div className="mx-auto h-2.5 w-8 animate-pulse rounded bg-muted/60" />
              <div className="flex min-h-0 flex-1 items-end justify-center">
                <div
                  className="w-full max-w-10 animate-pulse rounded-t-sm bg-muted/60"
                  style={{ height: `${35 + ((index % 5) + 1) * 10}%` }}
                />
              </div>
              <div className="mx-auto h-2.5 w-10 animate-pulse rounded bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
