import type { GlobalSettings } from '../../../../shared/types'
import { translate } from '@/i18n/i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SearchableSetting } from './SearchableSetting'
import { SettingsRow, SettingsSwitchRow } from './SettingsFormControls'
import { getExperimentalSearchEntry } from './experimental-search'

type NativeChatDefaultView = 'terminal-chat' | 'native-chat'

type NativeChatExperimentalSettingProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function NativeChatExperimentalSetting({
  settings,
  updateSettings
}: NativeChatExperimentalSettingProps): React.JSX.Element {
  const nativeChatEnabled = settings.experimentalNativeChat === true
  const openByDefault = settings.openAgentTabsInChatByDefault === true
  const defaultView: NativeChatDefaultView = openByDefault ? 'native-chat' : 'terminal-chat'
  const defaultViewItems = [
    {
      value: 'terminal-chat' as const,
      label: translate(
        'auto.components.settings.ExperimentalPane.nativeChat.defaultViewTerminal',
        'Terminal chat'
      )
    },
    {
      value: 'native-chat' as const,
      label: translate(
        'auto.components.settings.ExperimentalPane.nativeChat.defaultViewNative',
        'Native chat'
      )
    }
  ]

  return (
    <SearchableSetting
      title={translate('auto.components.settings.ExperimentalPane.nativeChat.title', 'Native chat')}
      description={translate(
        'auto.components.settings.ExperimentalPane.nativeChat.description',
        'Preview the desktop chat surface for Claude and Codex terminal sessions.'
      )}
      keywords={getExperimentalSearchEntry().nativeChat.keywords}
      className="space-y-1.5"
      id="experimental-native-chat"
    >
      <SettingsSwitchRow
        label={translate(
          'auto.components.settings.ExperimentalPane.nativeChat.title',
          'Native chat'
        )}
        description={translate(
          'auto.components.settings.ExperimentalPane.nativeChat.copy',
          'Adds a native chat view you can switch to from supported Claude and Codex terminal panes. Experimental while we tune transcript fidelity, streaming, and terminal parity.'
        )}
        checked={nativeChatEnabled}
        ariaLabel={translate(
          'auto.components.settings.ExperimentalPane.nativeChat.toggleLabel',
          'Toggle native chat'
        )}
        onChange={() =>
          updateSettings({
            experimentalNativeChat: !nativeChatEnabled
          })
        }
      />
      {nativeChatEnabled ? (
        <SettingsRow
          label={translate(
            'auto.components.settings.ExperimentalPane.nativeChat.defaultTitle',
            'Default view'
          )}
          description={translate(
            'auto.components.settings.ExperimentalPane.nativeChat.defaultCopy',
            'Choose how new Claude and Codex terminal tabs open.'
          )}
          control={
            <Select
              value={defaultView}
              items={defaultViewItems}
              onValueChange={(value) => {
                if (value !== 'terminal-chat' && value !== 'native-chat') {
                  return
                }
                updateSettings({
                  openAgentTabsInChatByDefault: value === 'native-chat'
                })
              }}
            >
              <SelectTrigger
                aria-label={translate(
                  'auto.components.settings.ExperimentalPane.nativeChat.defaultViewLabel',
                  'Default native chat view'
                )}
                className="w-36"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" sideOffset={4}>
                {defaultViewItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      ) : null}
    </SearchableSetting>
  )
}
