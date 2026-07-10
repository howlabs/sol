import type { GlobalSettings } from '../../../../shared/types'
import {
  getAgentGeneratedTabTitlesDescription,
  getAgentGeneratedTabTitlesTitle
} from './agent-generated-tab-title-copy'
import { getAgentStatusHooksDescription, getAgentStatusHooksTitle } from './agent-status-hooks-copy'
import { SettingsSwitchRow } from './SettingsFormControls'

type AgentsPaneSessionSwitchesProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void | Promise<void>
}

export function AgentStatusHooksSetting({
  settings,
  updateSettings
}: AgentsPaneSessionSwitchesProps): React.JSX.Element {
  const enabled = settings.agentStatusHooksEnabled !== false
  return (
    <SettingsSwitchRow
      label={getAgentStatusHooksTitle()}
      description={getAgentStatusHooksDescription()}
      checked={enabled}
      onChange={() =>
        updateSettings({
          agentStatusHooksEnabled: !enabled
        })
      }
      ariaLabel={getAgentStatusHooksTitle()}
    />
  )
}

export function AgentGeneratedTabTitlesSetting({
  settings,
  updateSettings
}: AgentsPaneSessionSwitchesProps): React.JSX.Element {
  const enabled = settings.tabAutoGenerateTitle === true
  return (
    <SettingsSwitchRow
      label={getAgentGeneratedTabTitlesTitle()}
      description={getAgentGeneratedTabTitlesDescription()}
      checked={enabled}
      onChange={() =>
        updateSettings({
          tabAutoGenerateTitle: !enabled
        })
      }
      ariaLabel={getAgentGeneratedTabTitlesTitle()}
    />
  )
}
