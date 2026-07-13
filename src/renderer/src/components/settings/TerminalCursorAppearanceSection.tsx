import type { GlobalSettings } from '../../../../shared/types'
import {
  SettingsRow,
  SettingsSegmentedControl,
  SettingsSubsectionHeader,
  SettingsSwitchRow
} from './SettingsFormControls'
import { SearchableSetting } from './SearchableSetting'
import { translate } from '@/i18n/i18n'

type TerminalCursorAppearanceSectionProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function TerminalCursorAppearanceSection({
  settings,
  updateSettings
}: TerminalCursorAppearanceSectionProps): React.JSX.Element {
  return (
    <section className="space-y-1.5">
      <SettingsSubsectionHeader
        title={translate(
          'auto.components.settings.TerminalAppearanceSection.abcb4dd019',
          'Terminal Cursor'
        )}
      />

      <div className="ml-3 divide-y divide-border/40">
        <SearchableSetting
          title={translate(
            'auto.components.settings.TerminalAppearanceSection.db270cc9a9',
            'Cursor Shape'
          )}
          description={translate(
            'auto.components.settings.TerminalAppearanceSection.d455f2ef4f',
            'Default cursor appearance for Orca terminal panes.'
          )}
          keywords={['terminal', 'cursor', 'bar', 'block', 'underline']}
        >
          {/* Why: Bar/Block/Underline options convey the meaning; helper text pruned. */}
          <SettingsRow
            label={translate(
              'auto.components.settings.TerminalAppearanceSection.db270cc9a9',
              'Cursor Shape'
            )}
            control={
              <SettingsSegmentedControl
                ariaLabel={translate(
                  'auto.components.settings.TerminalAppearanceSection.db270cc9a9',
                  'Cursor Shape'
                )}
                value={settings.terminalCursorStyle}
                onChange={(option) => updateSettings({ terminalCursorStyle: option })}
                options={[
                  {
                    value: 'bar',
                    label: translate(
                      'auto.components.settings.TerminalAppearanceSection.e070e8aeba',
                      'Bar'
                    )
                  },
                  {
                    value: 'block',
                    label: translate(
                      'auto.components.settings.TerminalAppearanceSection.52854a5608',
                      'Block'
                    )
                  },
                  {
                    value: 'underline',
                    label: translate(
                      'auto.components.settings.TerminalAppearanceSection.2e5aec3cf6',
                      'Underline'
                    )
                  }
                ]}
              />
            }
          />
        </SearchableSetting>

        <SearchableSetting
          title={translate(
            'auto.components.settings.TerminalAppearanceSection.74736cc9b1',
            'Blinking Cursor'
          )}
          description={translate(
            'auto.components.settings.TerminalAppearanceSection.2de6b5a699',
            'Uses the blinking variant of the selected cursor shape.'
          )}
          keywords={['terminal', 'cursor', 'blink']}
        >
          <SettingsSwitchRow
            label={translate(
              'auto.components.settings.TerminalAppearanceSection.74736cc9b1',
              'Blinking Cursor'
            )}
            checked={settings.terminalCursorBlink}
            onChange={() => updateSettings({ terminalCursorBlink: !settings.terminalCursorBlink })}
          />
        </SearchableSetting>
      </div>
    </section>
  )
}
