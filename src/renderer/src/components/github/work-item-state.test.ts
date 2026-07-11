import { describe, expect, it } from 'vitest'

import type { GitHubWorkItem } from '../../../../shared/types'

import { getStateLabel, getStateTone } from './work-item-state'

function makeItem(overrides: Partial<GitHubWorkItem> = {}): GitHubWorkItem {
  return {
    id: '1',
    type: 'issue',
    number: 1,
    title: 'Test',
    state: 'open',
    url: 'https://github.com/owner/repo/issues/1',
    labels: [],
    updatedAt: '2025-01-01T00:00:00Z',
    author: null,
    repoId: 'owner/repo',
    ...overrides
  }
}

describe('work-item-state-helpers', () => {
  describe('getStateLabel', () => {
    it('returns Merged for merged PR', () => {
      expect(getStateLabel(makeItem({ type: 'pr', state: 'merged' }))).toBe('Merged')
    })

    it('returns Draft for draft PR', () => {
      expect(getStateLabel(makeItem({ type: 'pr', state: 'draft' }))).toBe('Draft')
    })

    it('returns Closed for closed PR', () => {
      expect(getStateLabel(makeItem({ type: 'pr', state: 'closed' }))).toBe('Closed')
    })

    it('returns Open for open PR', () => {
      expect(getStateLabel(makeItem({ type: 'pr', state: 'open' }))).toBe('Open')
    })

    it('returns Closed for closed issue', () => {
      expect(getStateLabel(makeItem({ type: 'issue', state: 'closed' }))).toBe('Closed')
    })

    it('returns Open for open issue', () => {
      expect(getStateLabel(makeItem({ type: 'issue', state: 'open' }))).toBe('Open')
    })
  })

  describe('getStateTone', () => {
    const CLOSED_ISSUE_NEUTRAL_TONE = 'border-ring/50 bg-primary/10 text-foreground'
    const CLOSED_ISSUE_RED_TONE =
      'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300'

    it('returns purple tone for merged PR', () => {
      expect(getStateTone(makeItem({ type: 'pr', state: 'merged' }))).toContain('purple')
    })

    it('returns slate tone for draft PR', () => {
      expect(getStateTone(makeItem({ type: 'pr', state: 'draft' }))).toContain('slate')
    })

    it('returns rose tone for closed PR', () => {
      expect(getStateTone(makeItem({ type: 'pr', state: 'closed' }))).toContain('rose')
    })

    it('returns emerald tone for open PR', () => {
      expect(getStateTone(makeItem({ type: 'pr', state: 'open' }))).toContain('emerald')
    })

    it('uses neutral tone for closed issue by default', () => {
      expect(getStateTone(makeItem({ type: 'issue', state: 'closed' }))).toBe(
        CLOSED_ISSUE_NEUTRAL_TONE
      )
    })

    it('uses red tone for closed issue when closedIssueTone is red', () => {
      expect(
        getStateTone(makeItem({ type: 'issue', state: 'closed' }), {
          closedIssueTone: CLOSED_ISSUE_RED_TONE
        })
      ).toBe(CLOSED_ISSUE_RED_TONE)
    })

    it('returns emerald tone for open issue', () => {
      expect(getStateTone(makeItem({ type: 'issue', state: 'open' }))).toContain('emerald')
    })
  })
})
