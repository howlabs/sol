'use client'

import * as React from 'react'
import { CheckIcon, ChevronRightIcon, CircleIcon } from '@/lib/icons'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'

import { cn } from '@/lib/utils'
import {
  applyRadixDismissHandlers,
  mapRadixCloseAutoFocus,
  nativeButtonForAsChild,
  PopupDismissProvider,
  splitRadixContentCompatProps,
  usePopupDismissRegistry,
  useRegisterRadixDismissHandlers,
  type RadixContentCompatProps
} from './radix-popup-compat'

function DropdownMenu({ onOpenChange, ...props }: MenuPrimitive.Root.Props): React.JSX.Element {
  const { registry, handlersRef } = usePopupDismissRegistry()

  const handleOpenChange = React.useCallback<NonNullable<MenuPrimitive.Root.Props['onOpenChange']>>(
    (open, details) => {
      applyRadixDismissHandlers(handlersRef.current, open, details)
      onOpenChange?.(open, details)
    },
    [handlersRef, onOpenChange]
  )

  return (
    <PopupDismissProvider registry={registry}>
      <MenuPrimitive.Root data-slot="dropdown-menu" onOpenChange={handleOpenChange} {...props} />
    </PopupDismissProvider>
  )
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props): React.JSX.Element {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({
  asChild,
  children,
  nativeButton,
  ...props
}: MenuPrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  const resolvedNativeButton = nativeButtonForAsChild(asChild, children, nativeButton)
  if (asChild && React.isValidElement(children)) {
    return (
      <MenuPrimitive.Trigger
        data-slot="dropdown-menu-trigger"
        render={children as React.ReactElement}
        nativeButton={resolvedNativeButton}
        {...props}
      />
    )
  }
  return (
    <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props}>
      {children}
    </MenuPrimitive.Trigger>
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  style,
  finalFocus,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'> &
  RadixContentCompatProps): React.JSX.Element {
  const { radix, rest } = splitRadixContentCompatProps(props)
  useRegisterRadixDismissHandlers(radix)

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-[70] outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            'z-[70] max-h-(--available-height) min-w-[11rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto scrollbar-sleek rounded-[11px] border border-black/14 bg-[rgba(255,255,255,0.82)] p-1 text-black shadow-[0_16px_36px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl dark:border-white/14 dark:bg-[rgba(0,0,0,0.72)] dark:text-white dark:shadow-[0_20px_44px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.04)] data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className
          )}
          // Why: Electron titlebar drag region captures clicks without no-drag.
          style={{ ...style, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          finalFocus={
            mapRadixCloseAutoFocus(
              radix.onCloseAutoFocus,
              finalFocus
            ) as MenuPrimitive.Popup.Props['finalFocus']
          }
          {...rest}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props): React.JSX.Element {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}): React.JSX.Element {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex min-h-7 cursor-default items-center gap-2 rounded-[7px] px-2 py-1 text-[12px] leading-5 font-medium outline-hidden select-none focus:bg-black/8 focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:focus:bg-white/14 dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: MenuPrimitive.CheckboxItem.Props): React.JSX.Element {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex min-h-7 cursor-default items-center gap-2 rounded-[7px] py-1 pr-2 pl-7 text-[12px] leading-5 font-medium outline-hidden select-none focus:bg-black/8 focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-white/14 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon className="size-3.5" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props): React.JSX.Element {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props): React.JSX.Element {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex min-h-7 cursor-default items-center gap-2 rounded-[7px] py-1 pr-2 pl-7 text-[12px] leading-5 font-medium outline-hidden select-none focus:bg-black/8 focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-white/14 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.RadioItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<'div'> & {
  inset?: boolean
}): React.JSX.Element {
  // Why: Base UI GroupLabel requires Menu.Group context and throws if missing.
  // Sol (and Radix-era) call sites use free-standing section labels without a
  // group — render a presentation div so menus like SidebarWorkspaceOptions open.
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      role="presentation"
      className={cn(
        'px-2 py-1 text-[11px] font-semibold text-muted-foreground data-inset:pl-7',
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props): React.JSX.Element {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('my-1 h-px bg-border/70', className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>): React.JSX.Element {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'ml-auto shrink-0 whitespace-nowrap text-[11px] tracking-normal text-muted-foreground/85',
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props): React.JSX.Element {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}): React.JSX.Element {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex min-h-7 cursor-default items-center gap-2 rounded-[7px] px-2 py-1 text-[12px] leading-5 font-medium outline-hidden select-none focus:bg-black/8 focus:text-accent-foreground data-inset:pl-7 data-open:bg-black/8 data-open:text-accent-foreground dark:focus:bg-white/14 dark:data-open:bg-white/14 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-3.5" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  align = 'start',
  alignOffset = -3,
  side = 'right',
  sideOffset = 0,
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>): React.JSX.Element {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn('w-auto min-w-[11rem]', className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      style={style}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
}
