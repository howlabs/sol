import { useState } from 'react'
import { ChevronDown, ExternalLink } from '@/lib/icons'
import type { TuiAgent } from '../../../../shared/types'
import { AgentIcon } from '@/lib/agent-catalog'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { IntegrationCardDetails } from './integration-card-shell'
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

const STATUS_TONE_CLASSES = {
  connected: 'border-status-success-border bg-status-success-background text-status-success',
  attention: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  neutral: 'border-border bg-background text-muted-foreground'
} as const

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

function formatCommandLine(props: {
  defaultCmd: string
  cmdOverride: string | undefined
  argsOverride: string
  envSummary: string
}): string {
  const cmd = props.cmdOverride?.trim() ? props.cmdOverride.trim() : props.defaultCmd
  return [cmd, props.argsOverride.trim(), props.envSummary.trim()].filter(Boolean).join(' ')
}

/**
 * Two-line list row (name + command) matching Integrations action density:
 * outline Install / ghost Configure — not icon-only chrome.
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

  const statusKey = resolveAgentRowStatusLabelKey({ isDetected, isEnabled, isDefault })
  // Why: "On PATH" is the common case — badge only for Default / Disabled / Install.
  const showStatusBadge = statusKey !== 'onPath'
  const statusTone = resolveAgentRowStatusTone({ isDetected, isEnabled, isDefault })
  const statusLabel = translateAgentStatusLabel(statusKey)
  const commandLine = formatCommandLine({
    defaultCmd,
    cmdOverride,
    argsOverride,
    envSummary
  })

  const configureLabel = open
    ? translate('auto.components.settings.AgentsPane.doneConfiguring', 'Done')
    : translate('auto.components.settings.AgentsPane.configureLaunch', 'Configure')

  const actions = isDetected ? (
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
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-muted-foreground hover:text-foreground"
        >
          {configureLabel}
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none',
              open && 'rotate-180'
            )}
          />
        </Button>
      </CollapsibleTrigger>
    </>
  ) : (
    <Button variant="outline" size="sm" asChild className="h-7 gap-1.5">
      <a href={homepageUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="size-3.5" />
        {translate('auto.components.settings.AgentsPane.f95b5c79b8', 'Install')}
      </a>
    </Button>
  )

  const identity = (
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/30 text-muted-foreground [&_svg]:size-4">
        <AgentIcon agent={agentId} size={16} />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-xs font-medium leading-none text-foreground">{label}</p>
          {showStatusBadge ? (
            <span
              className={cn(
                'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none',
                STATUS_TONE_CLASSES[statusTone]
              )}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>
        <p className="truncate font-mono text-[11px] leading-snug text-muted-foreground">
          {commandLine}
        </p>
      </div>
    </div>
  )

  const overrideFields = (
    <IntegrationCardDetails className="space-y-2">
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
  )

  const row = (
    <div className={cn('bg-transparent px-3 py-2.5', !isDetected && 'opacity-80')}>
      <div className="flex items-center gap-2.5">
        {identity}
        <div className="flex shrink-0 items-center justify-end gap-1.5">{actions}</div>
      </div>
      {isDetected ? (
        <CollapsibleContent className="collapsible-height-content">
          {overrideFields}
        </CollapsibleContent>
      ) : null}
    </div>
  )

  if (!isDetected) {
    return row
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {row}
    </Collapsible>
  )
}
