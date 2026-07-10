import { describe, expect, it } from 'vitest'
import { resolveAgentOverridesAccordionDefaultOpen } from './agent-catalog-overrides-accordion'

describe('resolveAgentOverridesAccordionDefaultOpen', () => {
  it('opens sections that differ from defaults', () => {
    expect(
      resolveAgentOverridesAccordionDefaultOpen({
        cmdOverride: '/custom/codex',
        argsOverride: '--yolo',
        defaultArgs: '',
        envSummary: 'FOO=1',
        defaultEnvSummary: '',
        hasSessionHome: true
      })
    ).toEqual(['command', 'args', 'env', 'session-home'])
  })

  it('falls back to command when nothing is customized', () => {
    expect(
      resolveAgentOverridesAccordionDefaultOpen({
        cmdOverride: undefined,
        argsOverride: '',
        defaultArgs: '',
        envSummary: '',
        defaultEnvSummary: '',
        hasSessionHome: false
      })
    ).toEqual(['command'])
  })
})
