import { describe, expect, it } from 'vitest'
import { detectPiAgentKindFromCommand, isPiCompatibleAgentType } from './pi-agent-kind'

describe('isPiCompatibleAgentType', () => {
  it('accepts only pi', () => {
    expect(isPiCompatibleAgentType('pi')).toBe(true)
    expect(isPiCompatibleAgentType('omp')).toBe(false)
    expect(isPiCompatibleAgentType('codex')).toBe(false)
    expect(isPiCompatibleAgentType(null)).toBe(false)
  })
})

describe('detectPiAgentKindFromCommand', () => {
  it('always resolves to pi (OMP launch support removed)', () => {
    expect(detectPiAgentKindFromCommand('pi')).toBe('pi')
    expect(detectPiAgentKindFromCommand('omp')).toBe('pi')
    expect(detectPiAgentKindFromCommand(undefined)).toBe('pi')
  })
})
