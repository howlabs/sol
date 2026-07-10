import { describe, expect, it } from 'vitest'
import { resolveDefaultAgentToggleValue } from './agents-default-agent-toggle'

describe('resolveDefaultAgentToggleValue', () => {
  it('maps blank, auto, and explicit agent ids', () => {
    expect(resolveDefaultAgentToggleValue('blank', false, true)).toBe('blank')
    expect(resolveDefaultAgentToggleValue(null, true, false)).toBe('auto')
    expect(resolveDefaultAgentToggleValue('claude', false, false)).toBe('claude')
    expect(resolveDefaultAgentToggleValue('codex', true, false)).toBe('auto')
  })
})
