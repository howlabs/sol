import type { GlobalSettings } from '../../../../shared/types'
import {
  getAgentAwakeDescription,
  getAgentAwakeSearchKeywords,
  getAgentAwakeTitle
} from './agent-awake-copy'
import { SearchableSetting } from './SearchableSetting'
import { SettingsSwitchRow } from './SettingsFormControls'

type AgentAwakeSettingProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function AgentAwakeSetting({
  settings,
  updateSettings
}: AgentAwakeSettingProps): React.JSX.Element {
  const title = getAgentAwakeTitle()
  const description = getAgentAwakeDescription()

  return (
    <SearchableSetting
      title={title}
      description={description}
      keywords={getAgentAwakeSearchKeywords()}
    >
      <SettingsSwitchRow
        label={title}
        description={description}
        checked={settings.keepComputerAwakeWhileAgentsRun}
        ariaLabel={title}
        onChange={() =>
          updateSettings({
            keepComputerAwakeWhileAgentsRun: !settings.keepComputerAwakeWhileAgentsRun
          })
        }
      />
    </SearchableSetting>
  )
}
