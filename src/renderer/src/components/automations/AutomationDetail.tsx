import React from 'react'
import { CalendarClock, Pencil, Pause, Play, Trash2 } from '@/lib/icons'
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
          variant="outline"
          size="icon"
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
      <div className="flex h-full flex-col items-center justify-center gap-3 px-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/40 text-muted-foreground">
          <CalendarClock className="size-7" />
        </div>
        <p className="text-lg font-semibold tracking-tight text-foreground">
          {translate(
            'auto.components.automations.AutomationDetail.emptyTitle',
            'No automation selected'
          )}
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      {/* Hero identity — large type, actions as a clear toolbar */}
      <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {automation.name}
            </h2>
            <Badge
              variant={automation.enabled ? 'default' : 'outline'}
              className="h-6 rounded-md px-2 text-[11px] font-semibold uppercase tracking-wide"
            >
              {automation.enabled
                ? translate('auto.components.automations.AutomationDetail.eaa02014f8', 'Enabled')
                : translate('auto.components.automations.AutomationDetail.b09b2384fd', 'Paused')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground/80">{projectName}</span>
            <span className="mx-1.5 text-border">/</span>
            <span>{workspaceName}</span>
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AgentIcon agent={automation.agentId} size={18} />
            <span className="font-medium text-foreground">{agentLabel}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="default"
                  className="h-10 gap-2 px-5 text-sm"
                  onClick={() => onRunNow(automation)}
                  disabled={runNowDisabled}
                >
                  <Play className="size-4" />
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
            <Pencil className="size-4" />
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
            {automation.enabled ? <Pause className="size-4" /> : <Play className="size-4" />}
          </ToolbarIconButton>
          <ToolbarIconButton
            label={translate(
              'auto.components.automations.AutomationDetail.1f6026358e',
              'Delete automation'
            )}
            onClick={() => onDelete(automation)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </ToolbarIconButton>
        </div>
      </div>

      {automation.executionTargetType === 'ssh' ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
          {translate(
            'auto.components.automations.AutomationDetail.dbef8dc110',
            'This SSH automation runs only while Orca can reach the SSH host. If reconnect needs interactive credentials or the host is unavailable, the run is recorded as skipped.'
          )}
        </div>
      ) : null}

      {runNowAvailability?.canRunNow === false ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
          {runNowAvailability.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="rounded-xl border border-border bg-muted/25 p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {translate('auto.components.automations.AutomationDetail.007c8ad874', 'Prompt')}
        </h3>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
          {automation.prompt}
        </p>
      </section>
    </div>
  )
}
