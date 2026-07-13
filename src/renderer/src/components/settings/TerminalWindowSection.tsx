import type { GlobalSettings } from '../../../../shared/types'
import { NumberField, SettingsSubsectionHeader } from './SettingsFormControls'
import { SearchableSetting } from './SearchableSetting'
import { clampNumber } from '@/lib/terminal-theme'
import { translate } from '@/i18n/i18n'

type TerminalWindowSectionProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function TerminalWindowSection({
  settings,
  updateSettings
}: TerminalWindowSectionProps): React.JSX.Element {
  return (
    <section className="space-y-1.5">
      <SettingsSubsectionHeader
        title={translate('auto.components.settings.TerminalWindowSection.b96ba13ed1', 'Window')}
        description={translate(
          'auto.components.settings.TerminalWindowSection.00eaa6b881',
          'Window appearance and background settings.'
        )}
      />

      <div className="ml-3 divide-y divide-border/40">
        <SearchableSetting
          title={translate(
            'auto.components.settings.TerminalWindowSection.ea7b1a158e',
            'Background Opacity'
          )}
          description={translate(
            'auto.components.settings.TerminalWindowSection.03acb60aa0',
            'Controls the transparency of the terminal background.'
          )}
          keywords={['opacity', 'transparency', 'background', 'alpha']}
        >
          <NumberField
            label={translate(
              'auto.components.settings.TerminalWindowSection.ea7b1a158e',
              'Background Opacity'
            )}
            description={translate(
              'auto.components.settings.TerminalWindowSection.809f37738d',
              'Controls the transparency of the terminal background. 1 is fully opaque, 0 is fully transparent.'
            )}
            value={settings.terminalBackgroundOpacity ?? 1}
            defaultValue={1}
            min={0}
            max={1}
            step={0.05}
            suffix="0 to 1"
            onChange={(value) =>
              updateSettings({ terminalBackgroundOpacity: clampNumber(value, 0, 1) })
            }
          />
        </SearchableSetting>
      </div>
    </section>
  )
}
