import { useState } from 'react'
import type { GlobalSettings } from '../../../../shared/types'
import {
  matchesSettingsSearch,
  normalizeSettingsSearchQuery,
  scoreSettingsSearch,
  type SettingsSearchEntry
} from './settings-search'
import { useAppStore } from '../../store'
import {
  getTerminalCursorSearchEntries,
  getTerminalDarkThemeSearchEntries,
  getTerminalLightThemeSearchEntries,
  getTerminalThemeTargetSearchEntries,
  getTerminalTypographySearchEntries,
  getTerminalWindowSearchEntries
} from './terminal-search'
import { SettingsRow, SettingsSubsectionHeader } from './SettingsFormControls'
import { SearchableSetting } from './SearchableSetting'
import { FontAutocomplete } from './SettingsFormControls'
import { TerminalFontSizeSetting } from './TerminalFontSizeSetting'
import { TerminalThemeCatalogSection } from './TerminalThemeSections'
import { TerminalWindowSection } from './TerminalWindowSection'
import { TerminalCursorAppearanceSection } from './TerminalCursorAppearanceSection'
import { AppearanceAdvancedDisclosure } from './AppearanceAdvancedDisclosure'
import { translate } from '@/i18n/i18n'

type TerminalAppearanceSectionProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  systemPrefersDark: boolean
  terminalFontSuggestions: string[]
  onRequestFontSuggestions?: () => void
  forceVisiblePrimary?: boolean
}

type TerminalThemeTarget = 'dark' | 'light'

function scoreThemeTargetIntent(searchQuery: string, entries: SettingsSearchEntry[]): number {
  // Why: descriptions mention dark/light incidentally; target intent should come from labels and aliases.
  return scoreSettingsSearch(
    searchQuery,
    entries.map(({ title, keywords }) => ({ title, keywords }))
  )
}

function getPreferredThemeTarget(
  darkThemeSearchScore: number,
  lightThemeSearchScore: number
): TerminalThemeTarget | undefined {
  if (darkThemeSearchScore === lightThemeSearchScore) {
    return undefined
  }
  return darkThemeSearchScore > lightThemeSearchScore ? 'dark' : 'light'
}

export function TerminalAppearanceSection({
  settings,
  updateSettings,
  systemPrefersDark,
  terminalFontSuggestions,
  onRequestFontSuggestions,
  forceVisiblePrimary = false
}: TerminalAppearanceSectionProps): React.JSX.Element {
  const searchQuery = useAppStore((state) => state.settingsSearchQuery)
  const isSearching = normalizeSettingsSearchQuery(searchQuery).length > 0
  const [themeSearch, setThemeSearch] = useState('')
  const [previewFontFamily, setPreviewFontFamily] = useState<string | null>(null)
  const darkThemeSearchEntries = getTerminalDarkThemeSearchEntries()
  const lightThemeSearchEntries = getTerminalLightThemeSearchEntries()
  const terminalTypographyEntries = getTerminalTypographySearchEntries()
  const themeCatalogSearchEntries = [
    ...getTerminalThemeTargetSearchEntries(),
    ...darkThemeSearchEntries,
    ...lightThemeSearchEntries
  ]
  const darkThemeTargetScore = scoreThemeTargetIntent(searchQuery, darkThemeSearchEntries)
  const lightThemeTargetScore = scoreThemeTargetIntent(searchQuery, lightThemeSearchEntries)
  const preferredThemeTarget = getPreferredThemeTarget(darkThemeTargetScore, lightThemeTargetScore)

  const cursorMatches = matchesSettingsSearch(searchQuery, getTerminalCursorSearchEntries())
  const windowMatches = matchesSettingsSearch(searchQuery, getTerminalWindowSearchEntries())
  const themeCatalogMatches = matchesSettingsSearch(searchQuery, themeCatalogSearchEntries)
  const previewAdvancedMatches = cursorMatches || windowMatches
  const showThemeCatalog = !isSearching || themeCatalogMatches || previewAdvancedMatches
  const primaryTypographyMatches = matchesSettingsSearch(
    searchQuery,
    terminalTypographyEntries.slice(0, 2)
  )
  const showPrimaryTypography = !isSearching || forceVisiblePrimary || primaryTypographyMatches

  const advancedGroups = [
    cursorMatches
      ? {
          key: 'cursor',
          node: (
            <TerminalCursorAppearanceSection settings={settings} updateSettings={updateSettings} />
          )
        }
      : null,
    windowMatches
      ? {
          key: 'window',
          node: <TerminalWindowSection settings={settings} updateSettings={updateSettings} />
        }
      : null
  ].filter((group): group is { key: string; node: React.JSX.Element } => group !== null)
  const showAdvancedDisclosure = !isSearching || advancedGroups.length > 0
  const previewAdvancedContent = showAdvancedDisclosure ? (
    <AppearanceAdvancedDisclosure
      showTopBorder={false}
      className="mt-0 pt-1"
      contentClassName="ml-3 pt-1.5"
    >
      {advancedGroups.map((group, index) => (
        <div
          key={group.key}
          className={index > 0 ? 'mt-1.5 border-t border-border/40 pt-2' : undefined}
        >
          {group.node}
        </div>
      ))}
    </AppearanceAdvancedDisclosure>
  ) : null

  return (
    <div className="space-y-1.5">
      {showPrimaryTypography ? (
        <section className="space-y-1.5">
          <SettingsSubsectionHeader
            className="items-center"
            title={translate(
              'auto.components.settings.TerminalAppearanceSection.048aac8a64',
              'Terminal Typography'
            )}
          />

          <div className="ml-3 divide-y divide-border/40 border-y border-border/40">
            <TerminalFontSizeSetting
              settings={settings}
              updateSettings={updateSettings}
              forceVisible={forceVisiblePrimary}
            />

            <SearchableSetting
              title={translate(
                'auto.components.settings.TerminalAppearanceSection.a408266e67',
                'Font Family'
              )}
              description={terminalTypographyEntries[1]?.description}
              keywords={
                terminalTypographyEntries[1]?.keywords ?? ['terminal', 'typography', 'font']
              }
              forceVisible={forceVisiblePrimary}
            >
              <SettingsRow
                label={translate(
                  'auto.components.settings.TerminalAppearanceSection.a408266e67',
                  'Font Family'
                )}
                control={
                  <FontAutocomplete
                    value={settings.terminalFontFamily}
                    suggestions={terminalFontSuggestions}
                    onRequestSuggestions={onRequestFontSuggestions}
                    onChange={(value) => updateSettings({ terminalFontFamily: value })}
                    onPreviewFontFamily={setPreviewFontFamily}
                  />
                }
              />
            </SearchableSetting>
          </div>
        </section>
      ) : null}

      {showThemeCatalog ? (
        <TerminalThemeCatalogSection
          key={`theme-catalog-${preferredThemeTarget ?? 'manual'}`}
          settings={settings}
          systemPrefersDark={systemPrefersDark}
          themeSearch={themeSearch}
          setThemeSearch={setThemeSearch}
          updateSettings={updateSettings}
          previewFontFamily={previewFontFamily}
          preferredTarget={preferredThemeTarget}
          advancedContent={previewAdvancedContent}
        />
      ) : null}
    </div>
  )
}
