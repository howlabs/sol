// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LinearIntegrationCard } from './task-tracker-integration-cards'

type LinearWorkspace = {
  id: string
  organizationName: string
  displayName: string
  email: string | null
}

type StoreState = {
  settings: { activeRuntimeEnvironmentId: string | null }
  linearStatus: { connected: boolean; workspaces: LinearWorkspace[] }
  linearStatusChecked: boolean
  linearStatusContextKey: string | null
  disconnectLinear: ReturnType<typeof vi.fn>
  disconnectLinearWorkspace: ReturnType<typeof vi.fn>
  checkLinearConnection: ReturnType<typeof vi.fn>
  testLinearConnection: ReturnType<typeof vi.fn>
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
    settings.activeRuntimeEnvironmentId ?? 'local'
}))

let root: Root | null = null
let container: HTMLDivElement | null = null

function installStore(
  connected: boolean,
  settings?: { activeRuntimeEnvironmentId: string | null }
) {
  const activeRuntimeEnvironmentId = settings?.activeRuntimeEnvironmentId ?? null
  const state: StoreState = {
    settings: { activeRuntimeEnvironmentId },
    linearStatus: {
      connected,
      workspaces: connected
        ? [
            {
              id: 'ws-1',
              organizationName: 'Acme',
              displayName: 'Acme',
              email: 'a@b.c'
            }
          ]
        : []
    },
    linearStatusChecked: true,
    linearStatusContextKey: activeRuntimeEnvironmentId ?? 'local',
    disconnectLinear: vi.fn(),
    disconnectLinearWorkspace: vi.fn(),
    checkLinearConnection: vi.fn(),
    testLinearConnection: vi.fn().mockResolvedValue({ ok: true }),
    openSettingsPage: vi.fn(),
    openSettingsTarget: vi.fn()
  }
  mocks.store.current = state
  return state
}

async function renderCard(): Promise<HTMLDivElement> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root?.render(<LinearIntegrationCard />)
  })
  return container
}

describe('LinearIntegrationCard', () => {
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

  it('shows connect, check, and remote servers when disconnected', async () => {
    const state = installStore(false)
    const rendered = await renderCard()

    expect(rendered.textContent).toContain('Linear')
    expect(rendered.textContent).toContain('Not connected')
    expect(rendered.textContent).toContain('Connect Linear')
    expect(rendered.textContent).toContain('Check again')
    expect(rendered.textContent).toContain('Open remote servers')

    await act(async () => {
      Array.from(rendered.querySelectorAll('button'))
        .find((button) => button.textContent === 'Check again')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(state.checkLinearConnection).toHaveBeenCalledWith(true)
  })

  it('lists workspaces with test when connected', async () => {
    installStore(true, { activeRuntimeEnvironmentId: 'runtime-1' })
    const rendered = await renderCard()

    expect(rendered.textContent).toContain('Connected')
    expect(rendered.textContent).toContain('Acme')
    expect(rendered.textContent).toContain('Test')
    expect(rendered.textContent).toContain('Add workspace')
  })
})
