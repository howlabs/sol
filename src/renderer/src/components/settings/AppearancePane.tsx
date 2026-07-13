import type React from 'react'
import { useState } from 'react'
import { AppWindow, PanelLeft, TerminalSquare } from '@/lib/icons'

import type { GlobalSettings } from '../../../../shared/types'

import { AppearanceSection } from './AppearanceSection'
import { AppearanceInterfaceSection } from './AppearanceInterfaceSection'
import { AppearanceWindowSidebarSection } from './AppearanceWindowSidebarSection'
import { SearchableSetting } from './SearchableSetting'
import { matchesSettingsSearch, normalizeSettingsSearchQuery } from './settings-search'
import { useAppStore } from '../../store'
import {
  getAppIconEntries,
  getAppearancePaneSearchEntries,
  getLanguageEntries,
  getLayoutEntries,
  getSidebarEntries,
  getStatusBarEntries,
  getThemeEntries,
  getTypographyEntries,
  getZoomEntries
} from './appearance-search'
import { getTerminalAppearanceSearchEntries } from './terminal-search'
import { TerminalAppearanceSection } from './TerminalAppearanceSection'
import { AppIconSelector } from './AppIconSelector'
import { normalizeAppIconId } from '../../../../shared/app-icon'
import { SHOW_UI_LANGUAGE_SETTING } from '@/i18n/supported-languages'
import { translate } from '@/i18n/i18n'
import {
  getLeftSidebarAppearanceEntry,
  getWorkspaceCardLayoutEntry
} from './appearance-sidebar-search'
export { getAppearancePaneSearchEntries }

type AppearancePaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  applyTheme: (theme: 'system' | 'dark' | 'light') => void
  fontSuggestions: string[]
  terminalFontSuggestions: string[]
  onRequestFontSuggestions?: () => void
  systemPrefersDark: boolean
}

type AppearanceSectionKey = 'interface' | 'terminal' | 'window'

function resolveThemeSummary(theme: GlobalSettings['theme']): string {
  if (theme === 'system') {
    return translate('auto.components.settings.AppearancePane.fb0e0b4453', 'System')
  }
  if (theme === 'light') {
    return translate('auto.components.settings.AppearancePane.fd89b5487c', 'Light')
  }
  return translate('auto.components.settings.AppearancePane.7d26ccabe8', 'Dark')
}

export function AppearancePane({
  settings,
  updateSettings,
  applyTheme,
  fontSuggestions,
  terminalFontSuggestions,
  onRequestFontSuggestions,
  systemPrefersDark
}: AppearancePaneProps): React.JSX.Element {
  const searchQuery = useAppStore((state) => state.settingsSearchQuery)
  const isSearching = normalizeSettingsSearchQuery(searchQuery).length > 0

  const [manuallyOpenSection, setManuallyOpenSection] = useState<AppearanceSectionKey | null>(
    'interface'
  )
  const interfaceTitle = translate(
    'auto.components.settings.AppearancePane.interfaceTitle',
    'Interface'
  )
  const terminalTitle = translate(
    'auto.components.settings.AppearancePane.terminalTitle',
    'Terminal'
  )
  const windowSidebarTitle = translate(
    'auto.components.settings.AppearancePane.windowSidebarTitle',
    'Window & Sidebar'
  )
  const windowSidebarSummary = translate(
    'auto.components.settings.AppearancePane.windowSidebarSummary',
    'Sidebar, status bar, and file explorer'
  )

  // Search-entry buckets per section so a query can force-open the matching one.
  const interfaceSearchEntries = [
    { title: interfaceTitle },
    ...getThemeEntries(),
    ...getZoomEntries(),
    ...getTypographyEntries(),
    ...(SHOW_UI_LANGUAGE_SETTING ? getLanguageEntries() : [])
  ]
  const terminalSearchEntries = [{ title: terminalTitle }, ...getTerminalAppearanceSearchEntries()]
  const windowSearchEntries = [
    {
      title: windowSidebarTitle,
      description: windowSidebarSummary
    },
    ...getStatusBarEntries(),
    ...getSidebarEntries(),
    ...getLayoutEntries(),
    getLeftSidebarAppearanceEntry(),
    getWorkspaceCardLayoutEntry()
  ]

  const interfaceMatches = matchesSettingsSearch(searchQuery, interfaceSearchEntries)
  const terminalMatches = matchesSettingsSearch(searchQuery, terminalSearchEntries)
  const windowMatches = matchesSettingsSearch(searchQuery, windowSearchEntries)
  const interfaceLabelMatches = matchesSettingsSearch(searchQuery, { title: interfaceTitle })
  const terminalLabelMatches = matchesSettingsSearch(searchQuery, { title: terminalTitle })
  const windowLabelMatches = matchesSettingsSearch(searchQuery, {
    title: windowSidebarTitle,
    description: windowSidebarSummary
  })
  const appIconMatches = matchesSettingsSearch(searchQuery, getAppIconEntries())

  // While searching, force-open every section that contains a match so its
  // controls (including advanced ones) are revealed; otherwise the accordion
  // shows exactly one manually-chosen section.
  function isSectionOpen(key: AppearanceSectionKey): boolean {
    if (isSearching) {
      return key === 'interface'
        ? interfaceMatches
        : key === 'terminal'
          ? terminalMatches
          : windowMatches
    }
    return manuallyOpenSection === key
  }

  function toggleSection(key: AppearanceSectionKey): void {
    setManuallyOpenSection((current) => (current === key ? null : key))
  }

  const interfaceSummary = `${resolveThemeSummary(settings.theme)} · ${
    settings.appFontFamily ||
    translate('auto.components.settings.AppearancePane.interfaceDefaultFont', 'Default font')
  }`
  const terminalSummary = `${
    settings.terminalFontFamily ||
    translate('auto.components.settings.AppearancePane.terminalDefaultFont', 'Default font')
  } · ${settings.terminalFontSize}px`

  return (
    <div className="space-y-1">
      {interfaceMatches ? (
        <AppearanceSection
          id="interface"
          icon={<AppWindow aria-hidden="true" />}
          title={interfaceTitle}
          summary={interfaceSummary}
          open={isSectionOpen('interface')}
          onToggle={() => toggleSection('interface')}
        >
          <AppearanceInterfaceSection
            settings={settings}
            updateSettings={updateSettings}
            applyTheme={applyTheme}
            fontSuggestions={fontSuggestions}
            onRequestFontSuggestions={onRequestFontSuggestions}
            forceVisiblePrimary={interfaceLabelMatches}
          />
        </AppearanceSection>
      ) : null}

      {/* Why: Code & Markdown is intentionally omitted. Orca has no Appearance-level
          code/markdown settings — the Monaco editor reuses the terminal font and
          there is no markdown-style or line-number setting — so a fourth row would
          be empty. We surface only the three sections that hold real controls
          rather than fabricate settings. */}

      {terminalMatches ? (
        <AppearanceSection
          id="terminal"
          icon={<TerminalSquare aria-hidden="true" />}
          title={terminalTitle}
          summary={terminalSummary}
          open={isSectionOpen('terminal')}
          onToggle={() => toggleSection('terminal')}
        >
          <TerminalAppearanceSection
            settings={settings}
            updateSettings={updateSettings}
            systemPrefersDark={systemPrefersDark}
            terminalFontSuggestions={terminalFontSuggestions}
            onRequestFontSuggestions={onRequestFontSuggestions}
            forceVisiblePrimary={terminalLabelMatches}
          />
        </AppearanceSection>
      ) : null}

      {windowMatches ? (
        <AppearanceSection
          id="window"
          icon={<PanelLeft aria-hidden="true" />}
          title={windowSidebarTitle}
          summary={windowSidebarSummary}
          open={isSectionOpen('window')}
          onToggle={() => toggleSection('window')}
        >
          <AppearanceWindowSidebarSection
            settings={settings}
            updateSettings={updateSettings}
            forceVisiblePrimary={windowLabelMatches}
          />
        </AppearanceSection>
      ) : null}

      {/* Why: App Icon is a quiet easter-egg control (collection template edge).
          SearchableSetting title/description are search-only — do not stack a
          formal SettingsSubsectionHeader that duplicates that copy. */}
      {appIconMatches ? (
        <SearchableSetting
          title={translate('auto.components.settings.AppearancePane.ca1590d42f', 'App Icon')}
          description={translate(
            'auto.components.settings.AppearancePane.0cd9b8228f',
            'Choose the app icon shown in the Dock and window switcher.'
          )}
          keywords={getAppIconEntries().flatMap((entry) => [
            entry.title,
            entry.description ?? '',
            ...(entry.keywords ?? [])
          ])}
          className="max-w-none border-t border-border/40 pt-3"
        >
          <AppIconSelector
            value={normalizeAppIconId(settings.appIcon)}
            onChange={(appIcon) => updateSettings({ appIcon })}
          />
        </SearchableSetting>
      ) : null}
    </div>
  )
}
