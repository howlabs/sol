import { SettingsSwitchRow } from '@/components/settings/SettingsFormControls'
import { translate } from '@/i18n/i18n'

type TerminalQuickCommandAppendEnterSwitchProps = {
  appendEnter: boolean
  onToggle: () => void
}

export function TerminalQuickCommandAppendEnterSwitch({
  appendEnter,
  onToggle
}: TerminalQuickCommandAppendEnterSwitchProps): React.JSX.Element {
  const label = translate(
    'auto.components.terminal.quick.commands.TerminalQuickCommandAppendEnterSwitch.5fa607d807',
    'Append Enter'
  )

  return (
    <SettingsSwitchRow
      label={label}
      ariaLabel={translate(
        'auto.components.terminal.quick.commands.TerminalQuickCommandAppendEnterSwitch.e4e5fed3b3',
        'Toggle append Enter'
      )}
      description={translate(
        'auto.components.terminal.quick.commands.TerminalQuickCommandAppendEnterSwitch.c936c2d6d2',
        'Submit immediately instead of only inserting text.'
      )}
      checked={appendEnter}
      onChange={onToggle}
    />
  )
}
