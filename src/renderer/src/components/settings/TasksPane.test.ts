import { describe, expect, it } from 'vitest'
import { buildTaskProviderVisibilityUpdate, nextVisibleTaskProviders } from './TasksPane'

describe('nextVisibleTaskProviders', () => {
  it('turns a hidden provider on while preserving catalog order', () => {
    expect(nextVisibleTaskProviders(['github'], 'linear')).toEqual(['github', 'linear'])
  })

  it('turns a provider off when others remain', () => {
    expect(nextVisibleTaskProviders(['github', 'linear'], 'github')).toEqual(['linear'])
  })

  it('refuses to hide the last remaining provider', () => {
    expect(nextVisibleTaskProviders(['github'], 'github')).toBeNull()
  })
})

describe('buildTaskProviderVisibilityUpdate', () => {
  it('recomputes defaultTaskSource when the current default is hidden', () => {
    expect(
      buildTaskProviderVisibilityUpdate({
        visibleProviders: ['github', 'linear'],
        provider: 'linear',
        defaultTaskSource: 'linear'
      })
    ).toEqual({
      visibleTaskProviders: ['github'],
      defaultTaskSource: 'github'
    })
  })

  it('keeps defaultTaskSource when it remains visible', () => {
    expect(
      buildTaskProviderVisibilityUpdate({
        visibleProviders: ['github', 'linear'],
        provider: 'github',
        defaultTaskSource: 'linear'
      })
    ).toEqual({
      visibleTaskProviders: ['linear'],
      defaultTaskSource: 'linear'
    })
  })

  it('returns null when hiding the last provider', () => {
    expect(
      buildTaskProviderVisibilityUpdate({
        visibleProviders: ['github'],
        provider: 'github',
        defaultTaskSource: 'github'
      })
    ).toBeNull()
  })
})
