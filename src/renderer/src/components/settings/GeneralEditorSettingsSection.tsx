import type React from 'react'
import type { GlobalSettings } from '../../../../shared/types'
import {
  DEFAULT_EDITOR_AUTO_SAVE_DELAY_MS,
  MAX_EDITOR_AUTO_SAVE_DELAY_MS,
  MIN_EDITOR_AUTO_SAVE_DELAY_MS
} from '../../../../shared/constants'
import { SearchableSetting } from './SearchableSetting'
import {
  NumberField,
  SettingsRow,
  SettingsSegmentedControl,
  SettingsSubsectionHeader,
  SettingsSwitchRow
} from './SettingsFormControls'
import { translate } from '@/i18n/i18n'
import { RichMarkdownSpellcheckSetting } from './RichMarkdownSpellcheckSetting'

// Kept for GeneralPane.test draft-state coverage of async settings persistence.
export type AutoSaveDelayDraftState = {
  sourceDelayMs: number
  draft: string
}

export function createAutoSaveDelayDraftState(
  editorAutoSaveDelayMs: number
): AutoSaveDelayDraftState {
  return {
    sourceDelayMs: editorAutoSaveDelayMs,
    draft: String(editorAutoSaveDelayMs)
  }
}

function resolveAutoSaveDelayDraftState(
  state: AutoSaveDelayDraftState,
  editorAutoSaveDelayMs: number
): AutoSaveDelayDraftState {
  return state.sourceDelayMs === editorAutoSaveDelayMs
    ? state
    : createAutoSaveDelayDraftState(editorAutoSaveDelayMs)
}

export function updateAutoSaveDelayDraftState(
  state: AutoSaveDelayDraftState,
  editorAutoSaveDelayMs: number,
  draft: string
): AutoSaveDelayDraftState {
  return {
    // Why: settings persistence is async, so a committed draft must stay tied
    // to the current source until the persisted value reloads.
    ...resolveAutoSaveDelayDraftState(state, editorAutoSaveDelayMs),
    draft
  }
}

type GeneralEditorSettingsSectionProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function GeneralEditorSettingsSection({
  settings,
  updateSettings
}: GeneralEditorSettingsSectionProps): React.JSX.Element {
  return (
    <section key="editor" className="space-y-1.5">
      <SettingsSubsectionHeader
        title={translate(
          'auto.components.settings.GeneralEditorSettingsSection.45c6e85c4d',
          'Editor'
        )}
        description={translate(
          'auto.components.settings.GeneralEditorSettingsSection.d21136d9ef',
          'Configure how Sol persists file edits.'
        )}
      />

      <SearchableSetting
        title={translate(
          'auto.components.settings.GeneralEditorSettingsSection.0df2e4fd12',
          'Auto Save Files'
        )}
        description={translate(
          'auto.components.settings.GeneralEditorSettingsSection.70bb30feb1',
          'Save editor and editable diff changes automatically after a short pause.'
        )}
        keywords={['autosave', 'save']}
      >
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.GeneralEditorSettingsSection.0df2e4fd12',
            'Auto Save Files'
          )}
          description={translate(
            'auto.components.settings.GeneralEditorSettingsSection.70bb30feb1',
            'Save editor and editable diff changes automatically after a short pause.'
          )}
          checked={settings.editorAutoSave}
          onChange={() => updateSettings({ editorAutoSave: !settings.editorAutoSave })}
        />
      </SearchableSetting>

      <SearchableSetting
        title={translate(
          'auto.components.settings.GeneralEditorSettingsSection.d6cf227ca0',
          'Auto Save Delay'
        )}
        description={translate(
          'auto.components.settings.GeneralEditorSettingsSection.1bec6d8318',
          'How long Sol waits after your last edit before saving automatically.'
        )}
        keywords={['autosave', 'delay', 'milliseconds']}
      >
        <NumberField
          label={translate(
            'auto.components.settings.GeneralEditorSettingsSection.d6cf227ca0',
            'Auto Save Delay'
          )}
          description={translate(
            'auto.components.settings.GeneralEditorSettingsSection.1bec6d8318',
            'How long Sol waits after your last edit before saving automatically.'
          )}
          value={settings.editorAutoSaveDelayMs}
          defaultValue={DEFAULT_EDITOR_AUTO_SAVE_DELAY_MS}
          min={MIN_EDITOR_AUTO_SAVE_DELAY_MS}
          max={MAX_EDITOR_AUTO_SAVE_DELAY_MS}
          step={250}
          suffix={translate(
            'auto.components.settings.GeneralEditorSettingsSection.a5db1d3975',
            'ms'
          )}
          onChange={(next) => updateSettings({ editorAutoSaveDelayMs: Math.round(next) })}
        />
      </SearchableSetting>

      <SearchableSetting
        title={translate(
          'auto.components.settings.GeneralEditorSettingsSection.7311f67ee7',
          'Default Diff View'
        )}
        description={translate(
          'auto.components.settings.GeneralEditorSettingsSection.b492397d34',
          'Preferred presentation format for showing git diffs by default.'
        )}
        keywords={['diff', 'view', 'inline', 'side-by-side', 'split']}
      >
        <SettingsRow
          label={translate(
            'auto.components.settings.GeneralEditorSettingsSection.7311f67ee7',
            'Default Diff View'
          )}
          description={translate(
            'auto.components.settings.GeneralEditorSettingsSection.b492397d34',
            'Preferred presentation format for showing git diffs by default.'
          )}
          control={
            <SettingsSegmentedControl
              ariaLabel={translate(
                'auto.components.settings.GeneralEditorSettingsSection.7311f67ee7',
                'Default Diff View'
              )}
              value={settings.diffDefaultView}
              onChange={(option) => updateSettings({ diffDefaultView: option })}
              options={[
                {
                  value: 'inline',
                  label: translate(
                    'auto.components.settings.GeneralEditorSettingsSection.05b6df93b3',
                    'Inline'
                  )
                },
                {
                  value: 'side-by-side',
                  label: translate(
                    'auto.components.settings.GeneralEditorSettingsSection.12cbc0d0d6',
                    'Side-by-side'
                  )
                }
              ]}
            />
          }
        />
      </SearchableSetting>

      <SearchableSetting
        title={translate(
          'auto.components.settings.GeneralEditorSettingsSection.8f1afdfbd8',
          'Diff Word Wrap'
        )}
        description={translate(
          'auto.components.settings.GeneralEditorSettingsSection.4aa4d9fb73',
          'Wrap long lines in diff editors instead of requiring horizontal scrolling.'
        )}
        keywords={['diff', 'word wrap', 'wrap', 'markdown', 'long lines']}
      >
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.GeneralEditorSettingsSection.8f1afdfbd8',
            'Diff Word Wrap'
          )}
          description={translate(
            'auto.components.settings.GeneralEditorSettingsSection.4aa4d9fb73',
            'Wrap long lines in diff editors instead of requiring horizontal scrolling.'
          )}
          checked={settings.diffWordWrap}
          onChange={() => updateSettings({ diffWordWrap: !settings.diffWordWrap })}
        />
      </SearchableSetting>

      <SearchableSetting
        title={translate(
          'auto.components.settings.GeneralEditorSettingsSection.1de48ad940',
          'Default Diff File Tree'
        )}
        description={translate(
          'auto.components.settings.GeneralEditorSettingsSection.1b87897af9',
          'Show or hide the file tree when opening combined diff views.'
        )}
        keywords={['diff', 'tree', 'file tree', 'combined diff', 'sidebar']}
      >
        <SettingsRow
          label={translate(
            'auto.components.settings.GeneralEditorSettingsSection.1de48ad940',
            'Default Diff File Tree'
          )}
          description={translate(
            'auto.components.settings.GeneralEditorSettingsSection.1b87897af9',
            'Show or hide the file tree when opening combined diff views.'
          )}
          control={
            <SettingsSegmentedControl
              ariaLabel={translate(
                'auto.components.settings.GeneralEditorSettingsSection.1de48ad940',
                'Default Diff File Tree'
              )}
              value={settings.combinedDiffFileTreeVisibleByDefault ? 'shown' : 'hidden'}
              onChange={(option) =>
                updateSettings({ combinedDiffFileTreeVisibleByDefault: option === 'shown' })
              }
              options={[
                {
                  value: 'shown',
                  label: translate(
                    'auto.components.settings.GeneralEditorSettingsSection.73a09aad63',
                    'Shown'
                  )
                },
                {
                  value: 'hidden',
                  label: translate(
                    'auto.components.settings.GeneralEditorSettingsSection.5a1ea6eaa2',
                    'Hidden'
                  )
                }
              ]}
            />
          }
        />
      </SearchableSetting>

      <SearchableSetting
        title={translate(
          'auto.components.settings.GeneralEditorSettingsSection.6690b1ffb9',
          'Minimap'
        )}
        description={translate(
          'auto.components.settings.GeneralEditorSettingsSection.51161d1647',
          'Show the minimap overview when editing a file.'
        )}
        keywords={['minimap', 'overview', 'code', 'scroll']}
      >
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.GeneralEditorSettingsSection.6690b1ffb9',
            'Minimap'
          )}
          description={translate(
            'auto.components.settings.GeneralEditorSettingsSection.51161d1647',
            'Show the minimap overview when editing a file.'
          )}
          checked={settings.editorMinimapEnabled}
          onChange={() => updateSettings({ editorMinimapEnabled: !settings.editorMinimapEnabled })}
        />
      </SearchableSetting>

      <RichMarkdownSpellcheckSetting settings={settings} updateSettings={updateSettings} />

      <SearchableSetting
        title={translate(
          'auto.components.settings.GeneralEditorSettingsSection.4edc104f0f',
          'Markdown Review Notes'
        )}
        description={translate(
          'auto.components.settings.GeneralEditorSettingsSection.5f02e6fb21',
          'Show local markdown review note controls in rich editor mode.'
        )}
        keywords={['markdown', 'review', 'notes', 'annotations', 'agents']}
      >
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.GeneralEditorSettingsSection.4edc104f0f',
            'Markdown Review Notes'
          )}
          description={translate(
            'auto.components.settings.GeneralEditorSettingsSection.f80603d293',
            'Show local markdown note controls in rich editor mode and agent handoff actions.'
          )}
          checked={settings.markdownReviewToolsEnabled}
          onChange={() =>
            updateSettings({ markdownReviewToolsEnabled: !settings.markdownReviewToolsEnabled })
          }
        />
      </SearchableSetting>
    </section>
  )
}
