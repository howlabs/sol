export type WorktreeBaseRefExists = (qualifiedRef: string) => Promise<boolean>

// Why: "fresh" resolves to origin/HEAD (Claude Code style); "head" uses local
// HEAD. Arbitrary refs pass through unchanged for PR/hosted-review start points.
export async function resolveWorktreeAddBaseRef(
  baseRef: string,
  refExists: WorktreeBaseRefExists
): Promise<string> {
  if (baseRef === 'fresh') {
    return (await refExists('refs/remotes/origin/HEAD')) ? 'refs/remotes/origin/HEAD' : 'HEAD'
  }
  if (baseRef === 'head') {
    return 'HEAD'
  }
  return baseRef
}
