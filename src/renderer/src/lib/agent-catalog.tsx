import type React from 'react'
import { ClaudeIcon, DroidIcon, OpenAIIcon } from '@/components/status-bar/icons'
import type { TuiAgent } from '../../../shared/types'
import { getTuiAgentLaunchCommand, TUI_AGENT_CONFIG } from '../../../shared/tui-agent-config'
import { AgentLetterIcon, CopilotIcon, OpenCodeIcon, PiIcon } from './agent-icon-glyphs'
import { translate } from '@/i18n/i18n'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'

export type AgentCatalogEntry = {
  id: TuiAgent
  label: string
  /** Default CLI binary name used for PATH detection. */
  cmd: string
  /** Direct or bundled image URL for agents whose project identity is not represented by a favicon service. */
  iconUrl?: string
  /** Domain for Google's favicon service — used for agents without an SVG icon. */
  faviconDomain?: string
  /** Homepage/install docs URL, sourced from the README agent badge list. */
  homepageUrl: string
}

function getCatalogPlatform(): NodeJS.Platform {
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent
  if (userAgent.includes('Windows')) {
    return 'win32'
  }
  if (userAgent.includes('Mac')) {
    return 'darwin'
  }
  if (userAgent) {
    return 'linux'
  }
  return typeof process === 'undefined' ? 'linux' : process.platform
}

export const getAgentCatalog = createLocalizedCatalog((): AgentCatalogEntry[] => [
  {
    id: 'claude',
    label: translate('auto.lib.agent.catalog.0708ed89f1', 'Claude'),
    cmd: 'claude',
    homepageUrl: 'https://docs.anthropic.com/claude/docs/claude-code'
  },
  {
    id: 'claude-agent-teams',
    label: translate('auto.lib.agent.catalog.bf53f09bf8', 'Claude Agent Teams'),
    cmd: getTuiAgentLaunchCommand(TUI_AGENT_CONFIG['claude-agent-teams'], getCatalogPlatform()),
    homepageUrl: 'https://code.claude.com/docs/agent-teams'
  },
  {
    id: 'codex',
    label: translate('auto.lib.agent.catalog.760bc6883d', 'Codex'),
    cmd: 'codex',
    homepageUrl: 'https://github.com/openai/codex'
  },
  {
    id: 'grok',
    label: translate('auto.lib.agent.catalog.0baad2d5d2', 'Grok'),
    cmd: 'grok',
    faviconDomain: 'x.ai',
    homepageUrl: 'https://x.ai/cli'
  },
  {
    id: 'copilot',
    label: translate('auto.lib.agent.catalog.706b0fe68b', 'GitHub Copilot'),
    cmd: 'copilot',
    homepageUrl: 'https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli'
  },
  {
    id: 'opencode',
    label: translate('auto.lib.agent.catalog.e7a4ca5103', 'OpenCode'),
    cmd: 'opencode',
    homepageUrl: 'https://opencode.ai/docs/cli/'
  },
  {
    id: 'pi',
    label: translate('auto.lib.agent.catalog.302934c5d9', 'Pi'),
    cmd: 'pi',
    homepageUrl: 'https://pi.dev'
  },
  {
    id: 'antigravity',
    label: translate('auto.lib.agent.catalog.691dd11789', 'Antigravity'),
    cmd: 'agy',
    faviconDomain: 'antigravity.google',
    homepageUrl: 'https://antigravity.google/docs/cli-overview'
  },
  {
    id: 'amp',
    label: translate('auto.lib.agent.catalog.c73c573939', 'Amp'),
    cmd: 'amp',
    faviconDomain: 'ampcode.com',
    homepageUrl: 'https://ampcode.com/manual#install'
  },
  {
    id: 'droid',
    label: translate('auto.lib.agent.catalog.739a930554', 'Droid'),
    cmd: 'droid',
    homepageUrl: 'https://docs.factory.ai/cli/getting-started/quickstart'
  },
  {
    id: 'qwen-code',
    label: translate('auto.lib.agent.catalog.bee242fe3d', 'Qwen Code'),
    // Why: QwenLM/qwen-code installs its CLI executable as `qwen`; the package
    // name is not the binary users put on PATH. Keep `id` for stable identity.
    cmd: 'qwen',
    faviconDomain: 'qwenlm.github.io',
    homepageUrl: 'https://github.com/QwenLM/qwen-code'
  },
  {
    id: 'hermes',
    label: translate('auto.lib.agent.catalog.8a9ba743cc', 'Hermes'),
    cmd: 'hermes',
    faviconDomain: 'nousresearch.com',
    homepageUrl: 'https://hermes-agent.nousresearch.com/docs/'
  },
  {
    id: 'devin',
    label: translate('auto.lib.agent.catalog.fc80296033', 'Devin'),
    cmd: 'devin',
    faviconDomain: 'devin.ai',
    homepageUrl: 'https://devin.ai/cli'
  }
])

// Why: tests and a few legacy call sites still import a catalog snapshot.
export const AGENT_CATALOG: AgentCatalogEntry[] = getAgentCatalog()

export function getAgentLabel(agent: TuiAgent): string {
  return getAgentCatalog().find((entry) => entry.id === agent)?.label ?? agent
}

export function AgentIcon({
  agent,
  size = 14
}: {
  agent: TuiAgent | null | undefined
  size?: number
}): React.JSX.Element {
  // Why: render a neutral question-mark glyph when the agent identity is not
  // yet known. Before, the caller coerced null → 'claude', which caused Codex
  // panes to briefly show the Claude icon until the first hook callback
  // arrived.
  if (!agent) {
    return <AgentLetterIcon letter="?" size={size} />
  }
  if (agent === 'claude' || agent === 'claude-agent-teams') {
    return <ClaudeIcon size={size} />
  }
  if (agent === 'codex') {
    return <OpenAIIcon size={size} />
  }
  if (agent === 'droid') {
    return <DroidIcon size={size} />
  }
  if (agent === 'pi') {
    return <PiIcon size={size} />
  }
  if (agent === 'copilot') {
    return <CopilotIcon size={size} />
  }
  if (agent === 'opencode') {
    return <OpenCodeIcon size={size} />
  }
  const catalogEntry = getAgentCatalog().find((a) => a.id === agent)
  if (catalogEntry?.iconUrl) {
    return (
      <img
        src={catalogEntry.iconUrl}
        width={size}
        height={size}
        alt=""
        style={{ borderRadius: 2 }}
      />
    )
  }
  if (catalogEntry?.faviconDomain) {
    // Why: agents without a published SVG icon use their site favicon via
    // Google's favicon service — same source the README uses for the agent badge list.
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${catalogEntry.faviconDomain}&sz=64`}
        width={size}
        height={size}
        alt=""
        aria-hidden
        style={{ borderRadius: 2 }}
      />
    )
  }
  const label = catalogEntry?.label ?? agent
  return <AgentLetterIcon letter={label.charAt(0).toUpperCase()} size={size} />
}
