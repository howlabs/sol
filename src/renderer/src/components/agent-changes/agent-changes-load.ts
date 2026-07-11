import type { GitDiffResult, GitStatusEntry } from '../../../../shared/types'
import { getConnectionId } from '@/lib/connection-context'
import { getSettingsForWorktreeRuntimeOwner } from '@/lib/worktree-runtime-owner'
import {
  discardRuntimeGitPath,
  getRuntimeGitDiff,
  getRuntimeGitStatus
} from '@/runtime/runtime-git-client'
import {
  notifyEditorExternalFileChange,
  requestEditorSaveQuiesce
} from '@/components/editor/editor-autosave'
import { useAppStore } from '@/store'
import { applyDiffBodyToFile } from './agent-changes-hunks'
import { buildAgentChangesSnapshot, replaceFileInSnapshot } from './agent-changes-snapshot'
import type { AgentChangedFile, AgentChangesSnapshot } from './agent-changes-types'

export type AgentChangesLoadContext = {
  worktreeId: string
  worktreePath: string
}

function runtimeContext(worktreeId: string, worktreePath: string) {
  const state = useAppStore.getState()
  const settings = getSettingsForWorktreeRuntimeOwner(state, worktreeId)
  const connectionId = getConnectionId(worktreeId) ?? undefined
  return {
    settings,
    worktreeId,
    worktreePath,
    connectionId
  }
}

export async function loadAgentChangesStatusSnapshot(
  context: AgentChangesLoadContext,
  revision: number
): Promise<AgentChangesSnapshot> {
  const gitContext = runtimeContext(context.worktreeId, context.worktreePath)
  const status = await getRuntimeGitStatus(gitContext)
  const runtimeEnvironmentId =
    useAppStore.getState().settings?.activeRuntimeEnvironmentId?.trim() || undefined
  return buildAgentChangesSnapshot({
    worktreeId: context.worktreeId,
    worktreePath: context.worktreePath,
    runtimeEnvironmentId,
    revision,
    entries: status.entries as GitStatusEntry[]
  })
}

/**
 * Prefer working-tree vs HEAD so staged+unstaged both appear as "agent outcome".
 * Falls back to unstaged then staged for older paths.
 */
export async function loadAgentChangedFileBody(
  context: AgentChangesLoadContext,
  file: AgentChangedFile
): Promise<AgentChangedFile> {
  const gitContext = runtimeContext(context.worktreeId, context.worktreePath)

  if (file.status === 'untracked') {
    const body = await getRuntimeGitDiff(gitContext, {
      filePath: file.relativePath,
      staged: false,
      compareAgainstHead: true
    }).catch(async () => {
      // Untracked may only be readable as working-tree blob with empty original.
      return getRuntimeGitDiff(gitContext, {
        filePath: file.relativePath,
        staged: false
      })
    })
    return applyDiffBodyToFile(file, toDiffBody(body))
  }

  try {
    const againstHead = await getRuntimeGitDiff(gitContext, {
      filePath: file.relativePath,
      staged: false,
      compareAgainstHead: true
    })
    return applyDiffBodyToFile(file, toDiffBody(againstHead))
  } catch {
    try {
      const unstaged = await getRuntimeGitDiff(gitContext, {
        filePath: file.relativePath,
        staged: false
      })
      return applyDiffBodyToFile(file, toDiffBody(unstaged))
    } catch {
      const staged = await getRuntimeGitDiff(gitContext, {
        filePath: file.relativePath,
        staged: true
      })
      return applyDiffBodyToFile(file, toDiffBody(staged))
    }
  }
}

function toDiffBody(result: GitDiffResult): {
  kind: 'text' | 'binary'
  originalContent: string
  modifiedContent: string
} {
  if (result.kind === 'binary') {
    return {
      kind: 'binary',
      originalContent: result.originalContent,
      modifiedContent: result.modifiedContent
    }
  }
  return {
    kind: 'text',
    originalContent: result.originalContent,
    modifiedContent: result.modifiedContent
  }
}

export async function loadFileBodyIntoSnapshot(
  context: AgentChangesLoadContext,
  snapshot: AgentChangesSnapshot,
  relativePath: string
): Promise<AgentChangesSnapshot> {
  const file = snapshot.files.find((row) => row.relativePath === relativePath)
  if (!file) {
    return snapshot
  }
  const nextFile = await loadAgentChangedFileBody(context, file)
  return replaceFileInSnapshot(snapshot, nextFile)
}

export async function discardAgentChangedFile(
  context: AgentChangesLoadContext,
  relativePath: string
): Promise<void> {
  const runtimeEnvironmentId =
    useAppStore.getState().settings?.activeRuntimeEnvironmentId?.trim() || null
  // Why: git discard replaces the working tree; quiesce autosave first so a
  // delayed write cannot recreate discarded edits.
  await requestEditorSaveQuiesce({
    worktreeId: context.worktreeId,
    worktreePath: context.worktreePath,
    relativePath,
    runtimeEnvironmentId
  })
  const gitContext = runtimeContext(context.worktreeId, context.worktreePath)
  await discardRuntimeGitPath(gitContext, relativePath)
  notifyEditorExternalFileChange({
    worktreeId: context.worktreeId,
    worktreePath: context.worktreePath,
    relativePath,
    runtimeEnvironmentId
  })
}
