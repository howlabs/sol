import { describe, it, expect } from 'vitest'
import { buildAttributionPromptFragment, ORCA_GIT_COMMIT_TRAILER } from './orca-attribution'

describe('buildAttributionPromptFragment', () => {
  it('returns a fragment containing the default trailer', () => {
    const fragment = buildAttributionPromptFragment()
    expect(fragment).toContain(ORCA_GIT_COMMIT_TRAILER)
    expect(fragment).toContain('exactly once')
  })
})
