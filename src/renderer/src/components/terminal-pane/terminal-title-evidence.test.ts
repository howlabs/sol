import { describe, expect, it } from 'vitest'
import { resolvePaneDisplayTitle, resolvePaneTitleDecision } from './terminal-title-evidence'

describe('resolvePaneDisplayTitle', () => {
  it('normalizes a Pi-compatible title to the resolved Pi owner', () => {
    expect(resolvePaneDisplayTitle('π - tmp', 'pi')).toBe('Pi ready')
  })

  it('passes an unowned title through unchanged', () => {
    expect(resolvePaneDisplayTitle('bash', undefined)).toBe('bash')
  })
})

describe('resolvePaneTitleDecision', () => {
  it('derives the display label and the renderer veto from a pane-scoped Pi owner', () => {
    const decision = resolvePaneTitleDecision({
      normalizedTitle: 'Pi ready',
      rawTitle: '✦ Gemini CLI',
      displayOwnerAgentType: 'pi',
      rendererOwnerAgentType: 'pi',
      userGpuMode: 'auto'
    })
    expect(decision.displayTitle).toBe('Pi ready')
    expect(decision.rawTitle).toBe('✦ Gemini CLI')
    // Why: the Pi owner renames the label and vetoes the Gemini glyph fallback.
    expect(decision.rendererPolicy.gpuEnabled).toBe(true)
  })

  it('uses the renderer owner, not the display owner, for the GPU veto', () => {
    const decision = resolvePaneTitleDecision({
      normalizedTitle: 'Pi ready',
      rawTitle: '✦ Gemini CLI',
      // Display label follows the sticky/tab-scoped owner, but the renderer veto
      // sees no current pane-scoped owner, so the genuine Gemini pane goes DOM.
      displayOwnerAgentType: 'pi',
      rendererOwnerAgentType: undefined,
      userGpuMode: 'auto'
    })
    expect(decision.displayTitle).toBe('Pi ready')
    expect(decision.rendererPolicy.gpuEnabled).toBe(false)
    expect(decision.rendererPolicy.reason).toBe('agent-compatibility')
  })

  it('DOM-gates a genuine Gemini pane while preserving its raw title', () => {
    const decision = resolvePaneTitleDecision({
      normalizedTitle: '✦ Gemini CLI',
      rawTitle: '✦ Gemini CLI',
      displayOwnerAgentType: 'claude',
      rendererOwnerAgentType: 'claude',
      userGpuMode: 'auto'
    })
    expect(decision.rawTitle).toBe('✦ Gemini CLI')
    expect(decision.rendererPolicy.gpuEnabled).toBe(false)
    expect(decision.rendererPolicy.reason).toBe('agent-compatibility')
  })
})
