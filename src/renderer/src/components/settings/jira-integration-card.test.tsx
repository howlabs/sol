// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { JiraIntegrationCard } from './jira-integration-card'

type StoreState = {
  settings: { activeRuntimeEnvironmentId: string | null }
  jiraStatus: { connected: boolean; sites: unknown[] }
  jiraStatusChecked: boolean
  jiraStatusContextKey: string | null
  checkJiraConnection: ReturnType<typeof vi.fn>
  disconnectJira: ReturnType<typeof vi.fn>
  testJiraConnection: ReturnType<typeof vi.fn>
  openSettingsPage: ReturnType<typeof vi.fn>
  openSettingsTarget: ReturnType<typeof vi.fn>
}

const mocks = vi.hoisted(() => ({
  store: { current: null as StoreState | null }
}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: StoreState) => unknown) => {
    if (!mocks.store.current) {
      throw new Error('Store state was not installed')
    }
    return selector(mocks.store.current)
  }
}))

vi.mock('@/lib/provider-runtime-context', () => ({
  getProviderRuntimeContextKey: (settings: { activeRuntimeEnvironmentId: string | null }) =>
    settings.activeRuntimeEnvironmentId ?? 'local',
  hasRemoteProviderRuntime: (settings: { activeRuntimeEnvironmentId: string | null }) =>
    Boolean(settings.activeRuntimeEnvironmentId)
}))

let root: Root | null = null
let container: HTMLDivElement | null = null

describe('JiraIntegrationCard', () => {
  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }
    root = null
    container?.remove()
    container = null
    mocks.store.current = null
  })

  it('opens remote servers from the row actions', async () => {
    const openSettingsPage = vi.fn()
    const openSettingsTarget = vi.fn()
    mocks.store.current = {
      settings: { activeRuntimeEnvironmentId: 'runtime-1' },
      jiraStatus: { connected: false, sites: [] },
      jiraStatusChecked: true,
      jiraStatusContextKey: 'runtime-1',
      checkJiraConnection: vi.fn(),
      disconnectJira: vi.fn(),
      testJiraConnection: vi.fn(),
      openSettingsPage,
      openSettingsTarget
    }

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root?.render(<JiraIntegrationCard />)
    })

    expect(container.textContent).toContain('Jira')
    expect(container.textContent).toContain('Connect Jira')
    expect(container.textContent).toContain('Check again')
    expect(container.textContent).toContain('Open remote servers')

    await act(async () => {
      Array.from(container!.querySelectorAll('button'))
        .find((button) => button.textContent === 'Open remote servers')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(openSettingsPage).toHaveBeenCalledTimes(1)
    expect(openSettingsTarget).toHaveBeenCalledWith({
      pane: 'servers',
      repoId: null,
      sectionId: 'default-runtime'
    })
  })
})
