import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GlobalSettings } from '../../../../shared/types'
import { SettingsSidebar } from './SettingsSidebar'

vi.mock('@/hooks/useShortcutLabel', () => ({
  useShortcutKeyComboDetails: () => [{ keys: ['Meta', ','], doubleTap: false }]
}))

vi.mock('../terminal-pane/use-system-prefers-dark', () => ({
  useSystemPrefersDark: () => false
}))

function renderSidebar(activeSectionId = 'general'): string {
  return renderToStaticMarkup(
    <SettingsSidebar
      activeSectionId={activeSectionId}
      settings={null as unknown as GlobalSettings}
      generalGroups={[
        {
          id: 'setup',
          title: 'Setup',
          sections: [{ id: 'general', title: 'General', icon: () => null }]
        }
      ]}
      repoSections={[]}
      hasRepos={false}
      searchQuery=""
      onBack={() => {}}
      onSearchChange={() => {}}
      onSelectSection={() => {}}
    />
  )
}

describe('SettingsSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders general sections without onboarding checklist entry', () => {
    const markup = renderSidebar('general')
    expect(markup).toContain('General')
    expect(markup).not.toContain('Onboarding checklist')
  })
})
