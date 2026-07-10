'use client'

import * as React from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'

import { nativeButtonForAsChild } from './radix-popup-compat'

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props): React.JSX.Element {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  asChild,
  children,
  nativeButton,
  ...props
}: CollapsiblePrimitive.Trigger.Props & { asChild?: boolean }): React.JSX.Element {
  // Why: Base UI uses `render` (not Radix asChild). Map asChild so call sites
  // keep working and avoid nested <button> hosts.
  const resolvedNativeButton = nativeButtonForAsChild(asChild, children, nativeButton)
  if (asChild && React.isValidElement(children)) {
    return (
      <CollapsiblePrimitive.Trigger
        data-slot="collapsible-trigger"
        render={children as React.ReactElement}
        nativeButton={resolvedNativeButton}
        {...props}
      />
    )
  }
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props}>
      {children}
    </CollapsiblePrimitive.Trigger>
  )
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props): React.JSX.Element {
  return <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
