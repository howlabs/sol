import { describe, expect, it } from 'vitest'
import type { GitStatusEntry } from '../../../../shared/git-status-types'
import { applyDiffBodyToFile, buildUnifiedHunksFromSides } from './agent-changes-hunks'
import { buildAgentChangesAskAgentPrompt } from './agent-changes-ask-agent'
import {
  buildAgentChangesSnapshot,
  replaceFileInSnapshot,
  summarizeAgentChangedFiles
} from './agent-changes-snapshot'
import { AGENT_CHANGES_MAX_LINES_PER_SIDE, type AgentChangedFile } from './agent-changes-types'

function entry(
  partial: Partial<GitStatusEntry> & Pick<GitStatusEntry, 'path' | 'status'>
): GitStatusEntry {
  return {
    area: partial.area ?? (partial.status === 'untracked' ? 'untracked' : 'unstaged'),
    ...partial
  }
}

describe('buildAgentChangesSnapshot', () => {
  it('builds file list and summary from modified/added/deleted/renamed/untracked entries', () => {
    const snapshot = buildAgentChangesSnapshot({
      worktreeId: 'wt-1',
      worktreePath: '/repo',
      revision: 3,
      entries: [
        entry({ path: 'src/a.ts', status: 'modified', added: 2, removed: 1 }),
        entry({ path: 'src/b.ts', status: 'added', area: 'staged', added: 10, removed: 0 }),
        entry({ path: 'src/c.ts', status: 'deleted', added: 0, removed: 4 }),
        entry({
          path: 'src/d-new.ts',
          status: 'renamed',
          oldPath: 'src/d-old.ts',
          added: 1,
          removed: 1
        }),
        entry({ path: 'scratch.txt', status: 'untracked', area: 'untracked', added: 5 })
      ]
    })

    expect(snapshot.worktreeId).toBe('wt-1')
    expect(snapshot.revision).toBe(3)
    expect(snapshot.files.map((f) => f.relativePath)).toEqual([
      'scratch.txt',
      'src/a.ts',
      'src/b.ts',
      'src/c.ts',
      'src/d-new.ts'
    ])
    expect(snapshot.files.find((f) => f.relativePath === 'src/a.ts')).toMatchObject({
      absolutePath: '/repo/src/a.ts',
      status: 'modified',
      additions: 2,
      deletions: 1
    })
    expect(snapshot.files.find((f) => f.relativePath === 'src/d-new.ts')).toMatchObject({
      status: 'renamed',
      oldPath: 'src/d-old.ts'
    })
    expect(snapshot.files.find((f) => f.relativePath === 'scratch.txt')?.status).toBe('untracked')
    expect(snapshot.summary).toEqual({
      files: 5,
      additions: 2 + 10 + 0 + 1 + 5,
      deletions: 1 + 0 + 4 + 1 + 0
    })
  })

  it('collapses staged+unstaged rows for the same path and prefers conflict status', () => {
    const snapshot = buildAgentChangesSnapshot({
      worktreeId: 'wt-1',
      worktreePath: '/repo',
      revision: 1,
      entries: [
        entry({ path: 'f.ts', status: 'modified', area: 'staged', added: 1, removed: 0 }),
        entry({ path: 'f.ts', status: 'modified', area: 'unstaged', added: 2, removed: 3 }),
        entry({
          path: 'conflict.ts',
          status: 'modified',
          conflictKind: 'both_modified',
          conflictStatus: 'unresolved'
        })
      ]
    })

    const f = snapshot.files.find((row) => row.relativePath === 'f.ts')
    expect(f).toMatchObject({ additions: 3, deletions: 3, status: 'modified' })
    expect(snapshot.files.find((row) => row.relativePath === 'conflict.ts')?.status).toBe(
      'conflict'
    )
  })

  it('marks binary-hint rows when line stats are unavailable', () => {
    const snapshot = buildAgentChangesSnapshot({
      worktreeId: 'wt-1',
      worktreePath: '/repo',
      revision: 1,
      entries: [entry({ path: 'photo.png', status: 'modified' })]
    })
    expect(snapshot.files[0]).toMatchObject({
      relativePath: 'photo.png',
      binary: true,
      additions: 0,
      deletions: 0
    })
  })

  it('skips submodule root entries without submoduleRoot', () => {
    const snapshot = buildAgentChangesSnapshot({
      worktreeId: 'wt-1',
      worktreePath: '/repo',
      revision: 1,
      entries: [
        entry({
          path: 'vendor/lib',
          status: 'modified',
          submodule: { commitChanged: true, trackedChanges: false, untrackedChanges: false }
        }),
        entry({ path: 'app.ts', status: 'modified', added: 1, removed: 0 })
      ]
    })
    expect(snapshot.files.map((f) => f.relativePath)).toEqual(['app.ts'])
  })
})

describe('buildUnifiedHunksFromSides / applyDiffBodyToFile', () => {
  it('produces unified hunks with context/add/del kinds for a modified text file', () => {
    const result = buildUnifiedHunksFromSides(
      'line1\nline2\nline3\n',
      'line1\nline2-changed\nline3\n'
    )
    expect(result.tooLarge).toBe(false)
    expect(result.binary).toBe(false)
    expect(result.hunks.length).toBeGreaterThanOrEqual(1)
    const kinds = result.hunks.flatMap((h) => h.lines.map((l) => l.kind))
    expect(kinds).toContain('del')
    expect(kinds).toContain('add')
    expect(kinds).toContain('context')
    expect(result.hunks[0]?.header).toMatch(/^@@ /)
  })

  it('represents pure additions (added/untracked) as add-only hunks', () => {
    const result = buildUnifiedHunksFromSides('', 'hello\nworld\n')
    expect(result.hunks).toHaveLength(1)
    expect(result.hunks[0]?.lines.every((l) => l.kind === 'add')).toBe(true)
    expect(result.hunks[0]?.header).toBe('@@ -0,0 +1,2 @@')
  })

  it('represents pure deletions as del-only hunks', () => {
    const result = buildUnifiedHunksFromSides('gone\n', '')
    expect(result.hunks).toHaveLength(1)
    expect(result.hunks[0]?.lines.every((l) => l.kind === 'del')).toBe(true)
  })

  it('returns binary flag without hunks', () => {
    const result = buildUnifiedHunksFromSides('a', 'b', { binary: true })
    expect(result).toEqual({ hunks: [], tooLarge: false, binary: true })
  })

  it('returns tooLarge without hunks when sides exceed line caps', () => {
    const big = `${'x\n'.repeat(AGENT_CHANGES_MAX_LINES_PER_SIDE + 10)}`
    const result = buildUnifiedHunksFromSides(big, `${big}y\n`)
    expect(result.tooLarge).toBe(true)
    expect(result.hunks).toEqual([])
  })

  it('applyDiffBodyToFile attaches binary / tooLarge / hunks onto the file row', () => {
    const base = {
      relativePath: 'f.ts',
      absolutePath: '/repo/f.ts',
      status: 'modified' as const,
      additions: 1,
      deletions: 1
    }
    expect(
      applyDiffBodyToFile(base, { kind: 'binary', originalContent: '', modifiedContent: '' })
    ).toMatchObject({
      binary: true,
      hunks: undefined
    })

    const large = 'a\n'.repeat(AGENT_CHANGES_MAX_LINES_PER_SIDE + 1)
    expect(
      applyDiffBodyToFile(base, {
        kind: 'text',
        originalContent: large,
        modifiedContent: `${large}b\n`
      })
    ).toMatchObject({ tooLarge: true, hunks: undefined })

    const text = applyDiffBodyToFile(base, {
      kind: 'text',
      originalContent: 'a\n',
      modifiedContent: 'b\n'
    })
    expect(text.hunks?.length).toBeGreaterThan(0)
    expect(text.binary).toBe(false)
    expect(text.tooLarge).toBe(false)
  })
})

describe('summarize / replace / ask-agent', () => {
  it('summarizes additions and deletions across files', () => {
    expect(
      summarizeAgentChangedFiles([
        { additions: 2, deletions: 1 },
        { additions: 0, deletions: 3 }
      ])
    ).toEqual({ files: 2, additions: 2, deletions: 4 })
  })

  it('replaceFileInSnapshot updates one file and recomputes summary', () => {
    const snapshot = buildAgentChangesSnapshot({
      worktreeId: 'wt',
      worktreePath: '/r',
      revision: 1,
      entries: [
        entry({ path: 'a.ts', status: 'modified', added: 1, removed: 0 }),
        entry({ path: 'b.ts', status: 'modified', added: 1, removed: 0 })
      ]
    })
    const next: AgentChangedFile = {
      ...snapshot.files[0]!,
      additions: 9,
      deletions: 2,
      hunks: [{ header: '@@ -1,1 +1,1 @@', lines: [{ kind: 'add', text: 'x', newLine: 1 }] }]
    }
    const replaced = replaceFileInSnapshot(snapshot, next)
    expect(replaced.files[0]?.hunks?.[0]?.header).toBe('@@ -1,1 +1,1 @@')
    expect(replaced.summary.additions).toBe(9 + 1)
    expect(replaced.summary.deletions).toBe(2)
  })

  it('buildAgentChangesAskAgentPrompt seeds path and selected lines', () => {
    expect(
      buildAgentChangesAskAgentPrompt({ relativePath: 'src/a.ts', status: 'modified' })
    ).toContain('`src/a.ts`')
    const withSelection = buildAgentChangesAskAgentPrompt({
      relativePath: 'src/a.ts',
      selectedLines: [
        { kind: 'del', text: 'old', oldLine: 3 },
        { kind: 'add', text: 'new', newLine: 3 }
      ]
    })
    expect(withSelection).toContain('```diff')
    expect(withSelection).toContain('-old')
    expect(withSelection).toContain('+new')
  })
})
