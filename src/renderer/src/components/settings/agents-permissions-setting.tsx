import { translate } from '@/i18n/i18n'
import { SettingsSegmentedControl, SettingsSubsectionHeader } from './SettingsFormControls'
import type { AgentPermissionMode } from '../../../../shared/tui-agent-permissions'

type AgentPermissionsSettingProps = {
  mode: AgentPermissionMode
  onChange: (mode: Exclude<AgentPermissionMode, 'mixed'>) => void
}

/** Single-row permission choice — secondary to default agent, not a wall of copy. */
export function AgentPermissionsSetting({
  mode,
  onChange
}: AgentPermissionsSettingProps): React.JSX.Element {
  const visibleMode: Exclude<AgentPermissionMode, 'mixed'> = mode === 'manual' ? 'manual' : 'yolo'
  return (
    <section className="flex items-start justify-between gap-4 border-t border-border/50 pt-6">
      <SettingsSubsectionHeader
        className="min-w-0 flex-1"
        title={translate('auto.components.settings.AgentsPane.agentPermissions', 'Permissions')}
        description={translate(
          'auto.components.settings.AgentsPane.agentPermissionsDescriptionShort',
          'Yolo reduces prompts. Manual keeps checks. Per-agent launch args still win.'
        )}
      />
      <SettingsSegmentedControl<AgentPermissionMode>
        value={visibleMode}
        onChange={(nextMode) => {
          if (nextMode !== 'mixed') {
            onChange(nextMode)
          }
        }}
        ariaLabel={translate('auto.components.settings.AgentsPane.agentPermissions', 'Permissions')}
        size="sm"
        options={[
          {
            value: 'yolo',
            label: translate('auto.components.settings.AgentsPane.agentPermissionsYolo', 'Yolo')
          },
          {
            value: 'manual',
            label: translate('auto.components.settings.AgentsPane.agentPermissionsManual', 'Manual')
          }
        ]}
      />
    </section>
  )
}
