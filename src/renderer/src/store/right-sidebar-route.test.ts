import { describe, expect, it } from 'vitest'
import { normalizeRightSidebarRoute } from './right-sidebar-route'

describe('normalizeRightSidebarRoute', () => {
  it('preserves the folder-only PR Checks route', () => {
    expect(normalizeRightSidebarRoute('pr-checks')).toEqual({
      rightSidebarTab: 'pr-checks',
      rightSidebarExplorerView: 'files'
    })
  })

  it('maps the removed Changes activity onto Source Control', () => {
    expect(normalizeRightSidebarRoute('agent-changes')).toEqual({
      rightSidebarTab: 'source-control',
      rightSidebarExplorerView: 'files'
    })
  })

  it('still normalizes invalid tabs to Explorer files', () => {
    expect(normalizeRightSidebarRoute('missing')).toEqual({
      rightSidebarTab: 'explorer',
      rightSidebarExplorerView: 'files'
    })
  })
})
