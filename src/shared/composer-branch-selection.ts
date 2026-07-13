export type ComposerBranchSelection = {
  baseBranch: string
  autoName: string | undefined
}

export function resolveComposerBranchSelection(args: {
  refName: string
  localBranchName: string
  currentName: string
  lastAutoName: string
}): ComposerBranchSelection {
  const trimmedCurrentName = args.currentName.trim()
  const shouldAutoName =
    !trimmedCurrentName ||
    args.currentName === args.lastAutoName ||
    args.localBranchName.startsWith(trimmedCurrentName) ||
    args.refName.startsWith(trimmedCurrentName)
  if (!shouldAutoName) {
    return { baseBranch: args.refName, autoName: undefined }
  }
  return { baseBranch: args.refName, autoName: args.localBranchName }
}

/**
 * True when `branchName` is already checked out in one of the given worktree
 * branch refs (which may be `refs/heads/foo` or short `foo`). Git refuses to
 * check out a branch in two worktrees, so such a branch cannot be reused.
 */
export function isBranchCheckedOutInWorktrees(
  branchName: string,
  worktreeBranches: readonly string[]
): boolean {
  return worktreeBranches.some((ref) => ref.replace(/^refs\/heads\//, '') === branchName)
}

/**
 * Append `-2`, `-3`, … when `branchName` is already checked out in another
 * worktree, so the generated name never collides with an existing worktree branch.
 */
export function resolveUniqueBranchName(
  branchName: string,
  worktreeBranches: readonly string[]
): string {
  if (!isBranchCheckedOutInWorktrees(branchName, worktreeBranches)) {
    return branchName
  }
  // ponytail: unbounded loop, cap at 1000 if throughput matters
  for (let i = 2; i < 1000; i++) {
    const candidate = `${branchName}-${i}`
    if (!isBranchCheckedOutInWorktrees(candidate, worktreeBranches)) {
      return candidate
    }
  }
  return `${branchName}-1000`
}

/**
 * The branch-name override to apply when creating a worktree. With no override,
 * branch mode keeps a slash-containing typed name as the git branch; every other
 * mode leaves the branch to be derived from the sanitized workspace name.
 */
export function resolveEffectiveBranchNameOverride(args: {
  branchNameOverride: string | undefined
  workspaceName: string
  createBranchFromWorkspaceName?: boolean
}): string | undefined {
  if (args.branchNameOverride) {
    return args.branchNameOverride
  }
  return args.createBranchFromWorkspaceName && args.workspaceName.includes('/')
    ? args.workspaceName
    : undefined
}
