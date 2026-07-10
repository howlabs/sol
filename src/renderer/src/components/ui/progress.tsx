'use client'

import type * as React from 'react'
import { Progress as ProgressPrimitive } from '@base-ui/react/progress'

import { cn } from '@/lib/utils'

/** Simple value bar — keeps the previous Radix Progress call shape (`value` only). */
function Progress({ className, value, ...props }: ProgressPrimitive.Root.Props): React.JSX.Element {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
      {...props}
    >
      <ProgressPrimitive.Track className="h-full w-full">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="h-full bg-primary transition-all duration-300 ease-out"
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
