import { describe, expect, it } from 'vitest'

import type { PRCheckDetail } from '../../../../shared/types'

import {
  CHECK_SORT_ORDER,
  formatCheckTimestamp,
  getCheckConclusion,
  getCheckCounts,
  getCheckDetailsKey,
  getChecksSummaryLabel,
  getCheckStatusLabel
} from './pr-check-status'

function makeCheck(overrides: Partial<PRCheckDetail> = {}): PRCheckDetail {
  return {
    name: 'CI',
    status: 'completed',
    conclusion: 'success',
    url: 'https://example.com',
    checkRunId: 1,
    ...overrides
  }
}

describe('pr-check-helpers', () => {
  describe('getCheckConclusion', () => {
    it('returns the conclusion when present', () => {
      expect(getCheckConclusion(makeCheck({ conclusion: 'failure' }))).toBe('failure')
    })

    it('defaults to pending when conclusion is null', () => {
      expect(getCheckConclusion(makeCheck({ conclusion: null }))).toBe('pending')
    })
  })

  describe('getCheckStatusLabel', () => {
    it('maps each conclusion to a human label', () => {
      const cases: [PRCheckDetail['conclusion'], string][] = [
        ['success', 'Successful'],
        ['failure', 'Failed'],
        ['cancelled', 'Cancelled'],
        ['timed_out', 'Timed out'],
        ['action_required', 'Action required'],
        ['neutral', 'Neutral'],
        ['skipped', 'Skipped']
      ]
      for (const [conclusion, expected] of cases) {
        expect(getCheckStatusLabel(makeCheck({ conclusion }))).toBe(expected)
      }
    })

    it('maps in-progress status', () => {
      expect(getCheckStatusLabel(makeCheck({ status: 'in_progress', conclusion: null }))).toBe(
        'In progress'
      )
    })

    it('maps queued status', () => {
      expect(getCheckStatusLabel(makeCheck({ status: 'queued', conclusion: null }))).toBe('Queued')
    })

    it('falls back to Pending', () => {
      expect(getCheckStatusLabel(makeCheck({ status: 'completed', conclusion: null }))).toBe(
        'Pending'
      )
    })
  })

  describe('getCheckCounts', () => {
    it('counts each category', () => {
      const checks: PRCheckDetail[] = [
        makeCheck({ conclusion: 'success' }),
        makeCheck({ conclusion: 'success' }),
        makeCheck({ conclusion: 'failure' }),
        makeCheck({ conclusion: 'action_required' }),
        makeCheck({ conclusion: 'skipped' }),
        makeCheck({ conclusion: 'neutral' }),
        makeCheck({ conclusion: null })
      ]
      expect(getCheckCounts(checks)).toEqual({
        passing: 2,
        failing: 1,
        needsAction: 1,
        pending: 1,
        skipped: 1,
        neutral: 1
      })
    })

    it('counts timed_out and cancelled as failing', () => {
      const checks: PRCheckDetail[] = [
        makeCheck({ conclusion: 'timed_out' }),
        makeCheck({ conclusion: 'cancelled' })
      ]
      expect(getCheckCounts(checks).failing).toBe(2)
    })
  })

  describe('getChecksSummaryLabel', () => {
    it('returns no checks message for empty array', () => {
      expect(getChecksSummaryLabel([])).toBe('No checks found')
    })

    it('reports failing count', () => {
      expect(getChecksSummaryLabel([makeCheck({ conclusion: 'failure' })])).toBe('1 check failing')
    })

    it('reports all passing', () => {
      expect(getChecksSummaryLabel([makeCheck({ conclusion: 'success' })])).toBe(
        'All checks passing'
      )
    })
  })

  describe('getCheckDetailsKey', () => {
    it('uses checkRunId first', () => {
      expect(
        getCheckDetailsKey(makeCheck({ checkRunId: 42, workflowRunId: 99, url: 'u', name: 'n' }))
      ).toBe('42')
    })

    it('falls back to name', () => {
      expect(
        getCheckDetailsKey(
          makeCheck({ checkRunId: undefined, workflowRunId: undefined, url: null, name: 'CI' })
        )
      ).toBe('CI')
    })
  })

  describe('formatCheckTimestamp', () => {
    it('returns null for falsy input', () => {
      expect(formatCheckTimestamp(null)).toBeNull()
      expect(formatCheckTimestamp(undefined)).toBeNull()
    })

    it('returns null for invalid date', () => {
      expect(formatCheckTimestamp('not-a-date')).toBeNull()
    })

    it('formats a valid date', () => {
      const result = formatCheckTimestamp('2025-01-15T10:30:00Z')
      expect(result).not.toBeNull()
      expect(typeof result).toBe('string')
    })
  })

  describe('CHECK_SORT_ORDER', () => {
    it('ranks failure before success', () => {
      expect(CHECK_SORT_ORDER.failure).toBeLessThan(CHECK_SORT_ORDER.success)
    })
  })
})
