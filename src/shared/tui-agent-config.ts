import type { TuiAgent } from './types'
import { getOrcaCliCommandNameForPlatform } from './orca-cli-command-name'

export type AgentPromptInjectionMode =
  | 'argv'
  | 'flag-prompt'
  | 'flag-prompt-interactive'
  | 'flag-interactive'
  | 'stdin-after-start'

export type DraftPasteReadySignal =
  | 'render-quiet-after-bracketed-paste'
  | 'codex-composer-prompt'
  | 'render-cursor-after-bracketed-paste'

export type TuiAgentDetectionRuntime = NodeJS.Platform | 'wsl'

export type TuiAgentConfig = {
  detectCmd: string
  /** Additional executable names that identify the same agent on PATH. */
  detectCmdAliases?: readonly string[]
  /** Other commands that must also be present before this agent counts as installed. */
  detectRequiredCommands?: readonly string[]
  /** Detection runtimes where this launch mode is not available as a detected agent. */
  detectUnsupportedRuntimes?: readonly TuiAgentDetectionRuntime[]
  launchCmd: string
  /** Platform-specific launch command when the public binary name differs. */
  launchCmdByPlatform?: Partial<Record<NodeJS.Platform, string>>
  expectedProcess: string
  promptInjectionMode: AgentPromptInjectionMode
  /** Option terminator required before positional prompts that may look like CLI syntax. */
  argvPromptSeparator?: '--'
  /** Why: flag that launches the TUI with the given text already in the
   * input box but NOT submitted, so the user still gets a reviewable draft.
   * Only set when the CLI documents native support — e.g. Claude's
   * `--prefill <text>`. The draft-launch flow prefers this over the
   * post-launch bracketed-paste path because it eliminates the empirical
   * agent-readiness wait entirely: the TUI mounts with the input pre-filled.
   * Agents without native support fall through to the paste-after-ready
   * code path in agent-paste-draft.ts. */
  draftPromptFlag?: string
  /** Why: agents that don't expose a `--prefill <text>`-style CLI flag but
   * CAN read an env var on startup to seed their input box without
   * submitting. Today only pi uses this (via Orca's overlay-installed
   * `orca-prefill` extension reading `ORCA_PI_PREFILL`). Equivalent in
   * effect to `draftPromptFlag`: avoids the bracketed-paste-after-ready
   * race when the agent's startup output is long (pi prints banner,
   * skills, and extensions for several seconds, which keeps the
   * readiness quiet-timer resetting). When set, the draft-launch plan
   * passes the text via this env var instead of pasting after ready. */
  draftPromptEnvVar?: string
  /** Why: agents that gate first-launch behind a "Do you trust this
   * folder?" menu (Cursor-Agent, GitHub Copilot CLI, Codex) consume the
   * bracketed paste as menu input. Pre-write the same trust artifact the
   * agent writes after the user accepts so the menu never fires. The actual
   * file/path written lives in src/main/agent-trust-presets.ts; this flag
   * just routes the workspace path through the matching preset before the
   * agent spawns. */
  preflightTrust?: 'copilot' | 'codex'
  /** Why: most TUIs need both bracketed-paste enablement and a quiet render
   * window before pasted bytes reliably land in the composer. Codex can use
   * a stronger signal from its own renderer: chat_composer.rs writes the
   * `›` prompt only when the composer row exists, so Orca can paste as soon
   * as that prompt appears after bracketed paste is enabled. */
  draftPasteReadySignal?: DraftPasteReadySignal
}

export const TUI_AGENT_CONFIG: Record<TuiAgent, TuiAgentConfig> = {
  claude: {
    detectCmd: 'claude',
    launchCmd: 'claude',
    expectedProcess: 'claude',
    promptInjectionMode: 'argv',
    // Why: `claude --prefill <text>` lands the TUI with `<text>` in the
    // input box, nothing submitted. Strictly better than the paste-after-
    // ready fallback because it eliminates the readiness race entirely.
    // See PR https://github.com/stablyai/orca/pull/926 for context.
    draftPromptFlag: '--prefill'
  },
  'claude-agent-teams': {
    // Why: this is an Orca-provided launch mode, not a separate upstream
    // binary. Detection follows the Orca CLI and requires Claude below.
    detectCmd: 'orca',
    detectCmdAliases: ['orca-dev', 'orca-ide'],
    // Why: the Orca shim alone exists on fresh installs. Require Claude too so
    // onboarding does not report Agent Teams when no agent CLI is installed.
    detectRequiredCommands: ['claude'],
    // Why: native Windows and WSL use Claude's in-process Agent Teams fallback,
    // not the Orca native-pane/tmux-shim wrapper exposed by this agent entry.
    detectUnsupportedRuntimes: ['win32', 'wsl'],
    launchCmd: 'orca claude-teams',
    launchCmdByPlatform: {
      linux: `${getOrcaCliCommandNameForPlatform('linux')} claude-teams`,
      win32: `${getOrcaCliCommandNameForPlatform('win32')} claude-teams`
    },
    expectedProcess: 'claude',
    promptInjectionMode: 'stdin-after-start'
  },
  codex: {
    detectCmd: 'codex',
    launchCmd: 'codex',
    expectedProcess: 'codex',
    promptInjectionMode: 'argv',
    preflightTrust: 'codex',
    draftPasteReadySignal: 'codex-composer-prompt'
  },
  opencode: {
    detectCmd: 'opencode',
    launchCmd: 'opencode',
    expectedProcess: 'opencode',
    promptInjectionMode: 'flag-prompt',
    // Why: opencode enables bracketed paste before its composer mounts; wait
    // for post-\x1b[?2004h show-cursor (\x1b[?25h) so paste hits mounted input.
    draftPasteReadySignal: 'render-cursor-after-bracketed-paste'
  },
  pi: {
    detectCmd: 'pi',
    launchCmd: 'pi',
    expectedProcess: 'pi',
    promptInjectionMode: 'argv',
    // Why: pi has no `--prefill` flag, and bracketed-paste-after-ready
    // races against its multi-second startup output (banner + skills +
    // extensions list) so the paste frequently never lands. Orca's
    // overlay installs an `orca-prefill` pi extension (see
    // src/main/pi/titlebar-extension-service.ts) that reads this env var
    // on session_start and calls `pi.ui.setEditorText(text)`. Same
    // user-visible behavior as `claude --prefill <text>`.
    draftPromptEnvVar: 'ORCA_PI_PREFILL'
  },
  antigravity: {
    detectCmd: 'agy',
    launchCmd: 'agy',
    expectedProcess: 'agy',
    promptInjectionMode: 'flag-prompt-interactive'
  },
  amp: {
    detectCmd: 'amp',
    launchCmd: 'amp',
    expectedProcess: 'amp',
    promptInjectionMode: 'stdin-after-start'
  },
  cline: {
    detectCmd: 'cline',
    launchCmd: 'cline',
    expectedProcess: 'cline',
    promptInjectionMode: 'stdin-after-start'
  },
  droid: {
    detectCmd: 'droid',
    launchCmd: 'droid',
    expectedProcess: 'droid',
    promptInjectionMode: 'argv'
  },
  'qwen-code': {
    // Why: the upstream package is QwenLM/qwen-code, but its installed CLI
    // executable on PATH is `qwen`, so detect/launch/recognition must use that.
    detectCmd: 'qwen',
    launchCmd: 'qwen',
    expectedProcess: 'qwen',
    promptInjectionMode: 'stdin-after-start'
  },
  hermes: {
    detectCmd: 'hermes',
    // Why: bare `hermes` opens the classic REPL in recent Hermes releases;
    // `--tui` starts the full-screen agent UI Orca is designed to host.
    launchCmd: 'hermes --tui',
    expectedProcess: 'hermes',
    promptInjectionMode: 'stdin-after-start'
  },
  copilot: {
    detectCmd: 'copilot',
    launchCmd: 'copilot',
    expectedProcess: 'copilot',
    // Why: `copilot --prompt <text>` runs non-interactively and exits on
    // completion, which would kill the TUI session Orca is hosting.
    // `-i/--interactive <prompt>` starts an interactive session with the
    // initial prompt pre-executed — the behavior Orca needs.
    promptInjectionMode: 'flag-interactive',
    // Why: Copilot's first-launch trust menu used to swallow our bracketed
    // paste. Pre-appending the workspace path to `trustedFolders` in
    // ~/.copilot/config.json (the same array Copilot's own
    // `addTrustedFolder` writes after the user accepts) makes the menu skip
    // entirely. See agent-trust-presets.ts for the file layout.
    preflightTrust: 'copilot'
  },
  grok: {
    detectCmd: 'grok',
    launchCmd: 'grok',
    expectedProcess: 'grok',
    // Why: Grok CLI accepts an initial prompt as a positional argv
    // (`grok "fix the bug"`). Prefer argv over stdin-after-start so multi-line
    // / special-character prompts are not typed as raw PTY keystrokes, and so
    // clipboard-derived launch text is not mangled by line-edit shortcuts.
    promptInjectionMode: 'argv',
    // Why: prompts such as `help` or `--version` otherwise select Grok CLI
    // syntax instead of starting an interactive turn with that literal text.
    argvPromptSeparator: '--'
  },
  devin: {
    detectCmd: 'devin',
    launchCmd: 'devin',
    expectedProcess: 'devin',
    // Why: `devin -- <prompt>` auto-submits immediately (docs.devin.ai/cli).
    // `stdin-after-start` starts the REPL with no argv prompt; Orca then sends
    // `followupPrompt` to the PTY as plain input + Enter after startup (not
    // bracketed paste). Use `draftPrompt` / agent-paste-draft for review-before-send.
    promptInjectionMode: 'stdin-after-start'
  }
}

export function isTuiAgent(value: unknown): value is TuiAgent {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TUI_AGENT_CONFIG, value)
}

export function getTuiAgentDetectCommands(config: TuiAgentConfig): string[] {
  return [config.detectCmd, ...(config.detectCmdAliases ?? [])]
}

export function getTuiAgentLaunchCommand(
  config: TuiAgentConfig,
  platform: NodeJS.Platform,
  opts?: { isRemote?: boolean }
): string {
  // Why: the SSH relay shim is always named `orca` on Unix, so the local-only
  // `orca-ide` rename (avoids shadowing the GNOME Orca screen reader) must not
  // leak to Linux remotes — the remote has no such desktop binary on PATH.
  if (opts?.isRemote && platform === 'linux') {
    return config.launchCmd
  }
  return config.launchCmdByPlatform?.[platform] ?? config.launchCmd
}
