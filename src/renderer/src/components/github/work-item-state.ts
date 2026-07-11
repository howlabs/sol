import type { GitHubWorkItem } from '../../../../shared/types'

const OPEN_TONE = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
const CLOSED_PR_TONE = 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300'
const NEUTRAL_CLOSED_ISSUE_TONE = 'border-ring/50 bg-primary/10 text-foreground'

export function getStateLabel(item: GitHubWorkItem): string {
  if (item.type === 'pr') {
    if (item.state === 'merged') {
      return 'Merged'
    }
    if (item.state === 'draft') {
      return 'Draft'
    }
    if (item.state === 'closed') {
      return 'Closed'
    }
    return 'Open'
  }
  return item.state === 'closed' ? 'Closed' : 'Open'
}

export function getStateTone(item: GitHubWorkItem, options?: { closedIssueTone?: string }): string {
  if (item.type === 'pr') {
    if (item.state === 'merged') {
      return 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300'
    }
    if (item.state === 'draft') {
      return 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300'
    }
    if (item.state === 'closed') {
      return CLOSED_PR_TONE
    }
    return OPEN_TONE
  }
  if (item.state === 'closed') {
    // Why: closed issues can mean completed/resolved; keep them neutral instead
    // of using destructive red, which is reserved for PR closed-without-merge.
    // Callers that want the red tone can pass closedIssueTone.
    return options?.closedIssueTone ?? NEUTRAL_CLOSED_ISSUE_TONE
  }
  return OPEN_TONE
}
