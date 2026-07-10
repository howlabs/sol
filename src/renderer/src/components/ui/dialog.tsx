'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from '@/lib/icons'

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

function Dialog({ onOpenChange, ...props }: DialogPrimitive.Root.Props): React.JSX.Element {
  const { registry, handlersRef } = usePopupDismissRegistry()

  const handleOpenChange = React.useCallback<
    NonNullable<DialogPrimitive.Root.Props['onOpenChange']>
  >(
    (open, details) => {
      applyRadixDismissHandlers(handlersRef.current, open, details)
      onOpenChange?.(open, details)
    },
    [handlersRef, onOpenChange]
  )

  return (
    <PopupDismissProvider registry={registry}>
      <DialogPrimitive.Root data-slot="dialog" onOpenChange={handleOpenChange} {...props} />
    </PopupDismissProvider>
  )
}

function DialogTrigger({
  asChild,
  children,
  nativeButton,
  ...props
}: DialogPrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  // Why: Base UI uses `render` (not Radix asChild). Map asChild so call sites
  // keep working and avoid nested <button> hosts.
  const resolvedNativeButton = nativeButtonForAsChild(asChild, children, nativeButton)
  if (asChild && React.isValidElement(children)) {
    return (
      <DialogPrimitive.Trigger
        data-slot="dialog-trigger"
        render={children as React.ReactElement}
        nativeButton={resolvedNativeButton}
        {...props}
      />
    )
  }
  return (
    <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props}>
      {children}
    </DialogPrimitive.Trigger>
  )
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props): React.JSX.Element {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  asChild,
  children,
  nativeButton,
  ...props
}: DialogPrimitive.Close.Props & { asChild?: boolean }): React.JSX.Element {
  const resolvedNativeButton = nativeButtonForAsChild(asChild, children, nativeButton)
  if (asChild && React.isValidElement(children)) {
    return (
      <DialogPrimitive.Close
        data-slot="dialog-close"
        render={children as React.ReactElement}
        nativeButton={resolvedNativeButton}
        {...props}
      />
    )
  }
  return (
    <DialogPrimitive.Close data-slot="dialog-close" {...props}>
      {children}
    </DialogPrimitive.Close>
  )
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      // Why: in dark mode the canvas is already near-black, so a flat 50% black
      // scrim disappears into the background. A deeper scrim + 2px backdrop
      // blur lifts the canvas behind the dialog without needing per-mode colors.
      className={cn(
        'fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  overlayClassName,
  showCloseButton = true,
  initialFocus,
  finalFocus,
  ...props
}: DialogPrimitive.Popup.Props &
  RadixContentCompatProps & {
    overlayClassName?: string
    showCloseButton?: boolean
  }): React.JSX.Element {
  const { radix, rest } = splitRadixContentCompatProps(props)
  useRegisterRadixDismissHandlers(radix)

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        // Why: translucent surface + solid border + dual shadow matches the
        // Sol floating-menu recipe and stays visible on the stone dark canvas.
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-black/14 bg-background/96 p-6 text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl duration-100 outline-none dark:border-white/14 dark:bg-[rgba(23,23,23,0.96)] dark:shadow-[0_24px_72px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:max-w-lg',
          className
        )}
        initialFocus={
          mapRadixOpenAutoFocus(
            radix.onOpenAutoFocus,
            initialFocus
          ) as DialogPrimitive.Popup.Props['initialFocus']
        }
        finalFocus={
          mapRadixCloseAutoFocus(
            radix.onCloseAutoFocus,
            finalFocus
          ) as DialogPrimitive.Popup.Props['finalFocus']
        }
        {...rest}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-open:bg-accent data-open:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">
              {translate('auto.components.ui.dialog.f26c4baeda', 'Close')}
            </span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean
}): React.JSX.Element {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    >
      {children}
      {showCloseButton ? (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          {translate('auto.components.ui.dialog.f26c4baeda', 'Close')}
        </DialogPrimitive.Close>
      ) : null}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-sm font-semibold leading-none', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger
}
