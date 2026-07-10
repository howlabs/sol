import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card'
import { cn } from '@/lib/utils'

export function formatAgentCommandPreviewParts(props: {
  defaultCmd: string
  cmdOverride: string | undefined
  argsOverride: string
  envSummary: string
}): { display: React.ReactNode; plainText: string } {
  const { defaultCmd, cmdOverride, argsOverride, envSummary } = props
  const cmdPart = cmdOverride?.trim() ? cmdOverride.trim() : defaultCmd
  const plainText = [cmdPart, argsOverride.trim(), envSummary.trim()].filter(Boolean).join(' ')

  const display = (
    <>
      {cmdOverride ? (
        <span>
          <span className="text-muted-foreground/60 line-through">{defaultCmd}</span>
          <span className="ml-1.5 text-foreground/80">{cmdOverride}</span>
        </span>
      ) : (
        defaultCmd
      )}
      {argsOverride ? <span className="ml-1.5 text-foreground/70">{argsOverride}</span> : null}
      {envSummary ? <span className="ml-1.5 text-foreground/60">{envSummary}</span> : null}
    </>
  )

  return { display, plainText }
}

type AgentCatalogCommandPreviewProps = {
  defaultCmd: string
  cmdOverride: string | undefined
  argsOverride: string
  envSummary: string
  enableHoverCard: boolean
  className?: string
}

export function AgentCatalogCommandPreview({
  defaultCmd,
  cmdOverride,
  argsOverride,
  envSummary,
  enableHoverCard,
  className
}: AgentCatalogCommandPreviewProps): React.JSX.Element {
  const { display, plainText } = formatAgentCommandPreviewParts({
    defaultCmd,
    cmdOverride,
    argsOverride,
    envSummary
  })

  const line = (
    <p className={cn('truncate font-mono text-[11px] text-muted-foreground', className)}>
      {display}
    </p>
  )

  if (!enableHoverCard || plainText.length < 48) {
    return line
  }

  return (
    <HoverCard openDelay={280} closeDelay={80}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            'block w-full truncate font-mono text-[11px] text-muted-foreground',
            'rounded-sm hover:text-foreground'
          )}
        >
          {display}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-auto max-w-md p-3 font-mono text-[11px] leading-relaxed break-all"
      >
        {plainText}
      </HoverCardContent>
    </HoverCard>
  )
}
