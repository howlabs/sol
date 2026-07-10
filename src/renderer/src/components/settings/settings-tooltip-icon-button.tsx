import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { cn } from '@/lib/utils'

type SettingsTooltipIconButtonProps = {
  tooltip: string
  ariaLabel: string
  className?: string
  children: React.ReactNode
} & ({ href: string; onClick?: never } | { href?: never; onClick?: () => void; type?: 'button' })

export function SettingsTooltipIconButton(
  props: SettingsTooltipIconButtonProps
): React.JSX.Element {
  const { tooltip, ariaLabel, className, children } = props

  const button = (
    <Button
      variant="outline"
      size="icon-sm"
      type={props.href ? undefined : (props.type ?? 'button')}
      onClick={props.href ? undefined : props.onClick}
      asChild={Boolean(props.href)}
      aria-label={ariaLabel}
      className={cn('text-muted-foreground hover:text-foreground', className)}
    >
      {props.href ? (
        <a href={props.href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : (
        children
      )}
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
