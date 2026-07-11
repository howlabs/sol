import type { PRCheckDetail } from '../../../../shared/types'

export const CHECK_SORT_ORDER: Record<string, number> = {
  failure: 0,
  timed_out: 0,
  action_required: 0,
  cancelled: 1,
  pending: 2,
  neutral: 3,
  skipped: 4,
  success: 5
}

export function getCheckConclusion(check: PRCheckDetail): NonNullable<PRCheckDetail['conclusion']> {
  return check.conclusion ?? 'pending'
}

export function getCheckStatusLabel(check: PRCheckDetail): string {
  const conclusion = getCheckConclusion(check)
  if (conclusion === 'success') {
    return 'Successful'
  }
  if (conclusion === 'failure') {
    return 'Failed'
  }
  if (conclusion === 'cancelled') {
    return 'Cancelled'
  }
  if (conclusion === 'timed_out') {
    return 'Timed out'
  }
  if (conclusion === 'action_required') {
    return 'Action required'
  }
  if (conclusion === 'neutral') {
    return 'Neutral'
  }
  if (conclusion === 'skipped') {
    return 'Skipped'
  }
  if (check.status === 'queued') {
    return 'Queued'
  }
  if (check.status === 'in_progress') {
    return 'In progress'
  }
  return 'Pending'
}

export function getCheckCounts(checks: PRCheckDetail[]): {
  passing: number
  failing: number
  needsAction: number
  pending: number
  skipped: number
  neutral: number
} {
  return checks.reduce(
    (counts, check) => {
      const conclusion = getCheckConclusion(check)
      if (conclusion === 'success') {
        counts.passing += 1
      } else if (conclusion === 'action_required') {
        counts.needsAction += 1
      } else if (['failure', 'cancelled', 'timed_out'].includes(conclusion)) {
        counts.failing += 1
      } else if (conclusion === 'skipped') {
        counts.skipped += 1
      } else if (conclusion === 'neutral') {
        counts.neutral += 1
      } else {
        counts.pending += 1
      }
      return counts
    },
    { passing: 0, failing: 0, needsAction: 0, pending: 0, skipped: 0, neutral: 0 }
  )
}

export function getChecksSummaryLabel(checks: PRCheckDetail[]): string {
  const counts = getCheckCounts(checks)
  if (checks.length === 0) {
    return 'No checks found'
  }
  if (counts.failing > 0) {
    return `${counts.failing} ${counts.failing === 1 ? 'check' : 'checks'} failing`
  }
  // Why: action_required (e.g. a workflow awaiting approval) blocks merge but is
  // not a failure; call it out distinctly so users know a manual step is needed.
  if (counts.needsAction > 0) {
    return `${counts.needsAction} ${counts.needsAction === 1 ? 'check needs' : 'checks need'} action`
  }
  if (counts.pending > 0) {
    return `${counts.pending} ${counts.pending === 1 ? 'check' : 'checks'} pending`
  }
  if (counts.passing === checks.length) {
    return 'All checks passing'
  }
  return `${counts.passing} of ${checks.length} checks passing`
}

export function getCheckDetailsKey(check: PRCheckDetail): string {
  return String(check.checkRunId ?? check.workflowRunId ?? check.url ?? check.name)
}

export function formatCheckTimestamp(input: string | null | undefined): string | null {
  if (!input) {
    return null
  }
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
