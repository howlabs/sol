import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  buildReviewChangesPrompt,
  hasReviewableSourceControlChanges
} from './source-control-ai-prompts'
import { translate } from '@/i18n/i18n'
import type {
  ReviewChangesBranchContext,
  ReviewChangesUncommittedCounts
} from '../../../../shared/source-control-review-changes-prompt'

export function useSourceControlReviewChangesAi({
  activeWorktreeId,
  worktreePath,
  branchName,
  uncommittedCounts,
  branchReviewContext,
  sourceControlAiActionsVisible
}: {
  activeWorktreeId: string | null | undefined
  worktreePath: string | null
  branchName: string | null
  uncommittedCounts: ReviewChangesUncommittedCounts
  branchReviewContext: ReviewChangesBranchContext | null
  sourceControlAiActionsVisible: boolean
}): {
  reviewChangesComposerOpen: boolean
  setReviewChangesComposerOpen: (open: boolean) => void
  reviewChangesPrompt: string
  canReviewChanges: boolean
  handleReviewChangesWithAI: () => void
} {
  const [reviewChangesComposerOpen, setReviewChangesComposerOpen] = useState(false)

  const reviewChangesPrompt = useMemo(
    () =>
      buildReviewChangesPrompt({
        worktreePath,
        branchName,
        uncommitted: uncommittedCounts,
        branch: branchReviewContext
      }),
    [branchName, branchReviewContext, uncommittedCounts, worktreePath]
  )

  const canReviewChanges =
    sourceControlAiActionsVisible &&
    hasReviewableSourceControlChanges({
      uncommitted: uncommittedCounts,
      branch: branchReviewContext
    })

  const handleReviewChangesWithAI = useCallback((): void => {
    if (!activeWorktreeId) {
      return
    }
    if (
      !hasReviewableSourceControlChanges({
        uncommitted: uncommittedCounts,
        branch: branchReviewContext
      })
    ) {
      toast.message(
        translate(
          'auto.components.right.sidebar.use.source.control.ai.reviewChanges.empty',
          'No changes to review.'
        )
      )
      return
    }
    setReviewChangesComposerOpen(true)
  }, [activeWorktreeId, branchReviewContext, uncommittedCounts])

  return {
    reviewChangesComposerOpen,
    setReviewChangesComposerOpen,
    reviewChangesPrompt,
    canReviewChanges,
    handleReviewChangesWithAI
  }
}
