import { describe, expect, it, vi } from 'vitest'

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string) => fallback
}))

vi.mock('@/i18n/localized-catalog', () => ({
  createLocalizedCatalog:
    <T>(loader: () => T) =>
    () =>
      loader()
}))

vi.mock('./settings-search-keywords', () => ({
  translateSearchKeyword: (_key: string, fallback: string) => [fallback]
}))

import { getStatusBarToggles } from './appearance-status-bar-search'

describe('getStatusBarToggles', () => {
  it('includes MiniMax usage so Appearance can toggle the default-on status item', () => {
    const miniMaxToggle = getStatusBarToggles().find((entry) => entry.id === 'minimax')

    expect(miniMaxToggle).toMatchObject({
      title: 'MiniMax Usage',
      description: 'Show MiniMax subscription usage in the status bar.',
      toggleDescription: 'Show MiniMax subscription usage for the active workspace.'
    })
    expect(miniMaxToggle?.keywords).toEqual(
      expect.arrayContaining(['status bar', 'minimax', 'usage', 'subscription', 'cookie'])
    )
  })

  it('includes Grok usage so Appearance can toggle the default-on status item', () => {
    const grokToggle = getStatusBarToggles().find((entry) => entry.id === 'grok')

    expect(grokToggle).toMatchObject({
      title: 'Grok Usage',
      description: 'Show Grok weekly credit usage from Grok CLI OAuth.',
      toggleDescription: 'Show Grok subscription credit usage when signed in via Grok CLI.'
    })
    expect(grokToggle?.keywords).toEqual(
      expect.arrayContaining(['status bar', 'grok', 'xai', 'usage', 'subscription'])
    )
  })
})
