import { describe, expect, it } from 'vitest'
import {
  findGitConflictBlocks,
  getGitConflictMarkerLineLength,
  hasGitConflictMarkers
} from './conflict-markers'

const sample = [
  'before',
  '<<<<<<< HEAD',
  'current',
  '=======',
  'incoming',
  '>>>>>>> branch',
  'after'
].join('\n')

describe('conflict-markers', () => {
  it('detects conflict markers and blocks', () => {
    expect(hasGitConflictMarkers(sample)).toBe(true)
    expect(findGitConflictBlocks(sample)).toEqual([{ startLine: 2, separatorLine: 4, endLine: 6 }])
  })

  it('returns marker line length for a known line', () => {
    expect(getGitConflictMarkerLineLength(sample, 2)).toBe('<<<<<<< HEAD'.length)
    expect(getGitConflictMarkerLineLength(sample, 1)).toBe('before'.length)
  })
})
