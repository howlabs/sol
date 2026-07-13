import { describe, expect, it } from 'vitest'
import {
  buildReviewChangesPrompt,
  hasReviewableSourceControlChanges
} from './source-control-review-changes-prompt'

describe('hasReviewableSourceControlChanges', () => {
  it('is true for uncommitted files or branch commits/files', () => {
    expect(
      hasReviewableSourceControlChanges({
        uncommitted: { stagedCount: 1, unstagedCount: 0, untrackedCount: 0 },
        branch: null
      })
    ).toBe(true)
    expect(
      hasReviewableSourceControlChanges({
        uncommitted: { stagedCount: 0, unstagedCount: 0, untrackedCount: 0 },
        branch: { baseRef: 'origin/main', commitsAhead: 2, changedFiles: 0 }
      })
    ).toBe(true)
    expect(
      hasReviewableSourceControlChanges({
        uncommitted: { stagedCount: 0, unstagedCount: 0, untrackedCount: 0 },
        branch: { baseRef: 'origin/main', commitsAhead: 0, changedFiles: 0 }
      })
    ).toBe(false)
  })
})

describe('buildReviewChangesPrompt', () => {
  it('requires findings-only read-only behavior and forbids edits', () => {
    const prompt = buildReviewChangesPrompt({
      worktreePath: '/repo/wt',
      branchName: 'feature/review',
      uncommitted: { stagedCount: 1, unstagedCount: 2, untrackedCount: 0 },
      branch: { baseRef: 'origin/main', commitsAhead: 1, changedFiles: 4 }
    })

    expect(prompt).toContain('findings only')
    expect(prompt).toContain('READ-ONLY MODE')
    expect(prompt).toContain('Do not edit')
    expect(prompt).toContain('Do not stage')
    expect(prompt).toContain('Do not push')
    expect(prompt).toContain('Do not apply fixes')
    expect(prompt).toContain('You are not authorized to modify the repository')
    expect(prompt).toContain('No code changes were made')
    expect(prompt).toContain('/repo/wt')
    expect(prompt).toContain('feature/review')
    expect(prompt).toContain('staged: 1')
    expect(prompt).toContain('unstaged: 2')
    expect(prompt).toContain('origin/main')
    expect(prompt).toContain('Prefer reviewing uncommitted changes first')
    expect(prompt).not.toMatch(/implement the fix|commit your changes/i)
  })

  it('uses branch-compare inspection when the working tree is clean', () => {
    const prompt = buildReviewChangesPrompt({
      worktreePath: null,
      branchName: null,
      uncommitted: { stagedCount: 0, unstagedCount: 0, untrackedCount: 0 },
      branch: { baseRef: 'main', commitsAhead: 3, changedFiles: 5 }
    })

    expect(prompt).toContain('Uncommitted working tree: clean')
    expect(prompt).toContain('Review commits and file changes relative to the compare base')
    expect(prompt).toContain('commits ahead: 3')
    expect(prompt).toContain('files changed: 5')
  })
})
