import type { GlobalSettings } from '../../../../shared/types'
import { AgentAwakeSetting } from './AgentAwakeSetting'
import { AgentRuntimeSetting } from './AgentRuntimeSetting'
import {
  AgentGeneratedTabTitlesSetting,
  AgentStatusHooksSetting
} from './agents-pane-session-switches'

type AgentsPaneSessionSettingsProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void | Promise<void>
  refresh: () => Promise<unknown>
  wslSupportedPlatform?: boolean
  wslAvailable?: boolean
  wslDistros?: string[]
  wslCapabilitiesLoading?: boolean
}

/** Flat switch rows — no extra group chrome; labels carry the hierarchy. */
export function AgentsPaneSessionSettings({
  settings,
  updateSettings,
  refresh,
  wslSupportedPlatform,
  wslAvailable,
  wslDistros,
  wslCapabilitiesLoading
}: AgentsPaneSessionSettingsProps): React.JSX.Element {
  return (
    <div className="space-y-1">
      <AgentRuntimeSetting
        settings={settings}
        updateSettings={updateSettings}
        refresh={refresh}
        wslSupportedPlatform={wslSupportedPlatform}
        wslAvailable={wslAvailable}
        wslDistros={wslDistros}
        wslCapabilitiesLoading={wslCapabilitiesLoading}
      />
      <AgentStatusHooksSetting settings={settings} updateSettings={updateSettings} />
      <AgentGeneratedTabTitlesSetting settings={settings} updateSettings={updateSettings} />
      <AgentAwakeSetting settings={settings} updateSettings={updateSettings} />
    </div>
  )
}
