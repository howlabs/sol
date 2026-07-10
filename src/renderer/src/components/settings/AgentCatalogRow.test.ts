import { describe, expect, it } from 'vitest'
import {
  resolveAgentRowStatusLabelKey,
  resolveAgentRowStatusTone
} from './agent-catalog-row-status'

describe('agent catalog row status', () => {
  it('flags install attention for undetected agents', () => {
    expect(
      resolveAgentRowStatusTone({ isDetected: false, isEnabled: true, isDefault: false })
    ).toBe('attention')
    expect(
      resolveAgentRowStatusLabelKey({ isDetected: false, isEnabled: true, isDefault: false })
    ).toBe('install')
  })

  it('flags default agents as connected', () => {
    expect(resolveAgentRowStatusTone({ isDetected: true, isEnabled: true, isDefault: true })).toBe(
      'connected'
    )
    expect(
      resolveAgentRowStatusLabelKey({ isDetected: true, isEnabled: true, isDefault: true })
    ).toBe('default')
  })

  it('flags disabled agents as disabled', () => {
    expect(
      resolveAgentRowStatusTone({ isDetected: true, isEnabled: false, isDefault: false })
    ).toBe('neutral')
    expect(
      resolveAgentRowStatusLabelKey({ isDetected: true, isEnabled: false, isDefault: false })
    ).toBe('disabled')
  })
})
