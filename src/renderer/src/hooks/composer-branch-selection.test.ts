import { describe, expect, it } from 'vitest'
import {
  isBranchCheckedOutInWorktrees,
  resolveComposerBranchSelection,
  resolveEffectiveBranchNameOverride,
  resolveUniqueBranchName
} from './composer-branch-selection'

describe('resolveComposerBranchSelection', () => {
  it('keeps selected remote ref as base while using the local branch name for create', () => {
    expect(
      resolveComposerBranchSelection({
        refName: 'origin/feature/something',
        localBranchName: 'feature/something',
        currentName: '',
        lastAutoName: ''
      })
    ).toEqual({
      baseBranch: 'origin/feature/something',
      autoName: 'feature/something'
    })
  })

  it('does not override a user-edited workspace name', () => {
    expect(
      resolveComposerBranchSelection({
        refName: 'origin/feature/something',
        localBranchName: 'feature/something',
        currentName: 'custom-name',
        lastAutoName: 'previous-auto'
      })
    ).toEqual({
      baseBranch: 'origin/feature/something',
      autoName: undefined
    })
  })

  it('replaces a typed branch prefix with the selected branch name', () => {
    expect(
      resolveComposerBranchSelection({
        refName: 'fix/bug-0',
        localBranchName: 'fix/bug-0',
        currentName: 'fix/bug',
        lastAutoName: ''
      })
    ).toEqual({
      baseBranch: 'fix/bug-0',
      autoName: 'fix/bug-0'
    })
  })
})

describe('isBranchCheckedOutInWorktrees', () => {
  it('matches a branch against both refs/heads-qualified and short worktree refs', () => {
    expect(
      isBranchCheckedOutInWorktrees('feature-x', ['refs/heads/main', 'refs/heads/feature-x'])
    ).toBe(true)
    expect(isBranchCheckedOutInWorktrees('feature-x', ['feature-x'])).toBe(true)
    expect(isBranchCheckedOutInWorktrees('feature-x', ['refs/heads/main', ''])).toBe(false)
    expect(isBranchCheckedOutInWorktrees('feature-x', [])).toBe(false)
  })
})

describe('resolveUniqueBranchName', () => {
  it('returns the name unchanged when no collision', () => {
    expect(resolveUniqueBranchName('feature-x', ['refs/heads/main'])).toBe('feature-x')
  })

  it('appends -2 when the branch is already checked out', () => {
    expect(resolveUniqueBranchName('feature-x', ['feature-x'])).toBe('feature-x-2')
  })

  it('increments until a free slot is found', () => {
    expect(resolveUniqueBranchName('feature-x', ['feature-x', 'feature-x-2', 'feature-x-3'])).toBe(
      'feature-x-4'
    )
  })
})

describe('resolveEffectiveBranchNameOverride', () => {
  it('keeps an explicit branch-name override', () => {
    expect(
      resolveEffectiveBranchNameOverride({
        branchNameOverride: 'feature/manual',
        workspaceName: 'edited display name'
      })
    ).toBe('feature/manual')
  })

  it('returns undefined for empty/missing override outside branch mode', () => {
    for (const branchNameOverride of [undefined, '']) {
      expect(
        resolveEffectiveBranchNameOverride({
          branchNameOverride,
          workspaceName: 'edited display name'
        })
      ).toBeUndefined()
    }
  })

  it('uses a slash-containing typed name as the create override in branch mode', () => {
    expect(
      resolveEffectiveBranchNameOverride({
        branchNameOverride: undefined,
        workspaceName: 'feature/user-profile',
        createBranchFromWorkspaceName: true
      })
    ).toBe('feature/user-profile')
  })

  it('keeps plain typed branch names on the existing sanitized-name path', () => {
    expect(
      resolveEffectiveBranchNameOverride({
        branchNameOverride: undefined,
        workspaceName: 'feature-user-profile',
        createBranchFromWorkspaceName: true
      })
    ).toBeUndefined()
  })

  it('does not preserve a slash typed name outside branch mode (gate off)', () => {
    expect(
      resolveEffectiveBranchNameOverride({
        branchNameOverride: undefined,
        workspaceName: 'feature/user-profile',
        createBranchFromWorkspaceName: false
      })
    ).toBeUndefined()
  })
})
