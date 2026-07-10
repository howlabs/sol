'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'

import { cn } from '@/lib/utils'
import { updatePopoverContentRef } from './popover-content-ref'

function Popover(props: PopoverPrimitive.Root.Props): React.JSX.Element {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  asChild,
  children,
  ...props
}: PopoverPrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  if (asChild && React.isValidElement(children)) {
    return (
      <PopoverPrimitive.Trigger
        data-slot="popover-trigger"
        render={children as React.ReactElement}
        {...props}
      />
    )
  }
  return (
    <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}>
      {children}
    </PopoverPrimitive.Trigger>
  )
}

function PopoverAnchor({
  asChild,
  children,
  ...props
}: PopoverPrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  // Base UI popover uses Trigger positioning; Anchor maps to a positioned trigger render.
  if (asChild && React.isValidElement(children)) {
    return (
      <PopoverPrimitive.Trigger
        data-slot="popover-anchor"
        render={children as React.ReactElement}
        {...props}
      />
    )
  }
  return (
    <PopoverPrimitive.Trigger data-slot="popover-anchor" {...props}>
      {children}
    </PopoverPrimitive.Trigger>
  )
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  side = 'bottom',
  alignOffset = 0,
  portalContainer,
  style,
  onWheel,
  ref: forwardedRef,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'> & {
    portalContainer?: HTMLElement | null
  }): React.JSX.Element {
  const wheelFrameIdsRef = React.useRef<Set<number>>(new Set())

  const cancelWheelFrames = React.useCallback(() => {
    for (const frameId of wheelFrameIdsRef.current) {
      cancelAnimationFrame(frameId)
    }
    wheelFrameIdsRef.current.clear()
  }, [])

  const setContentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      return updatePopoverContentRef(forwardedRef, node, cancelWheelFrames)
    },
    [cancelWheelFrames, forwardedRef]
  )

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      onWheel?.(event)
      if (event.defaultPrevented) {
        return
      }

      const el = event.currentTarget
      if (!el.classList.contains('popover-scroll-content') || el.scrollHeight <= el.clientHeight) {
        return
      }

      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * el.clientHeight
            : event.deltaY
      const maxScrollTop = el.scrollHeight - el.clientHeight
      const nextScrollTop = Math.max(0, Math.min(maxScrollTop, el.scrollTop + delta))

      // Why: issue drawers are dialogs with scroll-lock. These popovers are
      // portaled outside the dialog subtree, so native wheel scrolling is
      // swallowed even though the scrollbar can be dragged.
      if (nextScrollTop !== el.scrollTop) {
        const previousScrollTop = el.scrollTop
        event.stopPropagation()
        const frameId = requestAnimationFrame(() => {
          wheelFrameIdsRef.current.delete(frameId)
          if (el.scrollTop === previousScrollTop) {
            el.scrollTop = nextScrollTop
          }
        })
        wheelFrameIdsRef.current.add(frameId)
      }
    },
    [onWheel]
  )

  return (
    <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-[60]"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'z-[60] overflow-hidden rounded-md border border-black/14 bg-[rgba(255,255,255,0.82)] text-popover-foreground shadow-[0_16px_36px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl outline-none dark:border-white/14 dark:bg-[rgba(0,0,0,0.72)] dark:shadow-[0_20px_44px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.04)] data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className
          )}
          ref={setContentRef}
          // Why: Electron's -webkit-app-region: drag on the titlebar captures
          // clicks at the OS level regardless of z-index. Without no-drag,
          // popovers that visually overlap the titlebar are unclickable.
          style={
            {
              ...style,
              WebkitAppRegion: 'no-drag'
            } as React.CSSProperties
          }
          onWheel={handleWheel}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
