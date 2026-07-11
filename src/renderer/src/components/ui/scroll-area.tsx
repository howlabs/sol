'use client'

import * as React from 'react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'

import { cn } from '@/lib/utils'

type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
  /** className merged onto the viewport (not the root). */
  viewportClassName?: string
  /** Ref attached to the viewport (the actual scrollable element). */
  viewportRef?: React.Ref<HTMLDivElement>
  /** Set e.g. -1 so the viewport can receive programmatic focus (explorer keyboard shortcuts after inline rename). */
  viewportTabIndex?: number
  /** Forwarded to the viewport (call sites clamp max-height here, not only on Root). */
  viewportProps?: ScrollAreaPrimitive.Viewport.Props
}

function ScrollArea({
  className,
  children,
  style,
  viewportClassName,
  viewportRef,
  viewportTabIndex,
  viewportProps,
  ...props
}: ScrollAreaProps): React.JSX.Element {
  const {
    className: viewportPropsClassName,
    style: viewportPropsStyle,
    ...viewportRest
  } = viewportProps ?? {}

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      // Why: match Radix ScrollArea Root's inline relative positioning so
      // absolute className on the root never wins unexpectedly (see test).
      style={{ ...style, position: 'relative' }}
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        tabIndex={viewportTabIndex}
        data-slot="scroll-area-viewport"
        className={cn(
          'size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          viewportClassName,
          viewportPropsClassName
        )}
        style={viewportPropsStyle}
        {...viewportRest}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props): React.JSX.Element {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent',
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
