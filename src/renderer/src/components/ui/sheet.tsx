'use client'

import * as React from 'react'
import { XIcon } from '@/lib/icons'
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import {
  applyRadixDismissHandlers,
  mapRadixCloseAutoFocus,
  mapRadixOpenAutoFocus,
  nativeButtonForAsChild,
  PopupDismissProvider,
  splitRadixContentCompatProps,
  usePopupDismissRegistry,
  useRegisterRadixDismissHandlers,
  type RadixContentCompatProps
} from './radix-popup-compat'

function Sheet({ onOpenChange, ...props }: SheetPrimitive.Root.Props): React.JSX.Element {
  const { registry, handlersRef } = usePopupDismissRegistry()

  const handleOpenChange = React.useCallback<
    NonNullable<SheetPrimitive.Root.Props['onOpenChange']>
  >(
    (open, details) => {
      applyRadixDismissHandlers(handlersRef.current, open, details)
      onOpenChange?.(open, details)
    },
    [handlersRef, onOpenChange]
  )

  return (
    <PopupDismissProvider registry={registry}>
      <SheetPrimitive.Root data-slot="sheet" onOpenChange={handleOpenChange} {...props} />
    </PopupDismissProvider>
  )
}

function SheetTrigger({
  asChild,
  children,
  nativeButton,
  ...props
}: SheetPrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  // Why: Base UI uses `render` (not Radix asChild). Map asChild so call sites
  // keep working and avoid nested <button> hosts.
  const resolvedNativeButton = nativeButtonForAsChild(asChild, children, nativeButton)
  if (asChild && React.isValidElement(children)) {
    return (
      <SheetPrimitive.Trigger
        data-slot="sheet-trigger"
        render={children as React.ReactElement}
        nativeButton={resolvedNativeButton}
        {...props}
      />
    )
  }
  return (
    <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props}>
      {children}
    </SheetPrimitive.Trigger>
  )
}

function SheetClose({
  asChild,
  children,
  nativeButton,
  ...props
}: SheetPrimitive.Close.Props & { asChild?: boolean }): React.JSX.Element {
  const resolvedNativeButton = nativeButtonForAsChild(asChild, children, nativeButton)
  if (asChild && React.isValidElement(children)) {
    return (
      <SheetPrimitive.Close
        data-slot="sheet-close"
        render={children as React.ReactElement}
        nativeButton={resolvedNativeButton}
        {...props}
      />
    )
  }
  return (
    <SheetPrimitive.Close data-slot="sheet-close" {...props}>
      {children}
    </SheetPrimitive.Close>
  )
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props): React.JSX.Element {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  style,
  ...props
}: SheetPrimitive.Backdrop.Props): React.JSX.Element {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] transition-opacity duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className
      )}
      // Why: Electron drag hit-test ignores z-index without no-drag.
      style={{ ...style, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      {...props}
    />
  )
}

const sheetContentVariants = cva(
  'fixed z-50 flex flex-col gap-0 bg-background/96 text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl outline-none transition duration-200 ease-in-out dark:bg-[rgba(23,23,23,0.96)] dark:shadow-[0_24px_72px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] data-open:animate-in data-closed:animate-out',
  {
    variants: {
      side: {
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l border-black/14 data-closed:slide-out-to-right data-open:slide-in-from-right dark:border-white/14 sm:max-w-[560px]',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r border-black/14 data-closed:slide-out-to-left data-open:slide-in-from-left dark:border-white/14 sm:max-w-[560px]',
        top: 'inset-x-0 top-0 h-auto border-b border-black/14 data-closed:slide-out-to-top data-open:slide-in-from-top dark:border-white/14',
        bottom:
          'inset-x-0 bottom-0 h-auto border-t border-black/14 data-closed:slide-out-to-bottom data-open:slide-in-from-bottom dark:border-white/14'
      }
    },
    defaultVariants: {
      side: 'right'
    }
  }
)

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  overlayClassName,
  overlayStyle,
  style,
  initialFocus,
  finalFocus,
  ...props
}: SheetPrimitive.Popup.Props &
  VariantProps<typeof sheetContentVariants> &
  RadixContentCompatProps & {
    showCloseButton?: boolean
    overlayClassName?: string
    overlayStyle?: React.CSSProperties
  }): React.JSX.Element {
  const { radix, rest } = splitRadixContentCompatProps(props)
  useRegisterRadixDismissHandlers(radix)

  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} style={overlayStyle} />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetContentVariants({ side }), className)}
        style={{ ...style, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        initialFocus={
          mapRadixOpenAutoFocus(
            radix.onOpenAutoFocus,
            initialFocus
          ) as SheetPrimitive.Popup.Props['initialFocus']
        }
        finalFocus={
          mapRadixCloseAutoFocus(
            radix.onCloseAutoFocus,
            finalFocus
          ) as SheetPrimitive.Popup.Props['finalFocus']
        }
        {...rest}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={<Button variant="ghost" className="absolute top-4 right-4" size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">
              {translate('auto.components.ui.dialog.f26c4baeda', 'Close')}
            </span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-6', className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props): React.JSX.Element {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props): React.JSX.Element {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
}
