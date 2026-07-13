import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { GlobalSettings } from '../../../../shared/types'
import {
  SettingsRow,
  SettingsSegmentedControl,
  SettingsSwitchRow,
  SettingsSubsectionHeader,
  ThemePicker
} from './SettingsFormControls'
import { SearchableSetting } from './SearchableSetting'
import {
  getAvailableTerminalThemeOptions,
  resolveEffectiveTerminalAppearance
} from '@/lib/terminal-theme'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'

type TerminalThemeTarget = 'dark' | 'light'

function getInitialTerminalThemeTarget(
  settings: GlobalSettings,
  systemPrefersDark: boolean,
  preferredTarget?: TerminalThemeTarget
): TerminalThemeTarget {
  if (preferredTarget) {
    return preferredTarget
  }
  // Why: the picker edits mode-specific slots. Defaulting to the active
  // terminal mode makes the selected theme apply immediately in system-light.
  return resolveEffectiveTerminalAppearance(settings, systemPrefersDark).mode
}

type TerminalThemeCatalogSectionProps = {
  settings: GlobalSettings
  systemPrefersDark: boolean
  themeSearch: string
  setThemeSearch: Dispatch<SetStateAction<string>>
  updateSettings: (updates: Partial<GlobalSettings>) => void
  previewFontFamily: string | null
  preferredTarget?: TerminalThemeTarget
  advancedContent?: ReactNode
}

export function TerminalThemeCatalogSection({
  settings,
  systemPrefersDark,
  themeSearch,
  setThemeSearch,
  updateSettings,
  previewFontFamily: _previewFontFamily,
  preferredTarget,
  advancedContent
}: TerminalThemeCatalogSectionProps): React.JSX.Element {
  const [target, setTargetState] = useState<TerminalThemeTarget>(() =>
    getInitialTerminalThemeTarget(settings, systemPrefersDark, preferredTarget)
  )
  const setTarget = (nextTarget: TerminalThemeTarget): void => {
    setTargetState(nextTarget)
  }
  const themeOptions = getAvailableTerminalThemeOptions(settings)
  const isLightTarget = target === 'light'
  const matchDarkMode = !settings.terminalUseSeparateLightTheme
  const lightModeMatchesDark = isLightTarget && matchDarkMode
  const showCustomControls = !lightModeMatchesDark
  const selectedTheme = isLightTarget ? settings.terminalThemeLight : settings.terminalThemeDark
  const pickerTitle = isLightTarget
    ? translate('auto.components.settings.TerminalThemeSections.8273bc75d7', 'Light Theme')
    : translate('auto.components.settings.TerminalThemeSections.9499ad1dc4', 'Dark Theme')
  const pickerDescription = isLightTarget
    ? translate(
        'auto.components.settings.TerminalThemeSections.d56af60e6f',
        'Choose the theme used when Orca is in light mode.'
      )
    : translate(
        'auto.components.settings.TerminalThemeSections.7add204bd5',
        'Choose the terminal theme used in dark mode.'
      )

  return (
    <section className="space-y-1.5">
      <SettingsSubsectionHeader
        className="items-center"
        title={translate(
          'auto.components.settings.TerminalThemeSections.catalog_title',
          'Terminal Themes'
        )}
      />

      <div className="ml-3 grid gap-2">
        <div className={advancedContent ? 'border-b border-border/40 pb-2' : undefined}>
          <div className="divide-y divide-border/40">
            <SearchableSetting
              title={translate(
                'auto.components.settings.TerminalThemeSections.target_title',
                'Theme Mode'
              )}
              keywords={['terminal', 'theme', 'dark', 'light']}
              forceVisible
            >
              <SettingsRow
                label={translate(
                  'auto.components.settings.TerminalThemeSections.target_title',
                  'Theme Mode'
                )}
                control={
                  <SettingsSegmentedControl
                    value={target}
                    onChange={setTarget}
                    ariaLabel={translate(
                      'auto.components.settings.TerminalThemeSections.target_aria',
                      'Terminal theme mode'
                    )}
                    equalWidth
                    options={[
                      {
                        value: 'dark',
                        label: translate(
                          'auto.components.settings.TerminalThemeSections.target_dark',
                          'Dark'
                        )
                      },
                      {
                        value: 'light',
                        label: translate(
                          'auto.components.settings.TerminalThemeSections.target_light',
                          'Light'
                        )
                      }
                    ]}
                  />
                }
              />
            </SearchableSetting>

            {isLightTarget ? (
              <SearchableSetting
                title={translate(
                  'auto.components.settings.TerminalThemeSections.match_dark_mode',
                  'Match dark mode'
                )}
                keywords={['terminal', 'light mode', 'theme', 'match dark']}
                forceVisible
              >
                <SettingsSwitchRow
                  label={translate(
                    'auto.components.settings.TerminalThemeSections.match_dark_mode',
                    'Match dark mode'
                  )}
                  description={translate(
                    'auto.components.settings.TerminalThemeSections.match_dark_mode_description',
                    'Share the dark terminal theme and divider color in light mode.'
                  )}
                  checked={matchDarkMode}
                  onChange={() =>
                    // The legacy setting stores the inverse; the UI exposes the matching concept.
                    updateSettings({
                      terminalUseSeparateLightTheme: !settings.terminalUseSeparateLightTheme
                    })
                  }
                />
              </SearchableSetting>
            ) : null}
          </div>

          <div
            className={cn(
              'grid overflow-hidden transition-[grid-template-rows,padding-top] duration-200 ease-out',
              showCustomControls ? 'grid-rows-[1fr] pt-3' : 'grid-rows-[0fr] pt-0'
            )}
            aria-hidden={!showCustomControls}
            inert={!showCustomControls}
          >
            <div
              className={cn(
                'min-h-0 space-y-3 transition-[opacity,transform] duration-150 ease-out',
                showCustomControls
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1 opacity-0'
              )}
            >
              <SearchableSetting
                title={pickerTitle}
                description={pickerDescription}
                keywords={['terminal', 'theme', 'dark', 'light', 'preview']}
                forceVisible
              >
                <ThemePicker
                  label={pickerTitle}
                  description={pickerDescription}
                  selectedTheme={selectedTheme}
                  themeOptions={themeOptions}
                  query={themeSearch}
                  onQueryChange={setThemeSearch}
                  onSelectTheme={(theme) => {
                    updateSettings(
                      isLightTarget ? { terminalThemeLight: theme } : { terminalThemeDark: theme }
                    )
                  }}
                />
              </SearchableSetting>
            </div>
          </div>
        </div>

        {advancedContent ? <div className="-mt-4">{advancedContent}</div> : null}
      </div>
    </section>
  )
}
