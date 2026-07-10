import { describe, expect, it } from 'vitest'
import { nextVisibleTaskProviders } from './TasksPane'

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
