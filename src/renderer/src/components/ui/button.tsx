import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** Mira density on Base UI (Phase D). */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background text-foreground hover:bg-input/50 hover:text-foreground dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
        ghost: 'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-7 gap-1 px-2 has-[>svg]:px-1.5',
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1 px-2.5 has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-4",
        icon: 'size-7',
        'icon-xs': "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        'icon-sm': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-lg': "size-8 [&_svg:not([class*='size-'])]:size-4"
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Radix-era prop: merge styles onto the single child element. */
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', asChild = false, children, ...props },
  ref
) {
  const classes = cn(buttonVariants({ variant, size, className }))

  // Why: Base UI uses `render` instead of Radix `asChild`; keep asChild so
  // existing call sites (<Button asChild><a/></Button>) keep working.
  if (asChild && React.isValidElement(children)) {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={classes}
        render={children as React.ReactElement}
        {...props}
      />
    )
  }

  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
})

export { Button, buttonVariants }
export type { ButtonProps }
