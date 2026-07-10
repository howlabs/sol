import type { GlobalSettings } from '../../../../shared/types'
import { useAppStore } from '../../store'
import { SearchableSetting } from './SearchableSetting'
import { matchesSettingsSearch } from './settings-search'
import { getExperimentalPaneSearchEntries, getExperimentalSearchEntry } from './experimental-search'
import { HiddenExperimentalGroup } from './HiddenExperimentalGroup'
import { NumberField, SettingsSwitchRow } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'
import { NativeChatExperimentalSetting } from './NativeChatExperimentalSetting'
import { EphemeralVmsExperimentalSetting } from './EphemeralVmsExperimentalSetting'
import {
  MAX_AGENT_HIBERNATION_IDLE_MS,
  MIN_AGENT_HIBERNATION_IDLE_MS,
  getEffectiveAgentHibernationIdleMs
} from '@/lib/agent-hibernation-planner'

export { getExperimentalPaneSearchEntries }

const MS_PER_MINUTE = 60 * 1000

type ExperimentalPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  /** Hidden-experimental group is only rendered once the user has unlocked
   *  it via Shift-clicking the Experimental sidebar entry. */
  hiddenExperimentalUnlocked?: boolean
}

export function ExperimentalPane({
  settings,
  updateSettings,
  hiddenExperimentalUnlocked = false
}: ExperimentalPaneProps): React.JSX.Element {
  const searchQuery = useAppStore((s) => s.settingsSearchQuery)
  const entry = getExperimentalSearchEntry()
  const showAgentsView = matchesSettingsSearch(searchQuery, [entry.agentsView])
  const showNativeChat = matchesSettingsSearch(searchQuery, [entry.nativeChat])
  const showTerminalAttention = matchesSettingsSearch(searchQuery, [entry.terminalAttention])
  const showWorktreeSymlinks = matchesSettingsSearch(searchQuery, [entry.symlinksOnWorktrees])
  const showAgentHibernation = matchesSettingsSearch(searchQuery, [entry.agentHibernation])
  const showNewWorktreeCardStyle = matchesSettingsSearch(searchQuery, [entry.newWorktreeCardStyle])
  const agentHibernationEnabled = settings.experimentalAgentHibernation === true
  const newWorktreeCardStyleEnabled = settings.experimentalNewWorktreeCardStyle === true
  // Why: the planner owns ms-based bounds/defaults; the UI edits minutes
  // while displaying the same effective clamped value the planner will use.
  const agentHibernationIdleMinutes = Math.round(
    getEffectiveAgentHibernationIdleMs(settings.agentHibernationIdleMs) / MS_PER_MINUTE
  )

  return (
    <div className="space-y-1">
      {showAgentsView ? (
        <SearchableSetting
          title={translate('auto.components.settings.ExperimentalPane.a05bcdaf57', 'Agents View')}
          description={translate(
            'auto.components.settings.ExperimentalPane.f63ea281e3',
            'Threaded left-sidebar feed for agent completions and blocking states.'
          )}
          keywords={entry.agentsView.keywords}
        >
          <SettingsSwitchRow
            label={translate('auto.components.settings.ExperimentalPane.a05bcdaf57', 'Agents View')}
            description={translate(
              'auto.components.settings.ExperimentalPane.0277901cf7',
              'Adds an Agents entry to the left sidebar with a threaded worktree feed for completed agents, blocking questions, unread state, and worktree creation events. Experimental — the event model and UI may change.'
            )}
            checked={settings.experimentalActivity === true}
            onChange={() =>
              updateSettings({
                experimentalActivity: !settings.experimentalActivity
              })
            }
          />
        </SearchableSetting>
      ) : null}

      {showNativeChat ? (
        <NativeChatExperimentalSetting settings={settings} updateSettings={updateSettings} />
      ) : null}

      {showTerminalAttention ? (
        <SearchableSetting
          title={translate(
            'auto.components.settings.ExperimentalPane.ec897e8d89',
            'Terminal attention'
          )}
          description={translate(
            'auto.components.settings.ExperimentalPane.88b7613afb',
            'Persistent pane highlight for terminal bell and agent-completion events.'
          )}
          keywords={entry.terminalAttention.keywords}
        >
          <SettingsSwitchRow
            label={translate(
              'auto.components.settings.ExperimentalPane.ec897e8d89',
              'Terminal attention'
            )}
            description={translate(
              'auto.components.settings.ExperimentalPane.a20d5ea365',
              'Keeps a pane-level highlight visible after terminal bell or agent-completion events until you interact with that pane. Experimental while we tune the signal.'
            )}
            checked={settings.experimentalTerminalAttention === true}
            onChange={() =>
              updateSettings({
                experimentalTerminalAttention: !settings.experimentalTerminalAttention
              })
            }
          />
        </SearchableSetting>
      ) : null}

      {showAgentHibernation ? (
        <SearchableSetting
          title={translate(
            'auto.components.settings.ExperimentalPane.agentHibernation.title',
            'Agent sleep'
          )}
          description={translate(
            'auto.components.settings.ExperimentalPane.agentHibernation.description',
            'Stops idle background agent terminals after the configured idle window and resumes supported sessions when you open them again.'
          )}
          keywords={entry.agentHibernation.keywords}
          id="experimental-agent-hibernation"
          className="space-y-1.5"
        >
          <SettingsSwitchRow
            label={translate(
              'auto.components.settings.ExperimentalPane.agentHibernation.title',
              'Agent sleep'
            )}
            description={translate(
              'auto.components.settings.ExperimentalPane.agentHibernation.copy',
              'Stops idle background agent terminals after the configured idle window and resumes supported sessions when you open them again. Agent sleep preserves launch options for agents started by Orca. Manually started agents may resume with your current Orca defaults. Experimental while we tune the safety model.'
            )}
            checked={agentHibernationEnabled}
            ariaLabel={translate(
              'auto.components.settings.ExperimentalPane.agentHibernation.toggleLabel',
              'Toggle agent sleep'
            )}
            onChange={() =>
              updateSettings({
                experimentalAgentHibernation: !agentHibernationEnabled
              })
            }
          />
          {agentHibernationEnabled ? (
            <NumberField
              label={translate(
                'auto.components.settings.ExperimentalPane.agentHibernation.idleMinutesLabel',
                'Sleep after'
              )}
              description={translate(
                'auto.components.settings.ExperimentalPane.agentHibernation.idleMinutesDescription',
                'How many idle minutes a completed background agent must wait before Orca can sleep it.'
              )}
              value={agentHibernationIdleMinutes}
              min={MIN_AGENT_HIBERNATION_IDLE_MS / MS_PER_MINUTE}
              max={MAX_AGENT_HIBERNATION_IDLE_MS / MS_PER_MINUTE}
              step={1}
              suffix={translate(
                'auto.components.settings.ExperimentalPane.agentHibernation.idleMinutesSuffix',
                'minutes'
              )}
              onChange={(minutes) =>
                updateSettings({
                  // Why: settings persist the planner contract, not the display unit.
                  agentHibernationIdleMs: minutes * MS_PER_MINUTE
                })
              }
            />
          ) : null}
        </SearchableSetting>
      ) : null}

      {showNewWorktreeCardStyle ? (
        <SearchableSetting
          title={translate(
            'auto.components.settings.ExperimentalPane.newWorktreeCardStyle.title',
            'New card style'
          )}
          description={translate(
            'auto.components.settings.ExperimentalPane.newWorktreeCardStyle.description',
            'Preview updated worktree-card layout, metadata placement, card-display menu options, and status presentation.'
          )}
          keywords={entry.newWorktreeCardStyle.keywords}
          id="experimental-new-worktree-card-style"
        >
          <SettingsSwitchRow
            label={translate(
              'auto.components.settings.ExperimentalPane.newWorktreeCardStyle.title',
              'New card style'
            )}
            description={translate(
              'auto.components.settings.ExperimentalPane.newWorktreeCardStyle.copy',
              'Previews updated worktree-card layout and metadata behavior, including hover/context-menu ownership and status presentation.'
            )}
            checked={newWorktreeCardStyleEnabled}
            ariaLabel={translate(
              'auto.components.settings.ExperimentalPane.newWorktreeCardStyle.toggleLabel',
              'Toggle new card style'
            )}
            onChange={() =>
              updateSettings({
                experimentalNewWorktreeCardStyle: !newWorktreeCardStyleEnabled
              })
            }
          />
        </SearchableSetting>
      ) : null}

      {showWorktreeSymlinks ? (
        <SearchableSetting
          title={translate(
            'auto.components.settings.ExperimentalPane.24416f42cd',
            'Shared paths on worktrees'
          )}
          description={translate(
            'auto.components.settings.ExperimentalPane.fb82ea1d7a',
            'Automatically materialize configured files or folders into newly created worktrees.'
          )}
          keywords={entry.symlinksOnWorktrees.keywords}
        >
          <SettingsSwitchRow
            label={translate(
              'auto.components.settings.ExperimentalPane.24416f42cd',
              'Shared paths on worktrees'
            )}
            description={translate(
              'auto.components.settings.ExperimentalPane.9762364929',
              'Uses APFS clone-copy on macOS when possible, otherwise symlinks configured folders or files into created worktrees.'
            )}
            checked={settings.experimentalWorktreeSymlinks === true}
            onChange={() =>
              updateSettings({
                experimentalWorktreeSymlinks: !settings.experimentalWorktreeSymlinks
              })
            }
          />
        </SearchableSetting>
      ) : null}

      <EphemeralVmsExperimentalSetting settings={settings} updateSettings={updateSettings} />

      {hiddenExperimentalUnlocked ? <HiddenExperimentalGroup /> : null}
    </div>
  )
}
