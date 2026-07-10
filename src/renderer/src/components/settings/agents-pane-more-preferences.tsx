import { useState } from 'react'
import { Minus, Plus } from '@/lib/icons'
import type { GlobalSettings } from '../../../../shared/types'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { translate } from '@/i18n/i18n'
import { AgentCacheTimerSection } from './AgentCacheTimerSection'
import { AgentsPaneSessionSettings } from './AgentsPaneSessionSettings'

type AgentsPaneMorePreferencesProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  refresh: () => Promise<unknown>
  wslSupportedPlatform?: boolean
  wslAvailable?: boolean
  wslDistros?: string[]
  wslCapabilitiesLoading?: boolean
}

/**
 * Session/runtime switches live here so the main Agents surface stays
 * focused on default agent + enable/install.
 */
export function AgentsPaneMorePreferences({
  settings,
  updateSettings,
  refresh,
  wslSupportedPlatform,
  wslAvailable,
  wslDistros,
  wslCapabilitiesLoading
}: AgentsPaneMorePreferencesProps): React.JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border/50 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-medium tracking-tight text-foreground">
            {translate(
              'auto.components.settings.AgentsPane.morePreferences',
              'Session preferences'
            )}
          </h3>
          <p className="max-w-prose text-[12px] leading-relaxed text-muted-foreground">
            {translate(
              'auto.components.settings.AgentsPane.morePreferencesDescription',
              'Runtime, hooks, tab titles, keep-alive, and cache timer.'
            )}
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={
              open
                ? translate(
                    'auto.components.settings.AgentsPane.hidePreferences',
                    'Hide session preferences'
                  )
                : translate(
                    'auto.components.settings.AgentsPane.showPreferences',
                    'Show session preferences'
                  )
            }
            className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {open ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="collapsible-height-content">
        <div className="space-y-1 pt-4">
          <AgentsPaneSessionSettings
            settings={settings}
            updateSettings={updateSettings}
            refresh={refresh}
            wslSupportedPlatform={wslSupportedPlatform}
            wslAvailable={wslAvailable}
            wslDistros={wslDistros}
            wslCapabilitiesLoading={wslCapabilitiesLoading}
          />
          <AgentCacheTimerSection settings={settings} updateSettings={updateSettings} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
