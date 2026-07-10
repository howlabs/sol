import type React from 'react'
import { useState } from 'react'
import { ChevronRight } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useAppStore } from '../../store'
import { normalizeSettingsSearchQuery } from './settings-search'
import { translate } from '@/i18n/i18n'

type AppearanceAdvancedDisclosureProps = {
  /** Optional override label; defaults to "Advanced". */
  label?: string
  showTopBorder?: boolean
  className?: string
  contentClassName?: string
  children: React.ReactNode
}

/** Inline "Advanced" disclosure for low-frequency controls. An active settings
 *  search force-opens it so matching controls stay reachable instead of being
 *  hidden behind a collapsed trigger. */
export function AppearanceAdvancedDisclosure({
  label,
  showTopBorder = true,
  className,
  contentClassName,
  children
}: AppearanceAdvancedDisclosureProps): React.JSX.Element {
  const searchQuery = useAppStore((state) => state.settingsSearchQuery)
  const isSearching = normalizeSettingsSearchQuery(searchQuery).length > 0
  const [open, setOpen] = useState(false)
  const expanded = open || isSearching

  return (
    <div className={cn('mt-1.5 pt-1', showTopBorder && 'border-t border-border/40', className)}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen((prev) => !prev)}
        // Why: while searching the disclosure is forced open, so disable the
        // toggle's collapse affordance rather than letting it fight the search.
        disabled={isSearching}
        className="flex h-7 w-full items-center gap-1.5 text-xs font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default"
      >
        <ChevronRight
          className={cn(
            'size-3.5 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none',
            expanded && 'rotate-90'
          )}
        />
        {label ??
          translate('auto.components.settings.AppearanceAdvancedDisclosure.advanced', 'Advanced')}
      </button>
      {expanded ? <div className={cn('pt-0.5', contentClassName)}>{children}</div> : null}
    </div>
  )
}
