import { useState } from 'react'
import { Check, ChevronDown, ExternalLink } from '@/lib/icons'
import type { TuiAgent } from '../../../../shared/types'
import { AgentIcon } from '@/lib/agent-catalog'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import {
  IntegrationCardDetails,
  IntegrationCardShell,
  type IntegrationCardStatusTone
} from './integration-card-shell'
import {
  AgentSessionSourceHomeInput,
  type AgentSessionSourceHomeControl
} from './codex-session-source-home-control'
import { stringifyAgentDefaultEnvDraft } from './agent-default-env-draft'
import { AgentAvailabilityControl } from './agent-availability-control'
import {
  AgentCommandOverrideInput,
  AgentDefaultArgsInput,
  AgentDefaultEnvInput
} from './agent-catalog-override-inputs'

export type AgentCatalogRowProps = {
  agentId: TuiAgent
  label: string
  homepageUrl: string
  defaultCmd: string
  defaultArgs: string
  defaultEnv: Record<string, string>
  isDetected: boolean
  isEnabled: boolean
  isDefault: boolean
  cmdOverride: string | undefined
  argsOverride: string
  envOverride: Record<string, string>
  onSetDefault: () => void
  onSetEnabled: (enabled: boolean) => void
  onSaveOverride: (value: string) => void
  onSaveArgs: (value: string) => void
  onSaveEnv: (value: Record<string, string>) => void
  sessionSourceHome?: AgentSessionSourceHomeControl
}

function resolveAgentRowStatus(props: {
  isDetected: boolean
  isEnabled: boolean
  isDefault: boolean
}): { label: string; tone: IntegrationCardStatusTone } {
  if (!props.isDetected) {
    return {
      label: translate('auto.components.settings.AgentsPane.f95b5c79b8', 'Install'),
      tone: 'attention'
    }
  }
  if (props.isDefault) {
    return {
      label: translate('auto.components.settings.AgentsPane.24e032fa34', 'Default'),
      tone: 'connected'
    }
  }
  if (!props.isEnabled) {
    return {
      label: translate('auto.components.settings.AgentsPane.8dc0192e48', 'Disabled'),
      tone: 'neutral'
    }
  }
  return {
    label: translate('auto.components.settings.AgentsPane.onPath', 'On PATH'),
    tone: 'neutral'
  }
}

export function AgentCatalogRow(props: AgentCatalogRowProps): React.JSX.Element {
  const {
    agentId,
    label,
    homepageUrl,
    defaultCmd,
    defaultArgs,
    defaultEnv,
    isDetected,
    isEnabled,
    isDefault,
    cmdOverride,
    argsOverride,
    envOverride,
    onSetDefault,
    onSetEnabled,
    onSaveOverride,
    onSaveArgs,
    onSaveEnv,
    sessionSourceHome
  } = props

  const envSummary = stringifyAgentDefaultEnvDraft(envOverride)
  const defaultEnvSummary = stringifyAgentDefaultEnvDraft(defaultEnv)
  const [cmdOpen, setCmdOpen] = useState(
    Boolean(cmdOverride) || argsOverride !== defaultArgs || envSummary !== defaultEnvSummary
  )
  const status = resolveAgentRowStatus({ isDetected, isEnabled, isDefault })

  const commandPreview = (
    <p className="truncate font-mono text-[11px] text-muted-foreground">
      {cmdOverride ? (
        <span>
          <span className="text-muted-foreground/60 line-through">{defaultCmd}</span>
          <span className="ml-1.5 text-foreground/80">{cmdOverride}</span>
        </span>
      ) : (
        defaultCmd
      )}
      {argsOverride ? <span className="ml-1.5 text-foreground/70">{argsOverride}</span> : null}
      {envSummary ? <span className="ml-1.5 text-foreground/60">{envSummary}</span> : null}
    </p>
  )

  return (
    <IntegrationCardShell
      className={cn(!isDetected && 'opacity-80')}
      icon={<AgentIcon agent={agentId} size={16} />}
      name={label}
      statusLabel={status.label}
      statusTone={status.tone}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <AgentAvailabilityControl
            label={label}
            isEnabled={isEnabled}
            onSetEnabled={onSetEnabled}
          />
          {isDetected && isEnabled ? (
            <Button
              type="button"
              variant={isDefault ? 'secondary' : 'ghost'}
              size="xs"
              onClick={onSetDefault}
              title={
                isDefault
                  ? translate('auto.components.settings.AgentsPane.d7625cf8b2', 'Default agent')
                  : translate('auto.components.settings.AgentsPane.5f986a9b92', 'Set as default')
              }
              className="h-7 gap-1 text-xs"
            >
              {isDefault ? <Check className="size-3" /> : null}
              {isDefault
                ? translate('auto.components.settings.AgentsPane.24e032fa34', 'Default')
                : translate('auto.components.settings.AgentsPane.959b67385b', 'Set default')}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <a
              href={homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={
                isDetected
                  ? translate('auto.components.settings.AgentsPane.fe4d630c94', 'Docs')
                  : translate('auto.components.settings.AgentsPane.f95b5c79b8', 'Install')
              }
            >
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          {isDetected ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setCmdOpen((prev) => !prev)}
              aria-label={
                cmdOpen
                  ? translate(
                      'auto.components.settings.AgentsPane.cea7d97be1',
                      'Collapse command override'
                    )
                  : translate(
                      'auto.components.settings.AgentsPane.dc4a2ffdc0',
                      'Expand command override'
                    )
              }
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={cn('size-3.5 transition-transform', cmdOpen && 'rotate-180')}
              />
            </Button>
          ) : null}
        </div>
      }
    >
      {commandPreview}
      {isDetected && cmdOpen ? (
        <IntegrationCardDetails>
          <AgentCommandOverrideInput
            key={cmdOverride ?? defaultCmd}
            defaultCmd={defaultCmd}
            cmdOverride={cmdOverride}
            onSaveOverride={onSaveOverride}
          />
          <AgentDefaultArgsInput
            key={`${agentId}:${argsOverride}`}
            defaultArgs={defaultArgs}
            argsOverride={argsOverride}
            onSaveArgs={onSaveArgs}
          />
          {defaultEnvSummary || envSummary ? (
            <AgentDefaultEnvInput
              key={`${agentId}:${envSummary}`}
              defaultEnv={defaultEnv}
              envOverride={envOverride}
              onSaveEnv={onSaveEnv}
            />
          ) : null}
          {sessionSourceHome ? (
            <AgentSessionSourceHomeInput
              key={`${agentId}:${sessionSourceHome.runtimeLabel}:${sessionSourceHome.value}`}
              runtimeLabel={sessionSourceHome.runtimeLabel}
              value={sessionSourceHome.value}
              onSave={sessionSourceHome.onSave}
            />
          ) : null}
          <p className="text-[11px] leading-snug text-muted-foreground">
            {translate(
              'auto.components.settings.AgentsPane.f9f127d664',
              'Override the binary path or name, and edit the default launch arguments or environment for this agent.'
            )}
          </p>
        </IntegrationCardDetails>
      ) : null}
    </IntegrationCardShell>
  )
}
