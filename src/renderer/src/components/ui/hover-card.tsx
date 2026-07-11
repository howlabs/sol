'use client'

import * as React from 'react'
import { PreviewCard as PreviewCardPrimitive } from '@base-ui/react/preview-card'

import { cn } from '@/lib/utils'

// Why: Base UI PreviewCard puts delay/closeDelay on Trigger, not Root.
// Radix HoverCard put them on Root. Forward via context so call sites
// can keep passing openDelay/closeDelay to <HoverCard>.
const HoverCardDelayContext = React.createContext<{
  delay?: number
  closeDelay?: number
}>({})

function HoverCard({
  openDelay,
  closeDelay,
  ...props
}: PreviewCardPrimitive.Root.Props & {
  /** @deprecated Radix name — forwarded to Trigger as `delay`. */
  openDelay?: number
  /** @deprecated Radix name — forwarded to Trigger as `closeDelay`. */
  closeDelay?: number
}): React.JSX.Element {
  const ctx = React.useMemo(() => ({ delay: openDelay, closeDelay }), [openDelay, closeDelay])
  return (
    <HoverCardDelayContext.Provider value={ctx}>
      <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />
    </HoverCardDelayContext.Provider>
  )
}

function HoverCardTrigger({
  asChild,
  children,
  delay: delayProp,
  closeDelay: closeDelayProp,
  ...props
}: PreviewCardPrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  const ctx = React.useContext(HoverCardDelayContext)
  // Why: explicit trigger props win over root-level forwarded defaults.
  const delay = delayProp ?? ctx.delay
  const closeDelay = closeDelayProp ?? ctx.closeDelay
  if (asChild && React.isValidElement(children)) {
    return (
      <PreviewCardPrimitive.Trigger
        data-slot="hover-card-trigger"
        render={children as React.ReactElement}
        delay={delay}
        closeDelay={closeDelay}
        {...props}
      />
    )
  }
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    >
      {children}
    </PreviewCardPrimitive.Trigger>
  )
}

function HoverCardContent({
  className,
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 4,
  collisionPadding,
  collisionBoundary,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding' | 'collisionBoundary'
  >): React.JSX.Element {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        collisionBoundary={collisionBoundary}
        className="isolate z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            'z-50 w-64 origin-(--transform-origin) rounded-md border border-black/14 bg-[rgba(255,255,255,0.82)] p-4 text-popover-foreground shadow-[0_16px_36px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl outline-hidden dark:border-white/14 dark:bg-[rgba(0,0,0,0.72)] dark:shadow-[0_20px_44px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.04)] data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
