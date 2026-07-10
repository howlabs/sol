import { Terminal } from '@/lib/icons'
import type { GlobalSettings, TuiAgent } from '../../../../shared/types'
import { AgentIcon } from '@/lib/agent-catalog'
import { translate } from '@/i18n/i18n'
import { SettingsSubsectionHeader } from './SettingsFormControls'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { resolveDefaultAgentToggleValue } from './agents-default-agent-toggle'

export type AgentDefaultAgentPickerProps = {
  ownershipDescription: string
  isAutoDefault: boolean
  isBlankDefault: boolean
  enabledDetectedAgents: readonly { id: TuiAgent; label: string }[]
  defaultAgent: GlobalSettings['defaultTuiAgent']
  onSelect: (id: TuiAgent | 'blank' | null) => void
}

export function AgentDefaultAgentPicker({
  ownershipDescription,
  isAutoDefault,
  isBlankDefault,
  enabledDetectedAgents,
  defaultAgent,
  onSelect
}: AgentDefaultAgentPickerProps): React.JSX.Element {
  const toggleValue = resolveDefaultAgentToggleValue(defaultAgent, isAutoDefault, isBlankDefault)

  return (
    <section className="space-y-1.5">
      <SettingsSubsectionHeader
        title={translate('auto.components.settings.AgentsPane.385212c7a1', 'Default Agent')}
        description={ownershipDescription}
      />
      <ToggleGroup
        type="single"
        variant="outline"
        size="default"
        className="flex h-auto w-full flex-wrap justify-start gap-1.5 motion-reduce:transition-none"
        value={toggleValue}
        onValueChange={(next) => {
          if (!next || next === toggleValue) {
            return
          }
          if (next === 'auto') {
            onSelect(null)
            return
          }
          if (next === 'blank') {
            onSelect('blank')
            return
          }
          onSelect(next as TuiAgent)
        }}
        aria-label={translate('auto.components.settings.AgentsPane.385212c7a1', 'Default Agent')}
      >
        <ToggleGroupItem value="auto">
          {translate('auto.components.settings.AgentsPane.92033495ff', 'Auto')}
        </ToggleGroupItem>
        <ToggleGroupItem value="blank" className="gap-1.5">
          <Terminal className="size-3.5" />
          {translate('auto.components.settings.AgentsPane.110b74b022', 'No agent (blank terminal)')}
        </ToggleGroupItem>
        {enabledDetectedAgents.map((agent) => (
          <ToggleGroupItem key={agent.id} value={agent.id} className="gap-1.5">
            <AgentIcon agent={agent.id} size={14} />
            {agent.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  )
}
