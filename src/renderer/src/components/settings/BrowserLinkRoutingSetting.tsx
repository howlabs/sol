import type { GlobalSettings } from '../../../../shared/types'
import { SearchableSetting } from './SearchableSetting'
import { SettingsSwitchRow } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'

type BrowserLinkRoutingSettingProps = {
  settings: GlobalSettings
  linkRoutingDescription: string
  isMac: boolean
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function BrowserLinkRoutingSetting({
  settings,
  linkRoutingDescription,
  isMac,
  updateSettings
}: BrowserLinkRoutingSettingProps): React.JSX.Element {
  const title = translate('auto.components.settings.BrowserPane.d3eb69c0aa', 'Link Routing')

  return (
    <SearchableSetting
      title={title}
      description={linkRoutingDescription}
      keywords={[
        'browser',
        'preview',
        'links',
        'localhost',
        'webview',
        'markdown',
        isMac ? 'cmd' : 'ctrl',
        'file',
        'editor'
      ]}
    >
      <SettingsSwitchRow
        label={title}
        description={linkRoutingDescription}
        checked={settings.openLinksInApp}
        onChange={() =>
          updateSettings({
            openLinksInApp: !settings.openLinksInApp,
            openLinksInAppPreferencePrompted: true
          })
        }
      />
    </SearchableSetting>
  )
}
