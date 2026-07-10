import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Accessible visually-hidden wrapper. Replaces Radix `VisuallyHidden` so app
 * call sites keep `VisuallyHidden.Root` without depending on `radix-ui`.
 */
function VisuallyHiddenRoot({
  asChild = false,
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & { asChild?: boolean }): React.JSX.Element {
  const classes = cn('sr-only', className)

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      ...props,
      className: cn(classes, children.props.className)
    })
  }

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

export const VisuallyHidden = {
  Root: VisuallyHiddenRoot
}
