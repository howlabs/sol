import { describe, expect, it } from 'vitest'
import { getUntitledFileRoot } from './untitled-file-rename-path'

describe('getUntitledFileRoot', () => {
  it('uses the real worktree path when one exists', () => {
    expect(
      getUntitledFileRoot(
        { filePath: '/tmp/floating/untitled.md', relativePath: 'untitled.md' },
        '/repo/worktree'
      )
    ).toBe('/repo/worktree')
  })

  it('falls back to the file root when no worktree path exists', () => {
    expect(
      getUntitledFileRoot({
        filePath: '/Users/alice/Library/Application Support/Sol/notes/untitled.md',
        relativePath: 'untitled.md'
      })
    ).toBe('/Users/alice/Library/Application Support/Sol/notes')
  })

  it('handles nested untitled relative paths', () => {
    expect(
      getUntitledFileRoot({
        filePath: '/tmp/orca/notes/drafts/untitled.md',
        relativePath: 'notes/drafts/untitled.md'
      })
    ).toBe('/tmp/orca')
  })
})
