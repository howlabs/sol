import { describe, expect, it } from 'vitest'
import { resolvePaneRendererPolicy } from './terminal-renderer-policy'

describe('resolvePaneRendererPolicy', () => {
  describe('user GPU modes', () => {
    it('keeps the content gate open under `off`', () => {
      const decision = resolvePaneRendererPolicy({
        rawTitle: 'zsh',
        userGpuMode: 'off'
      })
      expect(decision).toEqual({
        gpuEnabled: true,
        reason: 'user-setting',
        confidence: 'authoritative'
      })
    })

    it('forces GPU on under `on`', () => {
      const decision = resolvePaneRendererPolicy({
        rawTitle: 'Claude Code',
        userGpuMode: 'on'
      })
      expect(decision).toEqual({
        gpuEnabled: true,
        reason: 'user-setting',
        confidence: 'authoritative'
      })
    })

    it('enables GPU under `auto` for an ordinary shell', () => {
      const decision = resolvePaneRendererPolicy({
        rawTitle: 'bash',
        userGpuMode: 'auto'
      })
      expect(decision).toEqual({
        gpuEnabled: true,
        reason: 'capability',
        confidence: 'authoritative'
      })
    })
  })

  describe('WebGL capability and context-loss containment', () => {
    it('disables GPU under `on` when WebGL is unavailable', () => {
      const decision = resolvePaneRendererPolicy({
        rawTitle: 'bash',
        userGpuMode: 'on',
        webglUnavailable: true
      })
      expect(decision).toEqual({
        gpuEnabled: false,
        reason: 'capability',
        confidence: 'authoritative'
      })
    })

    it('disables GPU under `on` inside context-loss containment', () => {
      const decision = resolvePaneRendererPolicy({
        rawTitle: 'bash',
        userGpuMode: 'on',
        inContextLossContainment: true
      })
      expect(decision).toEqual({
        gpuEnabled: false,
        reason: 'context-loss',
        confidence: 'authoritative'
      })
    })

    it('disables GPU under `auto` inside context-loss containment', () => {
      const decision = resolvePaneRendererPolicy({
        rawTitle: 'bash',
        userGpuMode: 'auto',
        inContextLossContainment: true
      })
      expect(decision.gpuEnabled).toBe(false)
      expect(decision.reason).toBe('context-loss')
    })
  })
})
