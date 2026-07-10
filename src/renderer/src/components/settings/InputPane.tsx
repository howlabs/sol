import type { GlobalSettings } from '../../../../shared/types'
import { SearchableSetting } from './SearchableSetting'
import { SettingsSwitchRow } from './SettingsFormControls'
import { isDefaultPrimarySelectionMiddleClickPasteUserAgent } from '@/hooks/usePrimarySelectionPaste'
import { translate } from '@/i18n/i18n'
export { getInputPaneSearchEntries } from './input-search'

type InputPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function InputPane({ settings, updateSettings }: InputPaneProps): React.JSX.Element {
  const enabled =
    settings.primarySelectionMiddleClickPaste ??
    isDefaultPrimarySelectionMiddleClickPasteUserAgent()
  const title = translate(
    'auto.components.settings.InputPane.ad31c3c5fb',
    'Middle-click Paste from Selection'
  )
  const description = translate(
    'auto.components.settings.InputPane.db15068196',
    'Enabled by default on Linux and macOS. Linux uses the system selection clipboard; other platforms use a private buffer.'
  )

  return (
    <section className="space-y-1">
      <SearchableSetting
        title={title}
        description={description}
        keywords={[
          'input',
          'editing',
          'selection',
          'primary selection',
          'middle click',
          'middle mouse',
          'paste',
          'clipboard',
          'x11',
          'linux',
          'macos'
        ]}
      >
        <SettingsSwitchRow
          label={title}
          description={description}
          checked={enabled}
          ariaLabel={title}
          onChange={() =>
            updateSettings({
              primarySelectionMiddleClickPaste: !enabled
            })
          }
        />
      </SearchableSetting>
    </section>
  )
}
