import type { GlobalSettings } from '../../../../shared/types'
import { translate } from '@/i18n/i18n'
import { EphemeralVmsPane } from './EphemeralVmsPane'
import { getExperimentalSearchEntry } from './experimental-search'
import { SearchableSetting } from './SearchableSetting'
import { SettingsSwitchRow } from './SettingsFormControls'

type EphemeralVmsExperimentalSettingProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function EphemeralVmsExperimentalSetting({
  settings,
  updateSettings
}: EphemeralVmsExperimentalSettingProps): React.JSX.Element {
  const entry = getExperimentalSearchEntry().ephemeralVms
  const enabled = settings.experimentalEphemeralVms === true

  return (
    <SearchableSetting
      title={entry.title}
      description={entry.description}
      keywords={entry.keywords}
      className="max-w-none space-y-1.5"
      id="ephemeral-vms"
    >
      <SettingsSwitchRow
        label={translate(
          'auto.components.settings.ephemeralVms.search.title',
          'Per-Workspace Environments'
        )}
        description={translate(
          'auto.components.settings.ephemeralVmsExperimentalSetting.description',
          'Shows setup controls and workspace run targets for repo-owned, on-demand environments.'
        )}
        checked={enabled}
        ariaLabel={translate(
          'auto.components.settings.ephemeralVmsExperimentalSetting.toggleLabel',
          'Toggle per-workspace environments'
        )}
        onChange={() => updateSettings({ experimentalEphemeralVms: !enabled })}
      />
      {enabled ? <EphemeralVmsPane /> : null}
    </SearchableSetting>
  )
}
