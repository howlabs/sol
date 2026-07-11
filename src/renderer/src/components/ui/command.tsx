'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from '@/lib/icons'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { RadixPreventableHandler } from './radix-popup-compat'

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  children,
  title = 'Command Palette',
  description = 'Search for a command to run...',
  shouldFilter,
  onOpenAutoFocus,
  onCloseAutoFocus,
  contentClassName,
  overlayClassName,
  commandProps,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  shouldFilter?: boolean
  onOpenAutoFocus?: RadixPreventableHandler
  onCloseAutoFocus?: RadixPreventableHandler
  contentClassName?: string
  overlayClassName?: string
  commandProps?: React.ComponentProps<typeof CommandPrimitive>
}) {
  const { className: commandClassName, ...commandRootProps } = commandProps ?? {}

  return (
    <Dialog {...props}>
      <DialogContent
        showCloseButton={false}
        overlayClassName={overlayClassName}
        className={cn(
          'top-[20%] w-[660px] max-w-[90vw] translate-y-0 gap-0 p-0 sm:max-w-[660px]',
          contentClassName
        )}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <Command
          shouldFilter={shouldFilter}
          className={cn(
            '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3',
            commandClassName
          )}
          {...commandRootProps}
        >
          {children as React.ReactNode}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  wrapperClassName,
  iconClassName,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  wrapperClassName?: string
  iconClassName?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center border-b border-border bg-muted/30 px-3 py-1',
        wrapperClassName
      )}
      data-cmdk-input-wrapper=""
    >
      <SearchIcon className={cn('mr-2 h-4 w-4 shrink-0 opacity-50', iconClassName)} />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'flex h-8 w-full rounded-md bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const internalRef = React.useRef<HTMLDivElement>(null)

  // Why: Radix Dialog applies react-remove-scroll which calls preventDefault()
  // on wheel events for portaled elements (e.g. Popover) outside the Dialog's
  // DOM tree. The scrollbar renders (CSS overflow works) but the browser never
  // scrolls because the native event is cancelled. A non-passive wheel listener
  // directly on the list takes over scrolling manually so it works regardless
  // of whether a scroll-lock is active.
  React.useEffect(() => {
    const el = internalRef.current
    if (!el) {
      return
    }
    const onWheel = (e: WheelEvent): void => {
      if (el.scrollHeight <= el.clientHeight) {
        return
      }
      e.preventDefault()
      el.scrollTop += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  return (
    <CommandPrimitive.List
      ref={mergedRef}
      data-slot="command-list"
      className={cn(
        'max-h-[min(400px,60vh)] overflow-y-auto overflow-x-hidden scrollbar-sleek scroll-pb-4 scroll-pt-4',
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'relative flex cursor-default gap-1.5 select-none items-center rounded-sm px-2 py-1 text-xs outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-3.5',
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
}
