import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { translate } from '@/i18n/i18n'
import {
  AgentSessionSourceHomeInput,
  type AgentSessionSourceHomeControl
} from './codex-session-source-home-control'
import {
  AgentCommandOverrideInput,
  AgentDefaultArgsInput,
  AgentDefaultEnvInput
} from './agent-catalog-override-inputs'

export type AgentCatalogOverridesAccordionProps = {
  agentId: string
  defaultCmd: string
  defaultArgs: string
  defaultEnv: Record<string, string>
  defaultEnvSummary: string
  cmdOverride: string | undefined
  argsOverride: string
  envOverride: Record<string, string>
  envSummary: string
  onSaveOverride: (value: string) => void
  onSaveArgs: (value: string) => void
  onSaveEnv: (value: Record<string, string>) => void
  sessionSourceHome?: AgentSessionSourceHomeControl
  defaultOpenSections: readonly string[]
}

export function AgentCatalogOverridesAccordion(
  props: AgentCatalogOverridesAccordionProps
): React.JSX.Element {
  const {
    agentId,
    defaultCmd,
    defaultArgs,
    defaultEnv,
    defaultEnvSummary,
    cmdOverride,
    argsOverride,
    envOverride,
    envSummary,
    onSaveOverride,
    onSaveArgs,
    onSaveEnv,
    sessionSourceHome,
    defaultOpenSections
  } = props

  const showEnv = Boolean(defaultEnvSummary || envSummary)

  return (
    <Accordion type="multiple" defaultValue={[...defaultOpenSections]} className="w-full border-0">
      <AccordionItem value="command" className="border-border/50">
        <AccordionTrigger className="py-1.5 text-xs font-medium text-foreground hover:no-underline">
          {translate('auto.components.settings.AgentsPane.2e45ca29b6', 'Command')}
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <AgentCommandOverrideInput
            key={cmdOverride ?? defaultCmd}
            defaultCmd={defaultCmd}
            cmdOverride={cmdOverride}
            onSaveOverride={onSaveOverride}
            hideLabel
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="args" className="border-border/50">
        <AccordionTrigger className="py-1.5 text-xs font-medium text-foreground hover:no-underline">
          {translate('auto.components.settings.AgentsPane.cfb3f35775', 'Arguments')}
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <AgentDefaultArgsInput
            key={`${agentId}:${argsOverride}`}
            defaultArgs={defaultArgs}
            argsOverride={argsOverride}
            onSaveArgs={onSaveArgs}
            hideLabel
          />
        </AccordionContent>
      </AccordionItem>

      {showEnv ? (
        <AccordionItem value="env" className="border-border/50">
          <AccordionTrigger className="py-1.5 text-xs font-medium text-foreground hover:no-underline">
            {translate('auto.components.settings.AgentsPane.8fbe1f37c1', 'Environment')}
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <AgentDefaultEnvInput
              key={`${agentId}:${envSummary}`}
              defaultEnv={defaultEnv}
              envOverride={envOverride}
              onSaveEnv={onSaveEnv}
              hideLabel
            />
          </AccordionContent>
        </AccordionItem>
      ) : null}

      {sessionSourceHome ? (
        <AccordionItem value="session-home" className="border-border/50">
          <AccordionTrigger className="py-1.5 text-xs font-medium text-foreground hover:no-underline">
            {sessionSourceHome.runtimeLabel}
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <AgentSessionSourceHomeInput
              key={`${agentId}:${sessionSourceHome.runtimeLabel}:${sessionSourceHome.value}`}
              runtimeLabel={sessionSourceHome.runtimeLabel}
              value={sessionSourceHome.value}
              onSave={sessionSourceHome.onSave}
            />
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  )
}

export function resolveAgentOverridesAccordionDefaultOpen(props: {
  cmdOverride: string | undefined
  argsOverride: string
  defaultArgs: string
  envSummary: string
  defaultEnvSummary: string
  hasSessionHome: boolean
}): string[] {
  const open: string[] = []
  if (props.cmdOverride) {
    open.push('command')
  }
  if (props.argsOverride !== props.defaultArgs) {
    open.push('args')
  }
  if (props.envSummary !== props.defaultEnvSummary) {
    open.push('env')
  }
  if (props.hasSessionHome) {
    open.push('session-home')
  }
  if (open.length === 0) {
    open.push('command')
  }
  return open
}
