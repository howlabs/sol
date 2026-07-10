import { useMemo } from 'react'
import { LoaderCircle } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { GlobalSettings } from '../../../../shared/types'
import { getAgentCatalog } from '@/lib/agent-catalog'
import { useDetectedAgents } from '@/hooks/useDetectedAgents'
import { AgentDefaultAgentPicker } from './AgentDefaultAgentPicker'
import { AgentsCatalogSection } from './AgentsCatalogSection'
import { AgentsPaneMorePreferences } from './agents-pane-more-preferences'
import { buildAgentCatalogRowProps } from './agents-catalog-bindings'
import {
  isTuiAgentEnabled,
  normalizeDisabledTuiAgents
} from '../../../../shared/tui-agent-selection'
import {
  applyAgentPermissionMode,
  resolveAgentPermissionModeSummary,
  type AgentPermissionMode
} from '../../../../shared/tui-agent-permissions'
import { getSettingOwnershipSummary } from './setting-ownership'
import { translate } from '@/i18n/i18n'
import { AgentPermissionsSetting } from './agents-permissions-setting'

export { getAgentsPaneSearchEntries } from './agents-search'
export { AgentAvailabilityControl } from './agent-availability-control'
export {
  buildAgentAvailabilitySettingsUpdate,
  createAgentAvailabilityUpdateQueue
} from './agents-availability-update'
export { AgentPermissionsSetting } from './agents-permissions-setting'
export {
  AgentGeneratedTabTitlesSetting,
  AgentStatusHooksSetting
} from './agents-pane-session-switches'

type AgentsPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void | Promise<void>
  wslSupportedPlatform?: boolean
  wslAvailable?: boolean
  wslDistros?: string[]
  wslCapabilitiesLoading?: boolean
}

/**
 * Minimal document layout for Agents:
 * 1) Default agent  2) On this machine  3) Permissions  4) Session prefs (collapsed)
 */
export function AgentsPane({
  settings,
  updateSettings,
  wslSupportedPlatform,
  wslAvailable,
  wslDistros,
  wslCapabilitiesLoading
}: AgentsPaneProps): React.JSX.Element {
  const { detectedIds: detectedList, isRefreshing, refresh } = useDetectedAgents()
  const detectedIds = useMemo<Set<string> | null>(
    () => (detectedList ? new Set(detectedList) : null),
    [detectedList]
  )

  const defaultAgent = settings.defaultTuiAgent
  const cmdOverrides = settings.agentCmdOverrides ?? {}
  const agentDefaultArgs = settings.agentDefaultArgs ?? {}
  const agentDefaultEnv = settings.agentDefaultEnv ?? {}
  const disabledAgents = normalizeDisabledTuiAgents(settings.disabledTuiAgents)
  const agentPermissionMode = resolveAgentPermissionModeSummary({
    agentDefaultArgs,
    agentDefaultEnv
  })

  const detectedAgents =
    detectedIds === null ? [] : getAgentCatalog().filter((agent) => detectedIds.has(agent.id))
  const enabledDetectedAgents = detectedAgents.filter((agent) =>
    isTuiAgentEnabled(agent.id, disabledAgents)
  )
  const undetectedAgents = getAgentCatalog().filter(
    (a) => detectedIds !== null && !detectedIds.has(a.id)
  )

  const isAutoDefault =
    defaultAgent === null ||
    (defaultAgent !== 'blank' &&
      (!detectedIds?.has(defaultAgent) || !isTuiAgentEnabled(defaultAgent, disabledAgents)))
  const isBlankDefault = defaultAgent === 'blank'

  const catalogBindings = {
    settings,
    updateSettings,
    defaultAgent,
    disabledAgents,
    cmdOverrides,
    agentDefaultArgs,
    agentDefaultEnv
  }

  const rowProps = (agent: (typeof detectedAgents)[number], isDetected: boolean) =>
    buildAgentCatalogRowProps(agent, isDetected, catalogBindings)

  return (
    // Why: setup/skill-adjacent document (catalog + permissions), not form-list
    // space-y-1 — cap at space-y-6 per STYLEGUIDE settings templates.
    <div className="mx-auto max-w-3xl space-y-6">
      <AgentDefaultAgentPicker
        ownershipDescription={getSettingOwnershipSummary('agentLaunchDefaults').description}
        isAutoDefault={isAutoDefault}
        isBlankDefault={isBlankDefault}
        enabledDetectedAgents={enabledDetectedAgents}
        defaultAgent={defaultAgent}
        onSelect={(id) => updateSettings({ defaultTuiAgent: id })}
      />

      {detectedIds === null ? (
        <p
          className="flex items-center gap-2 text-[13px] text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle
            className={cn('size-3.5 shrink-0 animate-spin motion-reduce:animate-none')}
            aria-hidden
          />
          {translate(
            'auto.components.settings.AgentsPane.d83834f5e6',
            'Detecting installed agents…'
          )}
        </p>
      ) : (
        <AgentsCatalogSection
          installed={detectedAgents}
          available={undetectedAgents}
          isRefreshing={isRefreshing}
          onRefresh={() => void refresh()}
          buildRowProps={rowProps}
        />
      )}

      <AgentPermissionsSetting
        mode={agentPermissionMode}
        onChange={(mode: Exclude<AgentPermissionMode, 'mixed'>) =>
          updateSettings(applyAgentPermissionMode({ mode, agentDefaultArgs, agentDefaultEnv }))
        }
      />

      <AgentsPaneMorePreferences
        settings={settings}
        updateSettings={updateSettings}
        refresh={refresh}
        wslSupportedPlatform={wslSupportedPlatform}
        wslAvailable={wslAvailable}
        wslDistros={wslDistros}
        wslCapabilitiesLoading={wslCapabilitiesLoading}
      />
    </div>
  )
}
