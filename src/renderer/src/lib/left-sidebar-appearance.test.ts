import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { getDefaultSettings } from '../../../shared/constants'
import { resolveLeftSidebarStyleVariables } from './left-sidebar-appearance'

function settings(overrides = {}) {
  return {
    ...getDefaultSettings(tmpdir()),
    ...overrides
  }
}

describe('resolveLeftSidebarStyleVariables', () => {
  it('leaves the default sidebar token surface untouched', () => {
    expect(resolveLeftSidebarStyleVariables(settings(), true)).toBeUndefined()
  })

  it('matches terminal background, foreground, and scoped text tokens', () => {
    const vars = resolveLeftSidebarStyleVariables(
      settings({
        leftSidebarAppearanceMode: 'match-terminal',
        terminalThemeDark: 'Orca Dark'
      }),
      true
    )

    expect(vars).toBeDefined()
    expect(vars?.['--worktree-sidebar']).toBeTruthy()
    expect(vars?.['--worktree-sidebar-foreground']).toBeTruthy()
    expect(vars?.['--sidebar']).toBe(vars?.['--worktree-sidebar'])
    expect(vars?.['--sidebar-foreground']).toBe(vars?.['--worktree-sidebar-foreground'])
    expect(vars?.['--background']).toBe(vars?.['--worktree-sidebar'])
    expect(vars?.['--foreground']).toBe(vars?.['--worktree-sidebar-foreground'])
  })

  it('honors terminal background opacity for matched terminal surfaces', () => {
    const baseVars = resolveLeftSidebarStyleVariables(
      settings({
        leftSidebarAppearanceMode: 'match-terminal',
        terminalThemeDark: 'Orca Dark'
      }),
      true
    )
    const opaqueBackground = baseVars?.['--worktree-sidebar'] ?? '#000000'

    const vars = resolveLeftSidebarStyleVariables(
      settings({
        leftSidebarAppearanceMode: 'match-terminal',
        terminalThemeDark: 'Orca Dark',
        terminalBackgroundOpacity: 0.5
      }),
      true
    )

    expect(vars?.['--worktree-sidebar']).toContain('rgba(')
    expect(vars?.['--worktree-sidebar']).toContain('0.5')
    expect(vars?.['--worktree-sidebar']).not.toBe(opaqueBackground)
  })
})
