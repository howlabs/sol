import React from 'react'
import { Pencil, Pause, Play, Trash2 } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getAgentCatalog, AgentIcon } from '@/lib/agent-catalog'
import type { Automation, AutomationRun } from '../../../../shared/automations-types'
import { formatAutomationSchedule } from '../../../../shared/automation-schedules'
import { formatAutomationPrecheckTimeout } from '../../../../shared/automation-precheck'
import { formatAutomationDateTimeWithRelative, Metric } from './automation-page-parts'
import {
  formatAutomationCost,
  formatAutomationTokens,
  summarizeAutomationRunUsage
} from './automation-usage-model'
import type { AutomationTargetAvailability } from './automation-target-availability'
import { getAutomationSourceDisplay } from './automation-source-display'
import { translate } from '@/i18n/i18n'

type AutomationDetailProps = {
  automation: Automation | null
  runs: AutomationRun[]
  projectName: string
  workspaceName: string
  projectDefaultBaseRef: string | null
  hostLabelById?: ReadonlyMap<string, string>
  runNowAvailability: AutomationTargetAvailability | null
  now: number
  onRunNow: (automation: Automation) => void
  onEdit: (automation: Automation) => void
  onToggle: (automation: Automation) => void
  onDelete: (automation: Automation) => void
}

function formatGrace(minutes: number): string {
  if (minutes <= 0) {
    return 'No grace'
  }
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  const hours = minutes / 60
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
}

function ToolbarIconButton({
  label,
  children,
  onClick,
  className
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
  className?: string
}): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={onClick}
          className={className}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Detail pane — Mira settings density: quiet header, flat metric grid, no tiles.
 */
export function AutomationDetail({
  automation,
  runs,
  projectName,
  workspaceName,
  projectDefaultBaseRef,
  hostLabelById,
  runNowAvailability,
  now,
  onRunNow,
  onEdit,
  onToggle,
  onDelete
}: AutomationDetailProps): React.JSX.Element {
  if (!automation) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {translate(
            'auto.components.automations.AutomationDetail.221916d93c',
            'Create an automation to start scheduling agent work.'
          )}
        </p>
      </div>
    )
  }

  const usageSummary = summarizeAutomationRunUsage(runs)
  const usageCoverage =
    usageSummary.knownRuns > 0
      ? `${usageSummary.knownRuns}/${runs.length} runs`
      : usageSummary.unavailableRuns > 0
        ? 'Unavailable'
        : 'No runs'
  const agentLabel =
    getAgentCatalog().find((agent) => agent.id === automation.agentId)?.label ?? automation.agentId
  const runLocationLabel =
    automation.workspaceMode === 'new_per_run'
      ? (automation.baseBranch ?? projectDefaultBaseRef ?? 'Project default')
      : workspaceName
  const sourceDisplay = getAutomationSourceDisplay(automation.sourceContext, hostLabelById)
  const runNowDisabled = runNowAvailability?.canRunNow === false

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-4">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {automation.name}
            </h2>
            <Badge variant={automation.enabled ? 'secondary' : 'outline'}>
              {automation.enabled
                ? translate('auto.components.automations.AutomationDetail.eaa02014f8', 'Enabled')
                : translate('auto.components.automations.AutomationDetail.b09b2384fd', 'Paused')}
            </Badge>
          </div>
          <p className="truncate text-[12px] text-muted-foreground">
            {projectName} / {workspaceName}
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <AgentIcon agent={automation.agentId} size={14} />
            <span>{agentLabel}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 gap-1.5"
                  onClick={() => onRunNow(automation)}
                  disabled={runNowDisabled}
                >
                  <Play className="size-3.5" />
                  {translate('auto.components.automations.AutomationDetail.2fb1605beb', 'Run Now')}
                </Button>
              </span>
            </TooltipTrigger>
            {runNowDisabled ? (
              <TooltipContent side="bottom" sideOffset={6}>
                {runNowAvailability.message}
              </TooltipContent>
            ) : null}
          </Tooltip>
          <ToolbarIconButton
            label={translate(
              'auto.components.automations.AutomationDetail.4b1ea02d2e',
              'Edit automation'
            )}
            onClick={() => onEdit(automation)}
          >
            <Pencil className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={
              automation.enabled
                ? translate(
                    'auto.components.automations.AutomationDetail.91a4155e95',
                    'Pause automation'
                  )
                : translate(
                    'auto.components.automations.AutomationDetail.d79452fb30',
                    'Resume automation'
                  )
            }
            onClick={() => onToggle(automation)}
          >
            {automation.enabled ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </ToolbarIconButton>
          <ToolbarIconButton
            label={translate(
              'auto.components.automations.AutomationDetail.1f6026358e',
              'Delete automation'
            )}
            onClick={() => onDelete(automation)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </ToolbarIconButton>
        </div>
      </div>

      {automation.executionTargetType === 'ssh' ? (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {translate(
            'auto.components.automations.AutomationDetail.dbef8dc110',
            'This SSH automation runs only while Sol can reach the SSH host. If reconnect needs interactive credentials or the host is unavailable, the run is recorded as skipped.'
          )}
        </p>
      ) : null}

      {runNowAvailability?.canRunNow === false ? (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {runNowAvailability.message}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border/50 pt-4 sm:grid-cols-3">
        <Metric
          label={translate('auto.components.automations.AutomationDetail.18763ded26', 'Schedule')}
          value={formatAutomationSchedule(automation.rrule)}
        />
        <Metric
          label={translate('auto.components.automations.AutomationDetail.578ff46987', 'Next run')}
          value={
            automation.enabled
              ? formatAutomationDateTimeWithRelative(automation.nextRunAt, now)
              : 'Paused'
          }
        />
        <Metric
          label={
            automation.workspaceMode === 'new_per_run'
              ? translate('auto.components.automations.AutomationDetail.2f8baf5360', 'Create from')
              : translate('auto.components.automations.AutomationDetail.5405a09b1f', 'Run location')
          }
          value={runLocationLabel}
        />
        <Metric
          label={translate('auto.components.automations.AutomationDetail.a7c312430d', 'Last run')}
          value={formatAutomationDateTimeWithRelative(automation.lastRunAt, now)}
        />
        <Metric
          label={translate('auto.components.automations.AutomationDetail.15ea446b93', 'Session')}
          value={automation.reuseSession ? 'Reuse live session' : 'Fresh each run'}
        />
        <Metric
          label={translate('auto.components.automations.AutomationDetail.620b22145e', 'Grace')}
          value={formatGrace(automation.missedRunGraceMinutes)}
        />
        <Metric
          label={translate('auto.components.automations.AutomationDetail.e353ab9516', 'Precheck')}
          value={
            automation.precheck
              ? `Enabled, ${formatAutomationPrecheckTimeout(automation.precheck.timeoutSeconds)}`
              : 'None'
          }
        />
        {sourceDisplay ? (
          <Metric
            label={translate('auto.components.automations.AutomationDetail.29baf8f4c2', 'Source')}
            value={sourceDisplay.label}
          />
        ) : null}
        <Metric
          label={translate('auto.components.automations.AutomationDetail.401f40ae79', 'Est. spend')}
          value={formatAutomationCost(usageSummary.estimatedCostUsd)}
        />
        <Metric
          label={translate('auto.components.automations.AutomationDetail.449fc83bf7', 'Tokens')}
          value={formatAutomationTokens(usageSummary.totalTokens)}
        />
        <Metric
          label={translate(
            'auto.components.automations.AutomationDetail.a1d52c2189',
            'Usage coverage'
          )}
          value={usageCoverage}
        />
      </div>

      <div className="space-y-1.5 border-t border-border/50 pt-4">
        <div className="text-[11px] text-muted-foreground">
          {translate('auto.components.automations.AutomationDetail.007c8ad874', 'Prompt')}
        </div>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
          {automation.prompt}
        </p>
      </div>
    </div>
  )
}
