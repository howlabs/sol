'use client'

import * as React from 'react'
import { CheckIcon, ChevronRightIcon, CircleIcon } from '@/lib/icons'
import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu'

import { cn } from '@/lib/utils'
import {
  applyRadixDismissHandlers,
  mapRadixCloseAutoFocus,
  mapRadixMenuItemSelectToClick,
  PopupDismissProvider,
  splitRadixContentCompatProps,
  usePopupDismissRegistry,
  useRegisterRadixDismissHandlers,
  type RadixContentCompatProps,
  type RadixMenuSelectHandler
} from './radix-popup-compat'

function ContextMenu({
  onOpenChange,
  ...props
}: ContextMenuPrimitive.Root.Props): React.JSX.Element {
  const { registry, handlersRef } = usePopupDismissRegistry()

  const handleOpenChange = React.useCallback<
    NonNullable<ContextMenuPrimitive.Root.Props['onOpenChange']>
  >(
    (open, details) => {
      applyRadixDismissHandlers(handlersRef.current, open, details)
      onOpenChange?.(open, details)
    },
    [handlersRef, onOpenChange]
  )

  return (
    <PopupDismissProvider registry={registry}>
      <ContextMenuPrimitive.Root
        data-slot="context-menu"
        onOpenChange={handleOpenChange}
        {...props}
      />
    </PopupDismissProvider>
  )
}

function ContextMenuTrigger({
  asChild,
  children,
  className,
  ...props
}: ContextMenuPrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  // Context menu trigger is a div region, not a native button control.
  if (asChild && React.isValidElement(children)) {
    return (
      <ContextMenuPrimitive.Trigger
        data-slot="context-menu-trigger"
        className={cn('select-none', className)}
        render={children as React.ReactElement}
        {...props}
      />
    )
  }
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn('select-none', className)}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Trigger>
  )
}

function ContextMenuGroup({ ...props }: ContextMenuPrimitive.Group.Props): React.JSX.Element {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
}

function ContextMenuPortal({ ...props }: ContextMenuPrimitive.Portal.Props): React.JSX.Element {
  return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
}

function ContextMenuSub({ ...props }: ContextMenuPrimitive.SubmenuRoot.Props): React.JSX.Element {
  return <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />
}

function ContextMenuRadioGroup({
  ...props
}: ContextMenuPrimitive.RadioGroup.Props): React.JSX.Element {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />
}

function ContextMenuContent({
  className,
  align = 'start',
  alignOffset = 4,
  side = 'right',
  sideOffset = 0,
  style,
  finalFocus,
  ...props
}: ContextMenuPrimitive.Popup.Props &
  Pick<ContextMenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'> &
  RadixContentCompatProps): React.JSX.Element {
  const { radix, rest } = splitRadixContentCompatProps(props)
  useRegisterRadixDismissHandlers(radix)

  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        className="isolate z-[70] outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          className={cn(
            'z-[70] max-h-(--available-height) min-w-[11rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-[11px] border border-black/14 bg-[rgba(255,255,255,0.82)] p-1 text-popover-foreground shadow-[0_16px_36px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl dark:border-white/14 dark:bg-[rgba(0,0,0,0.72)] dark:shadow-[0_20px_44px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.04)] data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className
          )}
          style={{ ...style, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          finalFocus={
            mapRadixCloseAutoFocus(
              radix.onCloseAutoFocus,
              finalFocus
            ) as ContextMenuPrimitive.Popup.Props['finalFocus']
          }
          {...rest}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}): React.JSX.Element {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex min-h-7 cursor-default items-center gap-2 rounded-[7px] px-2 py-1 text-[12px] leading-5 font-[450] outline-hidden select-none focus:bg-black/8 focus:text-accent-foreground data-inset:pl-8 data-open:bg-black/8 data-open:text-accent-foreground dark:focus:bg-white/14 dark:data-open:bg-white/14 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubmenuTrigger>
  )
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuContent>): React.JSX.Element {
  return (
    <ContextMenuContent
      data-slot="context-menu-sub-content"
      className={cn(className)}
      side="right"
      {...props}
    />
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = 'default',
  onSelect,
  onClick,
  ...props
}: ContextMenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: 'default' | 'destructive'
  onSelect?: RadixMenuSelectHandler
}): React.JSX.Element {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/context-menu-item relative flex min-h-7 cursor-default items-center gap-2 rounded-[7px] px-2 py-1 text-[12px] leading-5 font-[450] outline-hidden select-none focus:bg-black/8 focus:text-accent-foreground data-inset:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-white/14 dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 data-[variant=destructive]:*:[svg]:text-destructive",
        className
      )}
      onClick={mapRadixMenuItemSelectToClick({ onSelect, onClick })}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  onSelect,
  onClick,
  ...props
}: ContextMenuPrimitive.CheckboxItem.Props & {
  onSelect?: RadixMenuSelectHandler
}): React.JSX.Element {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(
        "relative flex min-h-7 cursor-default items-center gap-2 rounded-[7px] py-1 pr-2 pl-7 text-[12px] leading-5 font-[450] outline-hidden select-none focus:bg-black/8 focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-white/14 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      checked={checked}
      onClick={mapRadixMenuItemSelectToClick({ onSelect, onClick })}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.CheckboxItemIndicator>
          <CheckIcon className="size-3.5" />
        </ContextMenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioItem({
  className,
  children,
  onSelect,
  onClick,
  ...props
}: ContextMenuPrimitive.RadioItem.Props & {
  onSelect?: RadixMenuSelectHandler
}): React.JSX.Element {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(
        "relative flex min-h-7 cursor-default items-center gap-2 rounded-[7px] py-1 pr-2 pl-7 text-[12px] leading-5 font-[450] outline-hidden select-none focus:bg-black/8 focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-white/14 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      onClick={mapRadixMenuItemSelectToClick({ onSelect, onClick })}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.RadioItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </ContextMenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<'div'> & {
  inset?: boolean
}): React.JSX.Element {
  // Why: same as DropdownMenuLabel — Base UI GroupLabel throws without Menu.Group;
  // Sol context menus use free-standing section labels (Radix-compatible).
  return (
    <div
      data-slot="context-menu-label"
      data-inset={inset}
      role="presentation"
      className={cn(
        'px-2 py-1 text-[11px] font-semibold text-muted-foreground data-inset:pl-8',
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props): React.JSX.Element {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn('my-1 h-px bg-border/70', className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>): React.JSX.Element {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        'ml-auto shrink-0 whitespace-nowrap text-[11px] tracking-normal text-muted-foreground/85',
        className
      )}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup
}
