import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SidebarSettingsHelpMenu } from './SidebarSettingsHelpMenu'

const mocks = vi.hoisted(() => ({
  openSettingsPage: vi.fn(),
  openSettingsTarget: vi.fn(),
  updateStatus: null as null | { state: string }
}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      openSettingsPage: mocks.openSettingsPage,
      openSettingsTarget: mocks.openSettingsTarget,
      updateStatus: mocks.updateStatus
    })
}))

vi.mock('@/hooks/useShortcutLabel', () => ({
  useShortcutKeyDetails: () => ({ keys: [], doubleTap: false })
}))

vi.mock('@/hooks/useMountedRef', () => ({
  useMountedRef: () => ({ current: true })
}))

describe('SidebarSettingsHelpMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders help trigger without onboarding or milestones entries', () => {
    const markup = renderToStaticMarkup(<SidebarSettingsHelpMenu />)
    expect(markup).toContain('Settings')
    expect(markup).not.toContain('Onboarding')
    expect(markup).not.toContain('Milestones')
  })
})
