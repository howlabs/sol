import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/** One bordered list of selectable accounts. */
export function ProviderAccountList(props: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div
      role="radiogroup"
      className={cn(
        'overflow-hidden rounded-lg border border-border/60 divide-y divide-border/50',
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

export function ProviderAccountEmptyState(props: { children: React.ReactNode }): React.JSX.Element {
  return <div className="px-3 py-3 text-xs text-muted-foreground">{props.children}</div>
}

export function ProviderSectionHeader(props: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex h-8 items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/40 text-muted-foreground">
        {props.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] font-medium leading-none text-foreground">{props.title}</h3>
        {props.description ? (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {props.description}
          </p>
        ) : null}
      </div>
      {props.action ? (
        <div className="flex shrink-0 items-center gap-0.5">{props.action}</div>
      ) : null}
    </div>
  )
}

export function ProviderAccountStatusBadge(props: {
  kind: 'active' | 'danger' | 'meta'
  children: React.ReactNode
}): React.JSX.Element {
  if (props.kind === 'danger') {
    return (
      <Badge
        variant="destructive"
        className="h-5 shrink-0 rounded-full px-1.5 text-[10px] font-medium leading-none"
      >
        {props.children}
      </Badge>
    )
  }
  if (props.kind === 'active') {
    return (
      <Badge
        variant="outline"
        className="h-5 shrink-0 rounded-full border-foreground/30 bg-foreground text-[10px] font-medium leading-none text-background"
      >
        {props.children}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="h-5 shrink-0 rounded-full px-1.5 text-[10px] font-medium leading-none text-muted-foreground"
    >
      {props.children}
    </Badge>
  )
}

/**
 * One-line account row: radio · label · status · always-visible actions.
 * Primary click selects; secondary actions stay icon buttons with labels for hit size.
 */
export function ProviderAccountRow(props: {
  active?: boolean
  danger?: boolean
  disabled?: boolean
  onSelect?: () => void
  title: React.ReactNode
  /** Optional second line; keep short. */
  subtitle?: React.ReactNode
  badges?: React.ReactNode
  actions?: React.ReactNode
}): React.JSX.Element {
  const surface = props.danger
    ? 'bg-destructive/[0.06]'
    : props.active
      ? 'bg-accent'
      : 'hover:bg-accent/40'

  return (
    <div
      data-active={props.active ? 'true' : undefined}
      className={cn(
        'flex min-h-9 w-full items-center gap-1.5 px-2 py-1',
        surface,
        props.disabled && 'opacity-70'
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={props.active === true}
        onClick={props.onSelect}
        disabled={props.disabled || !props.onSelect}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-md px-0.5 py-0.5 text-left',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-default'
        )}
      >
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full border',
            props.danger
              ? 'border-destructive/70'
              : props.active
                ? 'border-foreground bg-foreground'
                : 'border-muted-foreground/40'
          )}
          aria-hidden
        >
          {props.active ? <span className="size-1.5 rounded-full bg-background" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-foreground">{props.title}</span>
            {props.badges}
          </span>
          {props.subtitle ? (
            <span
              className={cn(
                'mt-0.5 block truncate text-[11px]',
                props.danger ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {props.subtitle}
            </span>
          ) : null}
        </span>
      </button>
      {props.actions ? (
        <div className="flex shrink-0 items-center gap-0.5">{props.actions}</div>
      ) : null}
    </div>
  )
}
