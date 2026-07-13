import { describe, expect, it } from 'vitest'
import { normalizeDisabledTuiAgents, pickTuiAgent } from './tui-agent-selection'

describe('pickTuiAgent', () => {
  it('uses an installed preferred agent', () => {
    expect(pickTuiAgent('codex', ['claude', 'codex'])).toBe('codex')
  })

  it('falls back in desktop catalog order when the preference is absent or stale', () => {
    expect(pickTuiAgent(null, ['droid', 'codex'])).toBe('codex')
    expect(pickTuiAgent('cline', ['droid', 'codex'])).toBe('codex')
    expect(pickTuiAgent(null, ['hermes', 'devin'])).toBe('hermes')
  })

  it('respects the explicit blank terminal preference', () => {
    expect(pickTuiAgent('blank', ['droid', 'claude'])).toBeNull()
  })

  it('ignores disabled preferred and fallback agents', () => {
    expect(pickTuiAgent('codex', ['claude', 'codex'], ['codex'])).toBe('claude')
    expect(pickTuiAgent(null, ['claude', 'codex'], ['claude', 'codex'])).toBeNull()
  })
})

describe('normalizeDisabledTuiAgents', () => {
  it('dedupes supported agent ids and drops unsupported values', () => {
    expect(normalizeDisabledTuiAgents(['codex', 'unknown', 'codex', null, 'claude'])).toEqual([
      'codex',
      'claude'
    ])
  })
})
