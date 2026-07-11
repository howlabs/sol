export type AgentChangedFileStatus =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'untracked'
  | 'conflict'

export type UnifiedHunkLineKind = 'context' | 'add' | 'del'

export type UnifiedHunkLine = {
  kind: UnifiedHunkLineKind
  text: string
  oldLine?: number
  newLine?: number
}

export type UnifiedHunk = {
  header: string
  lines: UnifiedHunkLine[]
}

export type AgentChangedFile = {
  relativePath: string
  absolutePath: string
  status: AgentChangedFileStatus
  oldPath?: string
  additions: number
  deletions: number
  binary?: boolean
  tooLarge?: boolean
  hunks?: UnifiedHunk[]
}

export type AgentChangesSummary = {
  files: number
  additions: number
  deletions: number
}

export type AgentChangesSnapshot = {
  worktreeId: string
  runtimeEnvironmentId?: string
  revision: number
  files: AgentChangedFile[]
  summary: AgentChangesSummary
}

/** Caps for building in-panel unified hunks from original/modified sides.
 * Line cap keeps LCS DP memory bounded (~few MB max). */
export const AGENT_CHANGES_MAX_LINES_PER_SIDE = 2_000
export const AGENT_CHANGES_MAX_COMBINED_CHARS = 400_000
export const AGENT_CHANGES_HUNK_CONTEXT_LINES = 3
