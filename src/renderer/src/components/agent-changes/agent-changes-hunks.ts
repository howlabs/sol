import {
  AGENT_CHANGES_HUNK_CONTEXT_LINES,
  AGENT_CHANGES_MAX_COMBINED_CHARS,
  AGENT_CHANGES_MAX_LINES_PER_SIDE,
  type AgentChangedFile,
  type AgentChangedFileStatus,
  type UnifiedHunk,
  type UnifiedHunkLine
} from './agent-changes-types'
import { computeLineEdits, type EditOp } from './agent-changes-line-diff'

export type BuildUnifiedHunksResult = {
  hunks: UnifiedHunk[]
  tooLarge: boolean
  binary: boolean
}

function splitLines(content: string): string[] {
  if (content.length === 0) {
    return []
  }
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  // Why: trailing newline produces a final empty segment; drop it so line
  // indices match common editor/git line numbering for body content.
  if (lines.length > 0 && lines.at(-1) === '') {
    lines.pop()
  }
  return lines
}

function countLinesFast(content: string): number {
  if (content.length === 0) {
    return 0
  }
  let count = 1
  for (let i = 0; i < content.length; i += 1) {
    if (content.charCodeAt(i) === 10) {
      count += 1
    }
  }
  // Match splitLines: trailing newline does not add an extra empty line.
  if (content.charCodeAt(content.length - 1) === 10) {
    count -= 1
  }
  return count
}

function exceedsSizeCaps(original: string, modified: string): boolean {
  if (original.length + modified.length > AGENT_CHANGES_MAX_COMBINED_CHARS) {
    return true
  }
  return (
    countLinesFast(original) > AGENT_CHANGES_MAX_LINES_PER_SIDE ||
    countLinesFast(modified) > AGENT_CHANGES_MAX_LINES_PER_SIDE
  )
}

/**
 * Build unified hunks from two file sides (as returned by git.diff IPC).
 * Pure: no Monaco, no I/O. Large inputs return tooLarge without hunks.
 */
export function buildUnifiedHunksFromSides(
  originalContent: string,
  modifiedContent: string,
  options?: { binary?: boolean; contextLines?: number }
): BuildUnifiedHunksResult {
  if (options?.binary) {
    return { hunks: [], tooLarge: false, binary: true }
  }
  if (exceedsSizeCaps(originalContent, modifiedContent)) {
    return { hunks: [], tooLarge: true, binary: false }
  }

  const originalLines = splitLines(originalContent)
  const modifiedLines = splitLines(modifiedContent)
  const edits = computeLineEdits(originalLines, modifiedLines)
  const contextLines = options?.contextLines ?? AGENT_CHANGES_HUNK_CONTEXT_LINES
  const hunks = groupEditsIntoHunks(edits, contextLines)
  return { hunks, tooLarge: false, binary: false }
}

function groupEditsIntoHunks(edits: EditOp[], contextLines: number): UnifiedHunk[] {
  if (edits.length === 0) {
    return []
  }
  const isChange = edits.map((e) => e.type !== 'equal')
  if (!isChange.some(Boolean)) {
    return []
  }

  type Range = { start: number; end: number }
  const changeRanges: Range[] = []
  let changeStart = -1
  for (let i = 0; i < edits.length; i += 1) {
    if (isChange[i]) {
      if (changeStart === -1) {
        changeStart = i
      }
    } else if (changeStart !== -1) {
      changeRanges.push({ start: changeStart, end: i - 1 })
      changeStart = -1
    }
  }
  if (changeStart !== -1) {
    changeRanges.push({ start: changeStart, end: edits.length - 1 })
  }

  const expanded: Range[] = []
  for (const range of changeRanges) {
    const start = Math.max(0, range.start - contextLines)
    const end = Math.min(edits.length - 1, range.end + contextLines)
    const last = expanded.at(-1)
    if (last && start <= last.end + 1) {
      last.end = Math.max(last.end, end)
    } else {
      expanded.push({ start, end })
    }
  }

  return expanded.map((range) => buildHunkFromEditRange(edits, range.start, range.end))
}

function buildHunkFromEditRange(edits: EditOp[], start: number, end: number): UnifiedHunk {
  const lines: UnifiedHunkLine[] = []
  let oldStart = 0
  let newStart = 0
  let oldCount = 0
  let newCount = 0
  let started = false

  for (let i = start; i <= end; i += 1) {
    const edit = edits[i]!
    if (!started) {
      if (edit.type === 'equal') {
        oldStart = edit.oldIndex + 1
        newStart = edit.newIndex + 1
      } else if (edit.type === 'del') {
        oldStart = edit.oldIndex + 1
        newStart = findNewStartForDelete(edits, i)
      } else {
        newStart = edit.newIndex + 1
        oldStart = findOldStartForInsert(edits, i)
      }
      started = true
    }

    if (edit.type === 'equal') {
      lines.push({
        kind: 'context',
        text: edit.text,
        oldLine: edit.oldIndex + 1,
        newLine: edit.newIndex + 1
      })
      oldCount += 1
      newCount += 1
    } else if (edit.type === 'del') {
      lines.push({ kind: 'del', text: edit.text, oldLine: edit.oldIndex + 1 })
      oldCount += 1
    } else {
      lines.push({ kind: 'add', text: edit.text, newLine: edit.newIndex + 1 })
      newCount += 1
    }
  }

  if (oldCount === 0) {
    oldStart = 0
  }
  if (newCount === 0) {
    newStart = 0
  }

  return {
    header: `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`,
    lines
  }
}

function findNewStartForDelete(edits: EditOp[], index: number): number {
  for (let k = index - 1; k >= 0; k -= 1) {
    const prev = edits[k]!
    if (prev.type === 'equal' || prev.type === 'add') {
      return prev.newIndex + 2
    }
  }
  return 0
}

function findOldStartForInsert(edits: EditOp[], index: number): number {
  for (let k = index - 1; k >= 0; k -= 1) {
    const prev = edits[k]!
    if (prev.type === 'equal' || prev.type === 'del') {
      return prev.oldIndex + 2
    }
  }
  return 0
}

export type DiffBodyInput = {
  kind: 'text' | 'binary'
  originalContent: string
  modifiedContent: string
}

export type FileBaseForDiff = {
  relativePath: string
  absolutePath: string
  status: AgentChangedFileStatus
  oldPath?: string
  additions: number
  deletions: number
}

/** Attach hunk payload onto a file entry from a GitDiffResult-like body. */
export function applyDiffBodyToFile(file: FileBaseForDiff, body: DiffBodyInput): AgentChangedFile {
  if (body.kind === 'binary') {
    return { ...file, binary: true, hunks: undefined, tooLarge: false }
  }
  const result = buildUnifiedHunksFromSides(body.originalContent, body.modifiedContent)
  if (result.binary) {
    return { ...file, binary: true, hunks: undefined, tooLarge: false }
  }
  if (result.tooLarge) {
    return { ...file, tooLarge: true, hunks: undefined, binary: false }
  }
  return {
    ...file,
    binary: false,
    tooLarge: false,
    hunks: result.hunks
  }
}
