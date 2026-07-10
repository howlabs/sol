import { useState } from 'react'
import { ExternalLink, Minus, Plus } from '@/lib/icons'
import type { TuiAgent } from '../../../../shared/types'
import { AgentIcon } from '@/lib/agent-catalog'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { resolveAgentRowStatusLabelKey } from './agent-catalog-row-status'
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
 * Document-style agent row: hairline divider, no card chrome.
 * Enable is primary; launch overrides open behind + / −.
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
  const commandLine = formatCommandLine({
    defaultCmd,
    cmdOverride,
    argsOverride,
    envSummary
  })

  const metaLabel =
    statusKey === 'default'
      ? translate('auto.components.settings.AgentsPane.24e032fa34', 'Default')
      : statusKey === 'disabled'
        ? translate('auto.components.settings.AgentsPane.8dc0192e48', 'Disabled')
        : null

  const metaToneClass =
    statusKey === 'default'
      ? 'bg-status-success-background text-status-success'
      : statusKey === 'disabled'
        ? 'bg-muted text-muted-foreground'
        : ''

  const expandLabel = open
    ? translate('auto.components.settings.AgentsPane.cea7d97be1', 'Collapse command override')
    : translate('auto.components.settings.AgentsPane.dc4a2ffdc0', 'Expand command override')

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
          size="icon-sm"
          aria-label={expandLabel}
          className="size-7 text-muted-foreground hover:text-foreground"
        >
          {open ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
        </Button>
      </CollapsibleTrigger>
    </>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
    >
      <a href={homepageUrl} target="_blank" rel="noopener noreferrer">
        {translate('auto.components.settings.AgentsPane.f95b5c79b8', 'Install')}
        <ExternalLink className="size-3" />
      </a>
    </Button>
  )

  const overrideFields = (
    <div className="space-y-2.5 pb-1 pl-9">
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
    </div>
  )

  const row = (
    <div
      className={cn('border-b border-border/50 py-3 last:border-b-0', !isDetected && 'opacity-70')}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground [&_svg]:size-4">
          <AgentIcon agent={agentId} size={16} />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-[13px] font-medium leading-none text-foreground">{label}</p>
            {metaLabel ? (
              <span
                className={cn(
                  'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]',
                  metaToneClass
                )}
              >
                {metaLabel}
              </span>
            ) : null}
          </div>
          <p className="truncate font-mono text-[11px] leading-relaxed text-muted-foreground">
            {commandLine}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      </div>
      {isDetected ? (
        <CollapsibleContent className="collapsible-height-content pt-3">
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
