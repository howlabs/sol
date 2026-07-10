'use client'

import * as React from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'

import { cn } from '@/lib/utils'

function TooltipProvider({
  delay = 0,
  delayDuration,
  disableHoverableContent: _disableHoverableContent,
  ...props
}: TooltipPrimitive.Provider.Props & {
  /** @deprecated Radix name — maps to Base UI `delay`. */
  delayDuration?: number
  /** Accepted for call-site compatibility; Base UI tooltips are non-interactive by default. */
  disableHoverableContent?: boolean
}): React.JSX.Element {
  // Why: app tooltips are non-interactive labels. Base UI default matches that.
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delayDuration ?? delay}
      {...props}
    />
  )
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props): React.JSX.Element {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  asChild,
  children,
  ...props
}: TooltipPrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  if (asChild && React.isValidElement(children)) {
    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-trigger"
        render={children as React.ReactElement}
        {...props}
      />
    )
  }
  return (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  )
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 0,
  align = 'center',
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >): React.JSX.Element {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-[90]"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          // Why: tooltip portals can be triggered from inside menus/popovers.
          // Keep labels above those floating surfaces instead of hidden behind them.
          className={cn(
            'pointer-events-none z-[90] inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
