import { useState } from 'react'
import { ChevronDown, ExternalLink } from '@/lib/icons'
import type { TuiAgent } from '../../../../shared/types'
import { AgentIcon } from '@/lib/agent-catalog'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { IntegrationCardDetails, IntegrationCardShell } from './integration-card-shell'
import {
  resolveAgentRowStatusLabelKey,
  resolveAgentRowStatusTone
} from './agent-catalog-row-status'
import {
  AgentSessionSourceHomeInput,
  type AgentSessionSourceHomeControl
} from './codex-session-source-home-control'
import { stringifyAgentDefaultEnvDraft } from './agent-default-env-draft'
import { SettingsSwitch } from './SettingsFormControls'
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
  onSetEnabled: (enabled: boolean) => void
  onSaveOverride: (value: string) => void
  onSaveArgs: (value: string) => void
  onSaveEnv: (value: Record<string, string>) => void
  sessionSourceHome?: AgentSessionSourceHomeControl
}

function translateAgentStatusLabel(key: ReturnType<typeof resolveAgentRowStatusLabelKey>): string {
  switch (key) {
    case 'install':
      return translate('auto.components.settings.AgentsPane.f95b5c79b8', 'Install')
    case 'default':
      return translate('auto.components.settings.AgentsPane.24e032fa34', 'Default')
    case 'disabled':
      return translate('auto.components.settings.AgentsPane.8dc0192e48', 'Disabled')
    case 'onPath':
      return translate('auto.components.settings.AgentsPane.onPath', 'On PATH')
  }
}

function hasAgentLaunchOverrides(props: {
  cmdOverride: string | undefined
  argsOverride: string
  defaultArgs: string
  envOverride: Record<string, string>
  defaultEnv: Record<string, string>
}): boolean {
  const envSummary = stringifyAgentDefaultEnvDraft(props.envOverride)
  const defaultEnvSummary = stringifyAgentDefaultEnvDraft(props.defaultEnv)
  return (
    Boolean(props.cmdOverride) ||
    props.argsOverride !== props.defaultArgs ||
    envSummary !== defaultEnvSummary
  )
}

function AgentCommandPreviewLine(props: {
  defaultCmd: string
  cmdOverride: string | undefined
  argsOverride: string
  envSummary: string
}): React.JSX.Element {
  const { defaultCmd, cmdOverride, argsOverride, envSummary } = props
  return (
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
}

/**
 * Flat Integrations-style agent row: status + switch + docs; launch overrides
 * open in one Collapsible panel (no nested accordion / hover chrome).
 */
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
    onSetEnabled,
    onSaveOverride,
    onSaveArgs,
    onSaveEnv,
    sessionSourceHome
  } = props

  const envSummary = stringifyAgentDefaultEnvDraft(envOverride)
  const defaultEnvSummary = stringifyAgentDefaultEnvDraft(defaultEnv)
  const [open, setOpen] = useState(() =>
    hasAgentLaunchOverrides({
      cmdOverride,
      argsOverride,
      defaultArgs,
      envOverride,
      defaultEnv
    })
  )
  const statusTone = resolveAgentRowStatusTone({ isDetected, isEnabled, isDefault })
  const statusLabel = translateAgentStatusLabel(
    resolveAgentRowStatusLabelKey({ isDetected, isEnabled, isDefault })
  )

  const docsLabel = isDetected
    ? translate('auto.components.settings.AgentsPane.fe4d630c94', 'Docs')
    : translate('auto.components.settings.AgentsPane.f95b5c79b8', 'Install')

  const expandLabel = open
    ? translate('auto.components.settings.AgentsPane.cea7d97be1', 'Collapse command override')
    : translate('auto.components.settings.AgentsPane.dc4a2ffdc0', 'Expand command override')

  const actions = (
    <>
      <SettingsSwitch
        checked={isEnabled}
        onChange={() => onSetEnabled(!isEnabled)}
        ariaLabel={translate(
          'auto.components.settings.AgentsPane.1c9a9679ec',
          '{{value0}} availability',
          { value0: label }
        )}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        asChild
        className="text-muted-foreground hover:text-foreground"
      >
        <a
          href={homepageUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={docsLabel}
          aria-label={docsLabel}
        >
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
      {isDetected ? (
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={expandLabel}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none',
                open && 'rotate-180'
              )}
            />
          </Button>
        </CollapsibleTrigger>
      ) : null}
    </>
  )

  const body = (
    <>
      <AgentCommandPreviewLine
        defaultCmd={defaultCmd}
        cmdOverride={cmdOverride}
        argsOverride={argsOverride}
        envSummary={envSummary}
      />
      {isDetected ? (
        <CollapsibleContent className="collapsible-height-content">
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
        </CollapsibleContent>
      ) : null}
    </>
  )

  const shell = (
    <IntegrationCardShell
      className={cn(!isDetected && 'opacity-80')}
      icon={<AgentIcon agent={agentId} size={16} />}
      name={label}
      statusLabel={statusLabel}
      statusTone={statusTone}
      actions={actions}
    >
      {body}
    </IntegrationCardShell>
  )

  if (!isDetected) {
    return shell
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {shell}
    </Collapsible>
  )
}
