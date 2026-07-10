import { SettingsSwitch } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'

export function BrowserUseEnableSwitch({
  enabled,
  onToggle
}: {
  enabled: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <SettingsSwitch
      checked={enabled}
      onChange={onToggle}
      ariaLabel={translate(
        'auto.components.settings.BrowserUseEnableSwitch.aea3f45349',
        'Enable Agent Browser Use'
      )}
    />
  )
}
