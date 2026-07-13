import type React from 'react'
import type { GlobalSettings, LeftSidebarAppearanceMode } from '../../../../shared/types'
import { translate } from '@/i18n/i18n'
import { SettingsRow, SettingsSegmentedControl } from './SettingsFormControls'

type LeftSidebarAppearanceSettingProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function LeftSidebarAppearanceSetting({
  settings,
  updateSettings
}: LeftSidebarAppearanceSettingProps): React.JSX.Element {
  return (
    <SettingsRow
      alignTop
      label={translate(
        'auto.components.settings.AppearancePane.leftSidebarAppearance.title',
        'Left Sidebar Appearance'
      )}
      description={translate(
        'auto.components.settings.AppearancePane.leftSidebarAppearance.rowDescription',
        'Make the left sidebar match your terminal or stay default.'
      )}
      control={
        <SettingsSegmentedControl<LeftSidebarAppearanceMode>
          size="sm"
          value={settings.leftSidebarAppearanceMode ?? 'default'}
          onChange={(leftSidebarAppearanceMode) => updateSettings({ leftSidebarAppearanceMode })}
          ariaLabel={translate(
            'auto.components.settings.AppearancePane.leftSidebarAppearance.title',
            'Left Sidebar Appearance'
          )}
          options={[
            {
              value: 'default',
              label: translate(
                'auto.components.settings.AppearancePane.leftSidebarAppearance.default',
                'Default'
              )
            },
            {
              value: 'match-terminal',
              label: translate(
                'auto.components.settings.AppearancePane.leftSidebarAppearance.matchTerminal',
                'Match Terminal'
              )
            }
          ]}
        />
      }
    />
  )
}
