import type { GlobalSettings, TuiAgent } from '../../../../shared/types'
import {
  getTuiAgentDefaultArgs,
  getTuiAgentDefaultEnv,
  resolveTuiAgentLaunchArgs,
  resolveTuiAgentLaunchEnv
} from '../../../../shared/tui-agent-launch-defaults'
import { isTuiAgentEnabled } from '../../../../shared/tui-agent-selection'
import { buildCodexSessionSourceHomeControl } from './codex-session-source-home-control'
import { setAgentEnabledFromStore } from './agents-availability-update'
import type { AgentCatalogRowProps } from './AgentCatalogRow'

type CatalogAgent = {
  id: TuiAgent
  label: string
  homepageUrl: string
  cmd: string
}

type AgentsCatalogBindings = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void | Promise<void>
  defaultAgent: GlobalSettings['defaultTuiAgent']
  disabledAgents: readonly TuiAgent[]
  cmdOverrides: Record<string, string | undefined>
  agentDefaultArgs: Record<string, string | undefined>
  agentDefaultEnv: Record<string, Record<string, string> | undefined>
  setDefault: (id: TuiAgent) => void
}

export function buildAgentCatalogRowProps(
  agent: CatalogAgent,
  isDetected: boolean,
  bindings: AgentsCatalogBindings
): AgentCatalogRowProps {
  const {
    settings,
    updateSettings,
    defaultAgent,
    disabledAgents,
    cmdOverrides,
    agentDefaultArgs,
    agentDefaultEnv,
    setDefault
  } = bindings

  return {
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
  }
}
