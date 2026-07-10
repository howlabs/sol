import { useMemo } from 'react'
import { RefreshCw } from '@/lib/icons'
import type { GlobalSettings, TuiAgent } from '../../../../shared/types'
import { getAgentCatalog } from '@/lib/agent-catalog'
import { useDetectedAgents } from '@/hooks/useDetectedAgents'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { AgentAwakeSetting } from './AgentAwakeSetting'
import { AgentCacheTimerSection } from './AgentCacheTimerSection'
import { AgentRuntimeSetting } from './AgentRuntimeSetting'
import { AgentDefaultAgentPicker } from './AgentDefaultAgentPicker'
import { AgentCatalogRow } from './AgentCatalogRow'
import { buildCodexSessionSourceHomeControl } from './codex-session-source-home-control'
import { SettingsBadge, SettingsSubsectionHeader } from './SettingsFormControls'
import {
  isTuiAgentEnabled,
  normalizeDisabledTuiAgents
} from '../../../../shared/tui-agent-selection'
import {
  getTuiAgentDefaultArgs,
  getTuiAgentDefaultEnv,
  resolveTuiAgentLaunchArgs,
  resolveTuiAgentLaunchEnv
} from '../../../../shared/tui-agent-launch-defaults'
import {
  applyAgentPermissionMode,
  resolveAgentPermissionModeSummary,
  type AgentPermissionMode
} from '../../../../shared/tui-agent-permissions'
import { getSettingOwnershipSummary } from './setting-ownership'
import { translate } from '@/i18n/i18n'
import { IntegrationCardGroup } from './integration-card-presentation'
import { setAgentEnabledFromStore } from './agents-availability-update'
import { AgentPermissionsSetting } from './agents-permissions-setting'
import {
  AgentGeneratedTabTitlesSetting,
  AgentStatusHooksSetting
} from './agents-pane-session-switches'

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
  const agentOwnership = getSettingOwnershipSummary('agentLaunchDefaults')
  const cmdOverrides = settings.agentCmdOverrides ?? {}
  const agentDefaultArgs = settings.agentDefaultArgs ?? {}
  const agentDefaultEnv = settings.agentDefaultEnv ?? {}
  const agentPermissionMode = resolveAgentPermissionModeSummary({
    agentDefaultArgs,
    agentDefaultEnv
  })
  const disabledAgents = normalizeDisabledTuiAgents(settings.disabledTuiAgents)

  const setDefault = (id: TuiAgent | 'blank' | null): void => {
    updateSettings({ defaultTuiAgent: id })
  }

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

  const catalogRowProps = (agent: (typeof detectedAgents)[number], isDetected: boolean) => ({
    agentId: agent.id,
    label: agent.label,
    homepageUrl: agent.homepageUrl,
    defaultCmd: agent.cmd,
    defaultArgs: getTuiAgentDefaultArgs(agent.id),
    defaultEnv: getTuiAgentDefaultEnv(agent.id),
    isDetected,
    isEnabled: isTuiAgentEnabled(agent.id, disabledAgents),
    isDefault: defaultAgent === agent.id,
    cmdOverride: isDetected ? cmdOverrides[agent.id] : undefined,
    argsOverride: resolveTuiAgentLaunchArgs(agent.id, agentDefaultArgs),
    envOverride: resolveTuiAgentLaunchEnv(agent.id, agentDefaultEnv),
    onSetDefault: isDetected ? () => setDefault(agent.id) : () => {},
    onSetEnabled: (enabled: boolean) =>
      setAgentEnabledFromStore(settings, updateSettings, agent.id, enabled),
    onSaveOverride: isDetected
      ? (v: string) => {
          const next = { ...cmdOverrides }
          if (v) {
            next[agent.id] = v
          } else {
            delete next[agent.id]
          }
          updateSettings({ agentCmdOverrides: next })
        }
      : () => {},
    onSaveArgs: (v: string) =>
      updateSettings({ agentDefaultArgs: { ...agentDefaultArgs, [agent.id]: v } }),
    onSaveEnv: (v: Record<string, string>) =>
      updateSettings({ agentDefaultEnv: { ...agentDefaultEnv, [agent.id]: v } }),
    sessionSourceHome:
      isDetected && agent.id === 'codex'
        ? buildCodexSessionSourceHomeControl(settings, updateSettings)
        : undefined
  })

  return (
    <div className="space-y-1">
      <AgentDefaultAgentPicker
        ownershipDescription={agentOwnership.description}
        isAutoDefault={isAutoDefault}
        isBlankDefault={isBlankDefault}
        enabledDetectedAgents={enabledDetectedAgents}
        defaultAgent={defaultAgent}
        onSelect={setDefault}
      />

      <section className="space-y-1.5">
        <SettingsSubsectionHeader
          title={translate(
            'auto.components.settings.AgentsPane.sessionLaunchTitle',
            'Session & launch'
          )}
          description={translate(
            'auto.components.settings.AgentsPane.sessionLaunchDescription',
            'Runtime location, tab titles, power policy, and launch defaults.'
          )}
        />
        <IntegrationCardGroup>
          <div className="px-3 py-2">
            <AgentRuntimeSetting
              settings={settings}
              updateSettings={updateSettings}
              refresh={refresh}
              wslSupportedPlatform={wslSupportedPlatform}
              wslAvailable={wslAvailable}
              wslDistros={wslDistros}
              wslCapabilitiesLoading={wslCapabilitiesLoading}
            />
          </div>
          <div className="px-3 py-2">
            <AgentStatusHooksSetting settings={settings} updateSettings={updateSettings} />
          </div>
          <div className="px-3 py-2">
            <AgentGeneratedTabTitlesSetting settings={settings} updateSettings={updateSettings} />
          </div>
          <div className="px-3 py-2">
            <AgentAwakeSetting settings={settings} updateSettings={updateSettings} />
          </div>
        </IntegrationCardGroup>
      </section>

      <AgentCacheTimerSection settings={settings} updateSettings={updateSettings} />

      <AgentPermissionsSetting
        mode={agentPermissionMode}
        onChange={(mode: Exclude<AgentPermissionMode, 'mixed'>) =>
          updateSettings(
            applyAgentPermissionMode({
              mode,
              agentDefaultArgs,
              agentDefaultEnv
            })
          )
        }
      />

      {detectedAgents.length > 0 ? (
        <section className="space-y-1.5">
          <SettingsSubsectionHeader
            title={
              <span className="flex items-center gap-2">
                {translate('auto.components.settings.AgentsPane.02e0143be5', 'Installed')}
                <SettingsBadge tone="accent">
                  {detectedAgents.length}{' '}
                  {translate('auto.components.settings.AgentsPane.ed3e110e61', 'detected')}
                </SettingsBadge>
              </span>
            }
            action={
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => void refresh()}
                disabled={isRefreshing}
                title={translate(
                  'auto.components.settings.AgentsPane.13647f9f80',
                  'Re-read your shell PATH and re-detect installed agents'
                )}
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={cn('size-3', isRefreshing && 'animate-spin')} />
                {isRefreshing
                  ? translate('auto.components.settings.AgentsPane.c9b33eb5c0', 'Refreshing…')
                  : translate('auto.components.settings.AgentsPane.0d9e293a02', 'Refresh')}
              </Button>
            }
          />
          <IntegrationCardGroup>
            {detectedAgents.map((agent) => (
              <AgentCatalogRow key={agent.id} {...catalogRowProps(agent, true)} />
            ))}
          </IntegrationCardGroup>
        </section>
      ) : null}

      {undetectedAgents.length > 0 ? (
        <section className="space-y-1.5">
          <SettingsSubsectionHeader
            title={
              <span className="flex items-center gap-2 text-muted-foreground">
                {translate(
                  'auto.components.settings.AgentsPane.e8da2af684',
                  'Available to install'
                )}
                <SettingsBadge tone="muted">
                  {undetectedAgents.length}{' '}
                  {translate('auto.components.settings.AgentsPane.024bd95089', 'agents')}
                </SettingsBadge>
              </span>
            }
          />
          <IntegrationCardGroup>
            {undetectedAgents.map((agent) => (
              <AgentCatalogRow key={agent.id} {...catalogRowProps(agent, false)} />
            ))}
          </IntegrationCardGroup>
        </section>
      ) : null}

      {detectedIds === null ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/20 py-6 text-sm text-muted-foreground">
          {translate(
            'auto.components.settings.AgentsPane.d83834f5e6',
            'Detecting installed agents…'
          )}
        </div>
      ) : null}
    </div>
  )
}
