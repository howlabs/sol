'use client'

import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'

import { cn } from '@/lib/utils'
import { toggleVariants } from '@/components/ui/toggle'

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
  }
>({
  size: 'default',
  variant: 'default',
  spacing: 0
})

type ToggleGroupType = 'single' | 'multiple'

type ToggleGroupProps = Omit<
  ToggleGroupPrimitive.Props,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple'
> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    /** Radix-compatible: single selection (default) or multi. Maps to Base UI `multiple`. */
    type?: ToggleGroupType
    value?: string | readonly string[]
    defaultValue?: string | readonly string[]
    /**
     * Radix-compatible callback.
     * - `type="single"`: string (selected value) or '' when cleared
     * - `type="multiple"`: string[] of selected values
     */
    onValueChange?: (value: string | string[]) => void
  }

function toBaseUiValue(
  value: string | readonly string[] | undefined
): readonly string[] | undefined {
  if (value === undefined) {
    return undefined
  }
  if (Array.isArray(value)) {
    return value
  }
  return value ? [value as string] : []
}

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  type = 'single',
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: ToggleGroupProps): React.JSX.Element {
  const contextValue = React.useMemo(() => ({ variant, size, spacing }), [variant, size, spacing])
  const multiple = type === 'multiple'

  // Why: Base UI ToggleGroup is always array-valued. Radix used type=single +
  // string value (e.g. sidebar Group by). Bridge so selection + pressed styles work.
  const handleValueChange = React.useCallback(
    (groupValue: string[]) => {
      if (!onValueChange) {
        return
      }
      if (multiple) {
        onValueChange(groupValue)
        return
      }
      onValueChange(groupValue[0] ?? '')
    },
    [multiple, onValueChange]
  )

  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-type={type}
      multiple={multiple}
      value={toBaseUiValue(value)}
      defaultValue={toBaseUiValue(defaultValue)}
      onValueChange={handleValueChange}
      style={{ '--gap': spacing } as React.CSSProperties}
      className={cn(
        'group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs',
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={contextValue}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>): React.JSX.Element {
  const context = React.useContext(ToggleGroupContext)

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size
        }),
        'w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10',
        'data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l',
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
