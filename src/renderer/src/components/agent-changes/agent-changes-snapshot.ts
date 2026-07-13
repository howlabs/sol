import type { GitFileStatus, GitStatusEntry } from '../../../../shared/git-status-types'
import { joinPath } from '@/lib/path'
import type {
  AgentChangedFile,
  AgentChangedFileStatus,
  AgentChangesSnapshot,
  AgentChangesSummary
} from './agent-changes-types'

export type BuildAgentChangesSnapshotInput = {
  worktreeId: string
  worktreePath: string
  runtimeEnvironmentId?: string
  revision: number
  entries: readonly GitStatusEntry[]
}

const STATUS_RANK: Record<AgentChangedFileStatus, number> = {
  conflict: 0,
  renamed: 1,
  deleted: 2,
  added: 3,
  untracked: 4,
  modified: 5
}

function mapStatus(entry: GitStatusEntry): AgentChangedFileStatus {
  if (entry.conflictStatus === 'unresolved' || entry.conflictKind) {
    return 'conflict'
  }
  switch (entry.status as GitFileStatus) {
    case 'added':
      return 'added'
    case 'deleted':
      return 'deleted'
    case 'renamed':
    case 'copied':
      return 'renamed'
    case 'untracked':
      return 'untracked'
    case 'modified':
    default:
      return 'modified'
  }
}

function preferStatus(
  a: AgentChangedFileStatus,
  b: AgentChangedFileStatus
): AgentChangedFileStatus {
  return STATUS_RANK[a] <= STATUS_RANK[b] ? a : b
}

/**
 * Collapse porcelain status rows (staged + unstaged for the same path, etc.)
 * into one panel file row per path, with summed +/- counts.
 */
export function buildAgentChangesSnapshot(
  input: BuildAgentChangesSnapshotInput
): AgentChangesSnapshot {
  const byPath = new Map<
    string,
    {
      relativePath: string
      status: AgentChangedFileStatus
      oldPath?: string
      additions: number
      deletions: number
      hasBinaryHint: boolean
    }
  >()

  for (const entry of input.entries) {
    // Why: submodule roots are SC concerns; panel focuses on regular file deltas.
    if (entry.submodule && !entry.submoduleRoot) {
      continue
    }
    const relativePath = entry.path
    if (!relativePath) {
      continue
    }
    const status = mapStatus(entry)
    const existing = byPath.get(relativePath)
    const additions = entry.added ?? 0
    const deletions = entry.removed ?? 0
    // Undefined both means binary or unavailable — do not invent zeros for summary
    // when every side is binary; track via hasBinaryHint when both undefined.
    const hasCounts = entry.added !== undefined || entry.removed !== undefined
    if (!existing) {
      byPath.set(relativePath, {
        relativePath,
        status,
        oldPath: entry.oldPath,
        additions: hasCounts ? additions : 0,
        deletions: hasCounts ? deletions : 0,
        hasBinaryHint: !hasCounts && entry.status !== 'untracked'
      })
      continue
    }
    existing.status = preferStatus(existing.status, status)
    if (entry.oldPath && !existing.oldPath) {
      existing.oldPath = entry.oldPath
    }
    if (hasCounts) {
      existing.additions += additions
      existing.deletions += deletions
      existing.hasBinaryHint = false
    }
  }

  const files: AgentChangedFile[] = [...byPath.values()]
    .map((row) => ({
      relativePath: row.relativePath,
      absolutePath: joinPath(input.worktreePath, row.relativePath),
      status: row.status,
      oldPath: row.oldPath,
      additions: row.additions,
      deletions: row.deletions,
      binary: row.hasBinaryHint && row.additions === 0 && row.deletions === 0 ? true : undefined
    }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))

  const summary = summarizeAgentChangedFiles(files)

  return {
    worktreeId: input.worktreeId,
    runtimeEnvironmentId: input.runtimeEnvironmentId,
    revision: input.revision,
    files,
    summary
  }
}

export function summarizeAgentChangedFiles(
  files: readonly Pick<AgentChangedFile, 'additions' | 'deletions'>[]
): AgentChangesSummary {
  let additions = 0
  let deletions = 0
  for (const file of files) {
    additions += file.additions
    deletions += file.deletions
  }
  return {
    files: files.length,
    additions,
    deletions
  }
}

/** Merge a loaded per-file body into an existing snapshot immutably. */
export function replaceFileInSnapshot(
  snapshot: AgentChangesSnapshot,
  nextFile: AgentChangedFile
): AgentChangesSnapshot {
  const files = snapshot.files.map((file) =>
    file.relativePath === nextFile.relativePath ? nextFile : file
  )
  return {
    ...snapshot,
    files,
    summary: summarizeAgentChangedFiles(files)
  }
}
