import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink } from '@/lib/icons'
import type { TuiAgent } from '../../../../shared/types'
import { AgentIcon } from '@/lib/agent-catalog'
import { Button } from '../ui/button'
import { ButtonGroup } from '../ui/button-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Separator } from '../ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import {
  IntegrationCardDetails,
  IntegrationCardShell,
  type IntegrationCardStatusTone
} from './integration-card-shell'
import type { AgentSessionSourceHomeControl } from './codex-session-source-home-control'
import { stringifyAgentDefaultEnvDraft } from './agent-default-env-draft'
import { SettingsSwitch } from './SettingsFormControls'
import { AgentCatalogCommandPreview } from './agent-catalog-command-preview'
import {
  AgentCatalogOverridesAccordion,
  resolveAgentOverridesAccordionDefaultOpen
} from './agent-catalog-overrides-accordion'
import { SettingsTooltipIconButton } from './settings-tooltip-icon-button'

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

  const accordionDefaultOpen = useMemo(
    () =>
      resolveAgentOverridesAccordionDefaultOpen({
        cmdOverride,
        argsOverride,
        defaultArgs,
        envSummary,
        defaultEnvSummary,
        hasSessionHome: Boolean(sessionSourceHome)
      }),
    [argsOverride, cmdOverride, defaultArgs, defaultEnvSummary, envSummary, sessionSourceHome]
  )

  const docsLabel = isDetected
    ? translate('auto.components.settings.AgentsPane.fe4d630c94', 'Docs')
    : translate('auto.components.settings.AgentsPane.f95b5c79b8', 'Install')

  const expandLabel = cmdOpen
    ? translate('auto.components.settings.AgentsPane.cea7d97be1', 'Collapse command override')
    : translate('auto.components.settings.AgentsPane.dc4a2ffdc0', 'Expand command override')

  const rowActions = (
    <div className="flex shrink-0 items-center gap-1.5">
      <SettingsSwitch
        checked={isEnabled}
        onChange={() => onSetEnabled(!isEnabled)}
        ariaLabel={translate(
          'auto.components.settings.AgentsPane.1c9a9679ec',
          '{{value0}} availability',
          { value0: label }
        )}
      />
      {isDetected ? <Separator orientation="vertical" className="h-5" /> : null}
      <ButtonGroup className="shrink-0">
        <SettingsTooltipIconButton tooltip={docsLabel} ariaLabel={docsLabel} href={homepageUrl}>
          <ExternalLink className="size-3.5" />
        </SettingsTooltipIconButton>
        {isDetected ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={expandLabel}
                  className="size-7 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none',
                      cmdOpen && 'rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              {expandLabel}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </ButtonGroup>
    </div>
  )

  const preview = (
    <AgentCatalogCommandPreview
      defaultCmd={defaultCmd}
      cmdOverride={cmdOverride}
      argsOverride={argsOverride}
      envSummary={envSummary}
      enableHoverCard={isDetected}
    />
  )

  const overridePanel = (
    <IntegrationCardDetails className="space-y-2">
      <AgentCatalogOverridesAccordion
        agentId={agentId}
        defaultCmd={defaultCmd}
        defaultArgs={defaultArgs}
        defaultEnv={defaultEnv}
        defaultEnvSummary={defaultEnvSummary}
        cmdOverride={cmdOverride}
        argsOverride={argsOverride}
        envOverride={envOverride}
        envSummary={envSummary}
        onSaveOverride={onSaveOverride}
        onSaveArgs={onSaveArgs}
        onSaveEnv={onSaveEnv}
        sessionSourceHome={sessionSourceHome}
        defaultOpenSections={accordionDefaultOpen}
      />
      <p className="text-[11px] leading-snug text-muted-foreground">
        {translate(
          'auto.components.settings.AgentsPane.f9f127d664',
          'Override the binary path or name, and edit the default launch arguments or environment for this agent.'
        )}
      </p>
    </IntegrationCardDetails>
  )

  const shellBody = (
    <>
      {isDetected ? (
        <CollapsibleTrigger
          nativeButton={false}
          className={cn(
            'mt-1 w-full rounded-sm text-left outline-none',
            'cursor-pointer hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/50'
          )}
        >
          {preview}
        </CollapsibleTrigger>
      ) : (
        preview
      )}
      {isDetected ? (
        <CollapsibleContent className="collapsible-height-content">
          {overridePanel}
        </CollapsibleContent>
      ) : null}
    </>
  )

  const shell = (
    <IntegrationCardShell
      className={cn(!isDetected && 'opacity-80')}
      icon={<AgentIcon agent={agentId} size={16} />}
      name={label}
      statusLabel={status.label}
      statusTone={status.tone}
      actions={rowActions}
    >
      {shellBody}
    </IntegrationCardShell>
  )

  if (!isDetected) {
    return shell
  }

  return (
    <Collapsible open={cmdOpen} onOpenChange={setCmdOpen}>
      {shell}
    </Collapsible>
  )
}
