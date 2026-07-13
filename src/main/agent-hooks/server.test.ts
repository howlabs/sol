/* eslint-disable max-lines -- Why: this suite exercises the full hook HTTP surface (Claude/Codex/Gemini parsing, transcript chunked scan, paneKey dispatch) and keeping the scenarios co-located avoids fixture drift across files. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AgentHookServer, _internals } from './server'
import { AGENT_STATUS_MAX_FIELD_LENGTH } from '../../shared/agent-status-types'
import { makePaneKey } from '../../shared/stable-pane-id'

const { getCohortAtEmitMock, trackMock } = vi.hoisted(() => ({
  getCohortAtEmitMock: vi.fn(),
  trackMock: vi.fn()
}))

vi.mock('../telemetry/client', () => ({
  track: trackMock
}))

vi.mock('../telemetry/cohort-classifier', () => ({
  getCohortAtEmit: getCohortAtEmitMock
}))

const LEAF_1 = '11111111-1111-4111-8111-111111111111'
const LEAF_2 = '22222222-2222-4222-8222-222222222222'
const LEAF_3 = '33333333-3333-4333-8333-333333333333'
const LEAF_4 = '44444444-4444-4444-8444-444444444444'
const PANE = makePaneKey('tab-1', LEAF_1)
const GOOD_PANE = makePaneKey('tab-good', LEAF_2)
const FRESH_PANE = makePaneKey('tab-fresh', LEAF_4)

type Body = {
  paneKey: string
  tabId?: string
  worktreeId?: string
  env?: string
  version?: string
  payload: Record<string, unknown>
}

type AgentHookServerCacheInternals = {
  assistantMessageRetryTimers: Map<string, number | ReturnType<typeof globalThis.setTimeout>>
  promptSentDedupeByPaneKey: Map<string, unknown>
  runtimeObservedStatusPaneKeys: Set<string>
  scheduleStatusPersist: () => void
}

function buildBody(payload: Record<string, unknown>, overrides: Partial<Body> = {}): Body {
  return {
    paneKey: PANE,
    tabId: 'tab-1',
    worktreeId: 'wt-1',
    env: 'production',
    payload,
    ...overrides
  }
}

beforeEach(() => {
  _internals.resetCachesForTests()
  trackMock.mockReset()
  getCohortAtEmitMock.mockReset()
  getCohortAtEmitMock.mockReturnValue({ nth_repo_added: 2 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AgentHookServer listener replay', () => {
  it('applies inferred interrupts through the cached status lifecycle', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      const listener = vi.fn()
      server.setListener(listener)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          providerSession: { key: 'session_id', id: 'codex-interrupt-session-1' },
          payload: { state: 'working', prompt: 'long task', agentType: 'codex' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      const applied = server.inferInterrupt({
        paneKey: PANE,
        baselineUpdatedAt: baseline.receivedAt,
        baselineStateStartedAt: baseline.stateStartedAt,
        baselinePrompt: 'long task',
        baselineAgentType: 'codex',
        intent: 'plain-escape'
      })

      expect(applied).toBe(true)
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'done',
          prompt: 'long task',
          agentType: 'codex',
          providerSession: { key: 'session_id', id: 'codex-interrupt-session-1' },
          interrupted: true,
          receivedAt: 1_500,
          stateStartedAt: 1_500
        })
      ])
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          providerSession: { key: 'session_id', id: 'codex-interrupt-session-1' },
          payload: expect.objectContaining({ state: 'done', interrupted: true })
        })
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('preserves an inferred interrupted row when OpenCode immediately reports SessionIdle', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      const listener = vi.fn()
      server.setListener(listener)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'long task', agentType: 'opencode' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'long task',
          baselineAgentType: 'opencode',
          intent: 'plain-escape',
          inputCount: 2
        })
      ).toBe(true)

      vi.setSystemTime(1_501)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'done', prompt: 'long task', agentType: 'opencode' }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'done',
          prompt: 'long task',
          agentType: 'opencode',
          interrupted: true,
          receivedAt: 1_500,
          stateStartedAt: 1_500
        })
      ])
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          payload: expect.objectContaining({ state: 'done', interrupted: true })
        })
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects inferred interrupts when a same-millisecond prompt update changed the row', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'first task', agentType: 'codex' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'second task', agentType: 'codex' }
        },
        'conn-1'
      )

      const applied = server.inferInterrupt({
        paneKey: PANE,
        baselineUpdatedAt: baseline.receivedAt,
        baselineStateStartedAt: baseline.stateStartedAt,
        baselinePrompt: 'first task',
        baselineAgentType: 'codex',
        intent: 'plain-escape'
      })

      expect(applied).toBe(false)
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'second task',
          agentType: 'codex'
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it.each(['opencode', 'copilot'] as const)(
    'rejects single plain Escape inference for %s',
    (agentType) => {
      vi.useFakeTimers()
      vi.setSystemTime(1_000)
      try {
        const server = new AgentHookServer()
        server.ingestRemote(
          {
            paneKey: PANE,
            tabId: 'tab-1',
            worktreeId: 'wt-1',
            payload: { state: 'working', prompt: 'long task', agentType }
          },
          'conn-1'
        )
        const baseline = server.getStatusSnapshot()[0]

        vi.setSystemTime(1_500)
        const applied = server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'long task',
          baselineAgentType: agentType,
          intent: 'plain-escape'
        })

        expect(applied).toBe(false)
        expect(server.getStatusSnapshot()).toEqual([
          expect.objectContaining({
            state: 'working',
            prompt: 'long task',
            agentType
          })
        ])
      } finally {
        vi.useRealTimers()
      }
    }
  )

  it.each(['opencode', 'copilot'] as const)(
    'accepts double plain Escape inference for %s',
    (agentType) => {
      vi.useFakeTimers()
      vi.setSystemTime(1_000)
      try {
        const server = new AgentHookServer()
        server.ingestRemote(
          {
            paneKey: PANE,
            tabId: 'tab-1',
            worktreeId: 'wt-1',
            payload: { state: 'working', prompt: 'long task', agentType }
          },
          'conn-1'
        )
        const baseline = server.getStatusSnapshot()[0]

        vi.setSystemTime(1_500)
        const applied = server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'long task',
          baselineAgentType: agentType,
          intent: 'plain-escape',
          inputCount: 2
        })

        expect(applied).toBe(true)
        expect(server.getStatusSnapshot()).toEqual([
          expect.objectContaining({
            state: 'done',
            prompt: 'long task',
            agentType,
            interrupted: true
          })
        ])
      } finally {
        vi.useRealTimers()
      }
    }
  )

  it('rejects Ctrl+C inference for Droid', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'long task', agentType: 'droid' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      const applied = server.inferInterrupt({
        paneKey: PANE,
        baselineUpdatedAt: baseline.receivedAt,
        baselineStateStartedAt: baseline.stateStartedAt,
        baselinePrompt: 'long task',
        baselineAgentType: 'droid',
        intent: 'ctrl-c'
      })

      expect(applied).toBe(false)
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'long task',
          agentType: 'droid'
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not let late same-turn working hooks resurrect an inferred interrupt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'long task', agentType: 'pi' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'long task',
          baselineAgentType: 'pi',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(6_000)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: {
            state: 'working',
            prompt: 'long task',
            agentType: 'pi',
            toolName: 'bash',
            toolInput: '/bin/sleep 90'
          }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'done',
          prompt: 'long task',
          agentType: 'pi',
          interrupted: true,
          receivedAt: 1_500,
          stateStartedAt: 1_500
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not let late Claude tool hooks with explicit prompt resurrect an inferred interrupt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          hookEventName: 'UserPromptSubmit',
          payload: {
            state: 'working',
            prompt: 'Do I have gpu acceleration on on my terminal?',
            agentType: 'claude'
          }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'Do I have gpu acceleration on on my terminal?',
          baselineAgentType: 'claude',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(2_000)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          hookEventName: 'PostToolUse',
          payload: {
            state: 'working',
            prompt: 'Do I have gpu acceleration on on my terminal?',
            agentType: 'claude',
            toolName: 'Read',
            toolInput: 'src/renderer/src/components/terminal-pane/use-terminal-pane-lifecycle.ts'
          }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'done',
          prompt: 'Do I have gpu acceleration on on my terminal?',
          agentType: 'claude',
          interrupted: true,
          receivedAt: 1_500,
          stateStartedAt: 1_500
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('allows a new prompt after an inferred interrupt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'first task', agentType: 'pi' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'first task',
          baselineAgentType: 'pi',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(2_000)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'second task', agentType: 'pi' }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'second task',
          agentType: 'pi',
          receivedAt: 2_000,
          stateStartedAt: 2_000
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('allows a Claude follow-up prompt after an inferred interrupt to keep working', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          hookEventName: 'UserPromptSubmit',
          payload: { state: 'working', prompt: 'first Claude turn', agentType: 'claude' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'first Claude turn',
          baselineAgentType: 'claude',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(2_000)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          hookEventName: 'UserPromptSubmit',
          payload: { state: 'working', prompt: 'second queued Claude turn', agentType: 'claude' }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'second queued Claude turn',
          agentType: 'claude',
          interrupted: undefined,
          receivedAt: 2_000,
          stateStartedAt: 2_000
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('allows an immediate same-prompt retry after an inferred interrupt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: { state: 'working', prompt: 'retryable task', agentType: 'pi' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'retryable task',
          baselineAgentType: 'pi',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(2_000)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: { state: 'working', prompt: 'retryable task', agentType: 'pi' }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'retryable task',
          agentType: 'pi',
          receivedAt: 2_000,
          stateStartedAt: 2_000
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('suppresses same-turn Claude tool progress after the stale suppression window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          hookEventName: 'UserPromptSubmit',
          payload: { state: 'working', prompt: 'repeat task', agentType: 'claude' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'repeat task',
          baselineAgentType: 'claude',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(16_501)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          hookEventName: 'PostToolUse',
          payload: {
            state: 'working',
            prompt: 'repeat task',
            agentType: 'claude',
            toolName: 'bash',
            toolInput: '/bin/sleep 90'
          }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'done',
          prompt: 'repeat task',
          agentType: 'claude',
          interrupted: true,
          receivedAt: 1_500,
          stateStartedAt: 1_500
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('allows generic non-explicit same-prompt working after the stale suppression window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'repeat task', agentType: 'pi' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'repeat task',
          baselineAgentType: 'pi',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(16_501)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'repeat task', agentType: 'pi' }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'repeat task',
          agentType: 'pi',
          interrupted: undefined,
          receivedAt: 16_501,
          stateStartedAt: 16_501
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('allows non-Claude tool-context working after the stale suppression window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'repeat task', agentType: 'pi' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'repeat task',
          baselineAgentType: 'pi',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(16_501)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: {
            state: 'working',
            prompt: 'repeat task',
            agentType: 'pi',
            toolName: 'bash',
            toolInput: '/bin/sleep 90'
          }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'repeat task',
          agentType: 'pi',
          interrupted: undefined,
          toolName: 'bash',
          toolInput: '/bin/sleep 90',
          receivedAt: 16_501,
          stateStartedAt: 16_501
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects malformed inferred interrupt requests without throwing', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'long task', agentType: 'codex' }
        },
        'conn-1'
      )
      const malformed: unknown[] = [
        {
          paneKey: 'tab-1:0',
          baselineUpdatedAt: 1_000,
          baselineStateStartedAt: 1_000,
          baselinePrompt: 'long task',
          baselineAgentType: 'codex',
          intent: 'ctrl-c'
        },
        {
          paneKey: PANE,
          baselineUpdatedAt: 1_000,
          baselineStateStartedAt: 1_000,
          baselinePrompt: 'long task',
          baselineAgentType: 'codex',
          intent: 'sigint'
        },
        {
          paneKey: PANE,
          baselineUpdatedAt: '1_000',
          baselineStateStartedAt: 1_000,
          baselinePrompt: 'long task',
          baselineAgentType: 'codex',
          intent: 'ctrl-c'
        },
        {
          paneKey: PANE,
          baselineUpdatedAt: 1_000,
          baselineStateStartedAt: 1_000,
          baselinePrompt: 123,
          baselineAgentType: 'codex',
          intent: 'ctrl-c'
        }
      ]

      for (const request of malformed) {
        expect(() =>
          server.inferInterrupt(request as Parameters<AgentHookServer['inferInterrupt']>[0])
        ).not.toThrow()
        expect(
          server.inferInterrupt(request as Parameters<AgentHookServer['inferInterrupt']>[0])
        ).toBe(false)
      }
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'long task',
          agentType: 'codex'
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('allows an immediate same-prompt retry that carries cached turn detail', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: {
            state: 'working',
            prompt: 'retryable task',
            agentType: 'opencode',
            lastAssistantMessage: 'partial answer'
          }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'retryable task',
          baselineAgentType: 'opencode',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(2_000)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: {
            state: 'working',
            prompt: 'retryable task',
            agentType: 'opencode',
            lastAssistantMessage: 'partial answer'
          }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          prompt: 'retryable task',
          agentType: 'opencode',
          lastAssistantMessage: 'partial answer',
          receivedAt: 2_000,
          stateStartedAt: 2_000
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('suppresses replayed same-prompt working events after an inferred interrupt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: {
            state: 'working',
            prompt: 'retryable task',
            agentType: 'opencode',
            lastAssistantMessage: 'partial answer'
          }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'retryable task',
          baselineAgentType: 'opencode',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      vi.setSystemTime(20_000)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          isReplay: true,
          payload: {
            state: 'working',
            prompt: 'retryable task',
            agentType: 'opencode',
            lastAssistantMessage: 'partial answer'
          }
        },
        'conn-1'
      )

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'done',
          prompt: 'retryable task',
          agentType: 'opencode',
          interrupted: true,
          receivedAt: 1_500,
          stateStartedAt: 1_500
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('matches renderer unknown sentinel to an omitted hook agent type', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'custom hook' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot()[0]

      vi.setSystemTime(1_500)
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'custom hook',
          baselineAgentType: 'unknown',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'done',
          prompt: 'custom hook',
          interrupted: true
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects inferred interrupts for stale and non-working rows', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'waiting', prompt: 'permission', agentType: 'codex' }
        },
        'conn-1'
      )
      const waiting = server.getStatusSnapshot()[0]
      expect(
        server.inferInterrupt({
          paneKey: PANE,
          baselineUpdatedAt: waiting.receivedAt,
          baselineStateStartedAt: waiting.stateStartedAt,
          baselinePrompt: 'permission',
          baselineAgentType: 'codex',
          intent: 'plain-escape'
        })
      ).toBe(false)

      server.ingestRemote(
        {
          paneKey: FRESH_PANE,
          tabId: 'tab-fresh',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'old task', agentType: 'codex' }
        },
        'conn-1'
      )
      const stale = server.getStatusSnapshot().find((entry) => entry.paneKey === FRESH_PANE)!
      vi.setSystemTime(stale.receivedAt + 30 * 60 * 1000 + 1)
      expect(
        server.inferInterrupt({
          paneKey: FRESH_PANE,
          baselineUpdatedAt: stale.receivedAt,
          baselineStateStartedAt: stale.stateStartedAt,
          baselinePrompt: 'old task',
          baselineAgentType: 'codex',
          intent: 'plain-escape'
        })
      ).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('applies inferred interrupts for arbitrary agent types and Ctrl+C intent', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: GOOD_PANE,
          tabId: 'tab-good',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'custom task', agentType: 'custom-agent' }
        },
        'conn-1'
      )
      const baseline = server.getStatusSnapshot().find((entry) => entry.paneKey === GOOD_PANE)!

      vi.setSystemTime(1_250)
      expect(
        server.inferInterrupt({
          paneKey: GOOD_PANE,
          baselineUpdatedAt: baseline.receivedAt,
          baselineStateStartedAt: baseline.stateStartedAt,
          baselinePrompt: 'custom task',
          baselineAgentType: 'custom-agent',
          intent: 'ctrl-c'
        })
      ).toBe(true)

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: GOOD_PANE,
          state: 'done',
          prompt: 'custom task',
          agentType: 'custom-agent',
          interrupted: true
        })
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('allows multiple status-change subscribers to observe the same update', () => {
    const server = new AgentHookServer()
    const first = vi.fn()
    const second = vi.fn()
    server.subscribeStatusChanges(first)
    server.subscribeStatusChanges(second)

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        payload: { state: 'working', agentType: 'claude' }
      },
      'conn-1'
    )

    expect(first).toHaveBeenCalledWith([
      expect.objectContaining({
        state: 'working',
        receivedAt: expect.any(Number),
        observedInCurrentRuntime: true
      })
    ])
    expect(second).toHaveBeenCalledWith([
      expect.objectContaining({
        state: 'working',
        receivedAt: expect.any(Number),
        observedInCurrentRuntime: true
      })
    ])
  })

  it('keeps status-change subscribers when renderer fanout listener is cleared', () => {
    const server = new AgentHookServer()
    const statusChangeListener = vi.fn()
    const rendererListener = vi.fn()
    server.subscribeStatusChanges(statusChangeListener)
    server.setListener(rendererListener)
    server.setListener(null)

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        payload: { state: 'working', agentType: 'claude' }
      },
      'conn-1'
    )

    expect(statusChangeListener).toHaveBeenCalledTimes(1)
    expect(rendererListener).not.toHaveBeenCalled()
  })

  it('marks listener replay callbacks as replayed', () => {
    const server = new AgentHookServer()
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        payload: { state: 'working', prompt: 'cached task', agentType: 'codex' }
      },
      'conn-1'
    )

    const listener = vi.fn()
    server.setListener(listener)

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        paneKey: PANE,
        isReplay: true,
        payload: expect.objectContaining({ state: 'working', prompt: 'cached task' })
      })
    )
  })

  it('unsubscribes status-change listeners without removing the remaining listeners', () => {
    const server = new AgentHookServer()
    const removed = vi.fn()
    const remaining = vi.fn()
    const unsubscribe = server.subscribeStatusChanges(removed)
    server.subscribeStatusChanges(remaining)

    unsubscribe()
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        payload: { state: 'working', agentType: 'claude' }
      },
      'conn-1'
    )

    expect(removed).not.toHaveBeenCalled()
    expect(remaining).toHaveBeenCalledWith([
      expect.objectContaining({
        state: 'working',
        observedInCurrentRuntime: true
      })
    ])
  })

  it('notifies status-change subscribers when a working status is dropped or cleared', () => {
    const server = new AgentHookServer()
    const listener = vi.fn()
    server.subscribeStatusChanges(listener)

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        payload: { state: 'working', agentType: 'claude' }
      },
      'conn-1'
    )
    server.dropStatusEntry(PANE)
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        payload: { state: 'working', agentType: 'claude' }
      },
      'conn-1'
    )
    server.clearPaneState(PANE)

    expect(listener).toHaveBeenNthCalledWith(2, [])
    expect(listener).toHaveBeenNthCalledWith(4, [])
  })

  it('notifies pane-status-clear listener when pane teardown evicts a cached status', () => {
    const server = new AgentHookServer()
    const listener = vi.fn()
    server.setPaneStatusClearListener(listener)

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        payload: { state: 'working', agentType: 'claude' }
      },
      'conn-1'
    )
    server.clearPaneState(PANE)
    server.clearPaneState(PANE)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(PANE)
  })

  it('drops cached statuses and pane-scoped listener caches under one tab prefix', () => {
    vi.useFakeTimers()
    try {
      const server = new AgentHookServer()
      const internals = server as unknown as AgentHookServerCacheInternals
      const sameTabPane = makePaneKey('tab-1', LEAF_2)
      const siblingPrefixPane = makePaneKey('tab-10', LEAF_3)
      const statusListener = vi.fn()
      const aliasPersist = vi.fn()
      const sameTabRetry = vi.fn()
      const siblingRetry = vi.fn()
      server.subscribeStatusChanges(statusListener)
      server.setPaneKeyAliasPersistenceListener(aliasPersist)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'first', agentType: 'claude' }
        },
        'conn-1'
      )
      server.ingestRemote(
        {
          paneKey: sameTabPane,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'done', prompt: 'second', agentType: 'codex' }
        },
        'conn-1'
      )
      server.ingestRemote(
        {
          paneKey: siblingPrefixPane,
          tabId: 'tab-10',
          worktreeId: 'wt-2',
          payload: { state: 'working', prompt: 'sibling', agentType: 'claude' }
        },
        'conn-1'
      )
      server.registerPaneKeyAlias('tab-1:0', sameTabPane, 'pty-1')
      const state = server._getStateForTests()
      state.lastPromptByPaneKey.set(PANE, 'cached prompt')
      state.lastToolByPaneKey.set(`${sameTabPane}\0tool`, {} as never)
      state.antigravityCompletedTranscriptByPaneKey.set(`${sameTabPane}\0done`, 'cached')
      state.ampCompletedCacheKeys.add(`${sameTabPane}\0amp`)
      state.lastPromptByPaneKey.set(siblingPrefixPane, 'sibling prompt')
      internals.assistantMessageRetryTimers.set(PANE, setTimeout(sameTabRetry, 1_000))
      internals.assistantMessageRetryTimers.set(siblingPrefixPane, setTimeout(siblingRetry, 1_000))
      internals.promptSentDedupeByPaneKey.set(PANE, { promptHash: 'same-tab' })
      internals.promptSentDedupeByPaneKey.set(siblingPrefixPane, { promptHash: 'sibling' })
      const scheduleStatusPersist = vi.spyOn(internals, 'scheduleStatusPersist')
      statusListener.mockClear()
      aliasPersist.mockClear()
      scheduleStatusPersist.mockClear()

      server.dropStatusEntriesByTabPrefix('tab-1')

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({ paneKey: siblingPrefixPane, prompt: 'sibling' })
      ])
      expect(state.lastPromptByPaneKey.has(PANE)).toBe(false)
      expect(state.lastToolByPaneKey.has(`${sameTabPane}\0tool`)).toBe(false)
      expect(state.antigravityCompletedTranscriptByPaneKey.has(`${sameTabPane}\0done`)).toBe(false)
      expect(state.ampCompletedCacheKeys.has(`${sameTabPane}\0amp`)).toBe(false)
      expect(state.lastPromptByPaneKey.get(siblingPrefixPane)).toBe('sibling prompt')
      expect(internals.assistantMessageRetryTimers.has(PANE)).toBe(false)
      expect(internals.assistantMessageRetryTimers.has(siblingPrefixPane)).toBe(true)
      expect(internals.promptSentDedupeByPaneKey.has(PANE)).toBe(false)
      expect(internals.promptSentDedupeByPaneKey.get(siblingPrefixPane)).toEqual({
        promptHash: 'sibling'
      })
      expect(internals.runtimeObservedStatusPaneKeys.has(PANE)).toBe(false)
      expect(internals.runtimeObservedStatusPaneKeys.has(sameTabPane)).toBe(false)
      expect(internals.runtimeObservedStatusPaneKeys.has(siblingPrefixPane)).toBe(true)
      expect(statusListener).toHaveBeenCalledTimes(1)
      expect(statusListener).toHaveBeenCalledWith([
        expect.objectContaining({ state: 'working', observedInCurrentRuntime: true })
      ])
      expect(aliasPersist).toHaveBeenCalledTimes(1)
      expect(aliasPersist).toHaveBeenCalledWith([])
      expect(scheduleStatusPersist).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1_000)
      expect(sameTabRetry).not.toHaveBeenCalled()
      expect(siblingRetry).toHaveBeenCalledTimes(1)
    } finally {
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })

  it('suppresses late writes for a closed tab for the rest of the server session', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      const listener = vi.fn()
      server.setListener(listener)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'before close', agentType: 'codex' }
        },
        'conn-1'
      )

      server.dropStatusEntriesByTabPrefix('tab-1')
      listener.mockClear()

      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'done', prompt: 'late remote', agentType: 'codex' }
        },
        'conn-1'
      )
      server.ingestTerminalStatus({
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        payload: { state: 'done', prompt: 'late terminal', agentType: 'codex' }
      })

      vi.setSystemTime(16_001)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', prompt: 'future reuse', agentType: 'codex' }
        },
        'conn-1'
      )

      expect(listener).not.toHaveBeenCalled()
      expect(server.getStatusSnapshot()).toEqual([])
    } finally {
      vi.useRealTimers()
    }
  })

  it('accepts statuses for unrelated tabs while another tab is recently closed', () => {
    const server = new AgentHookServer()
    server.dropStatusEntriesByTabPrefix('tab-1')
    server.ingestRemote(
      {
        paneKey: GOOD_PANE,
        tabId: 'tab-good',
        worktreeId: 'wt-1',
        payload: { state: 'working', prompt: 'unrelated', agentType: 'claude' }
      },
      'conn-1'
    )

    expect(server.getStatusSnapshot()).toEqual([
      expect.objectContaining({ paneKey: GOOD_PANE, state: 'working', prompt: 'unrelated' })
    ])
  })

  it('suppresses local HTTP hook writes for a recently closed tab', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postHook = (prompt: string): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody({ hook_event_name: 'UserPromptSubmit', prompt }))
        })

      await expect(postHook('before close')).resolves.toMatchObject({ status: 204 })
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({ paneKey: PANE, prompt: 'before close' })
      ])

      server.dropStatusEntriesByTabPrefix('tab-1')
      await expect(postHook('late local')).resolves.toMatchObject({ status: 204 })

      expect(server.getStatusSnapshot()).toEqual([])
    } finally {
      server.stop()
    }
  })

  it('hydrates cached statuses as not observed in the current runtime', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'orca-agent-hooks-'))
    const firstServer = new AgentHookServer()
    const secondServer = new AgentHookServer()
    try {
      await firstServer.start({ env: 'production', userDataPath: dir })
      firstServer.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'working', agentType: 'claude' }
        },
        'conn-1'
      )
      firstServer.flushStatusPersistSync()
      firstServer.stop()

      await secondServer.start({ env: 'production', userDataPath: dir })

      expect(secondServer.getStatusChangeSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          observedInCurrentRuntime: false
        })
      ])
    } finally {
      firstServer.stop()
      secondServer.stop()
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('replays the latest retained pane status when a listener attaches after windowless events', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      expect(env.ORCA_AGENT_HOOK_PORT).toBeTruthy()
      expect(env.ORCA_AGENT_HOOK_TOKEN).toBeTruthy()

      const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: JSON.stringify(
          buildBody({
            hook_event_name: 'UserPromptSubmit',
            prompt: 'replay me'
          })
        )
      })
      expect(response.status).toBe(204)

      const listener = vi.fn()
      server.setListener(listener)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          connectionId: null,
          receivedAt: expect.any(Number),
          stateStartedAt: expect.any(Number),
          payload: expect.objectContaining({
            state: 'working',
            prompt: 'replay me',
            agentType: 'claude'
          })
        })
      )
    } finally {
      server.stop()
    }
  })

  it('keeps Claude permission visible when another subagent reports tool activity', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await expect(
        postClaudeHook({
          hook_event_name: 'PermissionRequest',
          tool_name: 'Bash',
          tool_input: { command: 'rm -rf /tmp/orca-subagent-repro' }
        })
      ).resolves.toMatchObject({ status: 204 })
      await expect(
        postClaudeHook({
          hook_event_name: 'PreToolUse',
          tool_name: 'Read',
          tool_input: { file_path: '/tmp/other-subagent.txt' }
        })
      ).resolves.toMatchObject({ status: 204 })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'waiting',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'rm -rf /tmp/orca-subagent-repro'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('keeps Claude permission visible when matching tool activity has no execution id', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-subagent-repro' }
      })
      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-subagent-repro' }
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'waiting',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'rm -rf /tmp/orca-subagent-repro'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('keeps Claude permission visible when approved tool execution has no identity', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-subagent-repro' }
      })
      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-subagent-repro' },
        tool_use_id: 'toolu-approved-1'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'waiting',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'rm -rf /tmp/orca-subagent-repro'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('lets Claude permission clear when approved PostToolUse matches the preceding tool use id', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-2824-permission-target' },
        tool_use_id: 'toolu-approved-by-claude'
      })
      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-2824-permission-target' }
      })
      await postClaudeHook({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-2824-permission-target' },
        tool_use_id: 'toolu-approved-by-claude'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'working',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'rm -rf /tmp/orca-2824-permission-target'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('lets Claude permission clear by tool use id when tool input is not previewable', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        tool_name: 'BespokeTool',
        tool_input: { opaque: 'request-a' },
        tool_use_id: 'toolu-approved-opaque'
      })
      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'BespokeTool',
        tool_input: { opaque: 'request-a' }
      })
      await postClaudeHook({
        hook_event_name: 'PostToolUse',
        tool_name: 'BespokeTool',
        tool_input: { opaque: 'request-a' },
        tool_use_id: 'toolu-approved-opaque'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'working',
          agentType: 'claude',
          toolName: 'BespokeTool'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('keeps Claude permission visible for unpreviewable tool input with another tool use id', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        tool_name: 'BespokeTool',
        tool_input: { opaque: 'request-a' },
        tool_use_id: 'toolu-permission-owner-opaque'
      })
      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'BespokeTool',
        tool_input: { opaque: 'request-a' }
      })
      await postClaudeHook({
        hook_event_name: 'PostToolUse',
        tool_name: 'BespokeTool',
        tool_input: { opaque: 'request-b' },
        tool_use_id: 'toolu-other-opaque'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'waiting',
          agentType: 'claude',
          toolName: 'BespokeTool'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('keeps Claude permission visible when another tool use completes after permission', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' },
        tool_use_id: 'toolu-permission-owner'
      })
      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' }
      })
      await postClaudeHook({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' },
        tool_use_id: 'toolu-other-subagent'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'waiting',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'pnpm test'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('keeps Claude permission visible when an explicit agent type reports another tool use id', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        agent_type: 'main',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' },
        tool_use_id: 'toolu-permission-owner-type'
      })
      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        agent_type: 'main',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' }
      })
      await postClaudeHook({
        hook_event_name: 'PostToolUse',
        agent_type: 'main',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' },
        tool_use_id: 'toolu-other-type'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'waiting',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'pnpm test'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('lets Claude permission clear when same explicit agent type starts the approved tool', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        agent_type: 'main',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-subagent-repro' }
      })
      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        agent_type: 'main',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-subagent-repro' },
        tool_use_id: 'toolu-approved-1'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'working',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'rm -rf /tmp/orca-subagent-repro'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('lets Claude subagent permission clear when the same agent starts the approved tool', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        agent_id: 'agent-subagent-a',
        agent_type: 'Review',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' }
      })
      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        agent_id: 'agent-subagent-a',
        agent_type: 'Review',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' },
        tool_use_id: 'toolu-approved-subagent'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'working',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'pnpm test'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('lets same Claude subagent clear an unknown approved tool without an input preview', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        agent_id: 'agent-custom-tool',
        agent_type: 'Review',
        tool_name: 'BespokeTool',
        tool_input: { request_id: 'pending-1' }
      })
      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        agent_id: 'agent-custom-tool',
        agent_type: 'Review',
        tool_name: 'BespokeTool',
        tool_input: { request_id: 'pending-1' },
        tool_use_id: 'toolu-custom-approved'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'working',
          agentType: 'claude',
          toolName: 'BespokeTool',
          toolInput: undefined
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('keeps Claude permission visible when another same-type subagent reports the same tool execution', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        agent_id: 'agent-subagent-a',
        agent_type: 'Review',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' }
      })
      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        agent_id: 'agent-subagent-b',
        agent_type: 'Review',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' },
        tool_use_id: 'toolu-other-subagent'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'waiting',
          agentType: 'claude',
          toolName: 'Bash',
          toolInput: 'pnpm test'
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('keeps Claude permission visible when unknown tool previews collide', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'BespokeTool',
        tool_input: { request_id: 'pending-1' }
      })
      await postClaudeHook({
        hook_event_name: 'PreToolUse',
        tool_name: 'BespokeTool',
        tool_input: { request_id: 'other-subagent' }
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'waiting',
          agentType: 'claude',
          toolName: 'BespokeTool',
          toolInput: undefined
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('lets Claude permission clear when a new explicit prompt starts', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const postClaudeHook = async (payload: Record<string, unknown>): Promise<Response> =>
        fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(buildBody(payload))
        })

      await postClaudeHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/orca-subagent-repro' }
      })
      await postClaudeHook({
        hook_event_name: 'UserPromptSubmit',
        prompt: 'start a new task'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'working',
          agentType: 'claude',
          prompt: 'start a new task',
          toolName: undefined,
          toolInput: undefined
        })
      ])
    } finally {
      server.stop()
    }
  })

  it('does not replay cleared pane state to a newly attached listener', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/codex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: JSON.stringify(
          buildBody({
            hook_event_name: 'UserPromptSubmit',
            prompt: 'clear me'
          })
        )
      })

      server.clearPaneState(PANE)
      const listener = vi.fn()
      server.setListener(listener)

      expect(listener).not.toHaveBeenCalled()
    } finally {
      server.stop()
    }
  })

  it('ignores local nested Claude Stop while a parent Codex hook status is active', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const listener = vi.fn()
      server.setListener(listener)
      const postHook = async (
        source: 'codex' | 'claude',
        payload: Record<string, unknown>
      ): Promise<void> => {
        const response = await fetch(
          `http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/${source}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
            },
            body: JSON.stringify(buildBody(payload))
          }
        )
        expect(response.status).toBe(204)
      }

      await postHook('codex', {
        hook_event_name: 'UserPromptSubmit',
        prompt: 'parent codex'
      })
      await postHook('claude', {
        hook_event_name: 'Stop',
        last_assistant_message: 'child finished'
      })

      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          state: 'working',
          prompt: 'parent codex',
          agentType: 'codex'
        })
      ])
      const snapshot = server.getStatusSnapshot()[0]
      expect(snapshot.lastAssistantMessage).toBeUndefined()
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            state: 'working',
            prompt: 'parent codex',
            agentType: 'codex'
          })
        })
      )
    } finally {
      server.stop()
    }
  })

  it('maps registered legacy numeric HTTP pane keys to stable pane keys', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      server.registerPaneKeyAlias('tab-1:0', PANE)
      const env = server.buildPtyEnv()
      const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: JSON.stringify(
          buildBody(
            {
              hook_event_name: 'UserPromptSubmit',
              prompt: 'legacy pane'
            },
            { paneKey: 'tab-1:0' }
          )
        )
      })
      expect(response.status).toBe(204)

      const listener = vi.fn()
      server.setListener(listener)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: expect.objectContaining({
            state: 'working',
            prompt: 'legacy pane',
            agentType: 'claude'
          })
        })
      )
    } finally {
      server.stop()
    }
  })

  it('tracks hook posts with an empty paneKey before dropping them', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: JSON.stringify(
          buildBody(
            {
              hook_event_name: 'UserPromptSubmit',
              prompt: 'missing pane'
            },
            { paneKey: '' }
          )
        )
      })
      const listener = vi.fn()
      server.setListener(listener)

      expect(response.status).toBe(204)
      expect(listener).not.toHaveBeenCalled()
      expect(trackMock).toHaveBeenCalledWith('agent_hook_unattributed', {
        reason: 'empty_pane_key'
      })
    } finally {
      server.stop()
    }
  })

  // Why: agent-status-over-SSH §3 — ingestRemote must run the same warn-once
  // cross-build diagnostics the local HTTP path runs, so a remote source of
  // genuinely stale hooks emits the same signal locally.
  it('runs warn-once env/version diagnostics on relay-forwarded events', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const listener = vi.fn()
      server.setListener(listener)

      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          env: 'development',
          version: '999',
          payload: {
            state: 'working',
            paneKey: PANE,
            updatedAt: Date.now(),
            agentType: 'claude'
          }
        },
        'conn-1'
      )

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          connectionId: 'conn-1',
          payload: expect.objectContaining({ state: 'working', agentType: 'claude' })
        })
      )

      const warnCalls = warn.mock.calls.map((c) => String(c[0]))
      expect(warnCalls.some((m) => m.includes('v999'))).toBe(true)
      expect(warnCalls.some((m) => m.includes('development') && m.includes('production'))).toBe(
        true
      )

      const warnsAfterFirst = warn.mock.calls.length
      const secondPane = makePaneKey('tab-2', LEAF_2)
      server.ingestRemote(
        {
          paneKey: secondPane,
          env: 'development',
          version: '999',
          payload: {
            state: 'working',
            paneKey: secondPane,
            updatedAt: Date.now(),
            agentType: 'claude'
          }
        },
        'conn-1'
      )
      expect(warn.mock.calls.length).toBe(warnsAfterFirst)
      // Why: pin both invariants — warn-once dedupe AND fanout still fires for
      // the second event. Without the second assertion, a future refactor that
      // drops the second event silently would still leave warn-count unchanged.
      expect(listener).toHaveBeenCalledTimes(2)
    } finally {
      server.stop()
    }
  })

  it('treats remote env as normal relay traffic and normalizes payload at the trust boundary', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const listener = vi.fn()
      server.setListener(listener)

      const oversizedPrompt = 'x'.repeat(AGENT_STATUS_MAX_FIELD_LENGTH + 50)
      const remotePane = makePaneKey('tab-3', LEAF_3)
      server.ingestRemote(
        {
          paneKey: ` ${remotePane} `,
          tabId: ' tab-3 ',
          worktreeId: ' wt-3 ',
          env: 'remote',
          version: '1',
          payload: {
            state: 'done',
            prompt: oversizedPrompt,
            agentType: 'codex'
          }
        },
        ' conn-9 '
      )

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          paneKey: remotePane,
          tabId: 'tab-3',
          worktreeId: 'wt-3',
          connectionId: 'conn-9',
          payload: expect.objectContaining({
            state: 'done',
            agentType: 'codex',
            prompt: 'x'.repeat(AGENT_STATUS_MAX_FIELD_LENGTH)
          })
        })
      )
      expect(warn).not.toHaveBeenCalled()
    } finally {
      server.stop()
    }
  })

  it('accepts form-encoded hook posts from Unix managed scripts', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const params = new URLSearchParams({
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'repo::/tmp/worktree with "quotes"',
        env: 'production',
        version: env.ORCA_AGENT_HOOK_VERSION ?? '',
        payload: JSON.stringify({
          hook_event_name: 'UserPromptSubmit',
          prompt: 'form encoded'
        })
      })

      const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: params
      })
      expect(response.status).toBe(204)

      const listener = vi.fn()
      server.setListener(listener)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'repo::/tmp/worktree with "quotes"',
          connectionId: null,
          receivedAt: expect.any(Number),
          stateStartedAt: expect.any(Number),
          payload: expect.objectContaining({
            state: 'working',
            prompt: 'form encoded',
            agentType: 'claude'
          })
        })
      )
    } finally {
      server.stop()
    }
  })

  it('tracks Codex agent statuses from form-encoded managed hook posts', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const listener = vi.fn()
      server.setListener(listener)
      const postCodexHook = async (payload: Record<string, unknown>): Promise<void> => {
        const params = new URLSearchParams({
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          env: 'production',
          version: env.ORCA_AGENT_HOOK_VERSION ?? '',
          payload: JSON.stringify(payload)
        })
        const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/codex`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: params
        })
        expect(response.status).toBe(204)
      }

      await postCodexHook({
        hook_event_name: 'UserPromptSubmit',
        prompt: 'ship codex hook status'
      })
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          state: 'working',
          agentType: 'codex',
          prompt: 'ship codex hook status',
          toolName: undefined,
          toolInput: undefined
        })
      ])

      await postCodexHook({
        hook_event_name: 'PreToolUse',
        tool_name: 'exec_command',
        tool_input: { cmd: 'pnpm test', workdir: '/repo' }
      })
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'working',
          agentType: 'codex',
          prompt: 'ship codex hook status',
          toolName: 'exec_command',
          toolInput: 'pnpm test'
        })
      ])

      await postCodexHook({
        hook_event_name: 'PermissionRequest',
        tool_name: 'exec_command',
        tool_input: { cmd: 'git push', workdir: '/repo' }
      })
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'waiting',
          agentType: 'codex',
          prompt: 'ship codex hook status',
          toolName: 'exec_command',
          toolInput: 'git push'
        })
      ])

      await postCodexHook({
        hook_event_name: 'Stop',
        last_assistant_message: 'done'
      })
      expect(server.getStatusSnapshot()).toEqual([
        expect.objectContaining({
          state: 'done',
          agentType: 'codex',
          prompt: 'ship codex hook status',
          lastAssistantMessage: 'done'
        })
      ])
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: expect.objectContaining({
            state: 'done',
            agentType: 'codex',
            prompt: 'ship codex hook status',
            lastAssistantMessage: 'done'
          })
        })
      )
    } finally {
      server.stop()
    }
  })

  it('accepts Hermes plugin hook posts on /hook/hermes', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/hermes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: JSON.stringify(
          buildBody({
            hook_event_name: 'pre_llm_call',
            user_message: 'verify Hermes route'
          })
        )
      })
      expect(response.status).toBe(204)

      const listener = vi.fn()
      server.setListener(listener)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          connectionId: null,
          payload: expect.objectContaining({
            state: 'working',
            prompt: 'verify Hermes route',
            agentType: 'hermes'
          })
        })
      )
    } finally {
      server.stop()
    }
  })

  it('accepts Amp plugin hook posts on /hook/amp', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const listener = vi.fn()
      server.setListener(listener)

      const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/amp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: JSON.stringify(
          buildBody({
            hook_event_name: 'agent.start',
            message: 'verify Amp route'
          })
        )
      })
      expect(response.status).toBe(204)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          connectionId: null,
          payload: expect.objectContaining({
            state: 'working',
            prompt: 'verify Amp route',
            agentType: 'amp'
          })
        })
      )
    } finally {
      server.stop()
    }
  })
})

describe('Amp hook normalization', () => {
  it('maps agent lifecycle events to working and done states', () => {
    const start = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.start',
        message: 'wire Amp hooks'
      }),
      'production'
    )

    expect(start?.payload).toMatchObject({
      state: 'working',
      prompt: 'wire Amp hooks',
      agentType: 'amp'
    })

    const done = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.end',
        message: 'wire Amp hooks',
        status: 'done'
      }),
      'production'
    )

    expect(done?.payload).toMatchObject({
      state: 'done',
      prompt: 'wire Amp hooks',
      agentType: 'amp'
    })
  })

  it('surfaces Amp tool call and result context while preserving the prompt', () => {
    _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.start',
        message: 'run tests'
      }),
      'production'
    )

    const toolCall = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'tool.call',
        tool: 'shell_command',
        input: { command: 'pnpm test --run src/main/amp/hook-service.test.ts' }
      }),
      'production'
    )

    expect(toolCall?.payload).toMatchObject({
      state: 'working',
      prompt: 'run tests',
      agentType: 'amp',
      toolName: 'shell_command',
      toolInput: 'pnpm test --run src/main/amp/hook-service.test.ts'
    })

    const result = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'tool.result',
        tool: 'shell_command',
        input: { command: 'pnpm test --run src/main/amp/hook-service.test.ts' },
        status: 'done',
        output: 'tests passed'
      }),
      'production'
    )

    expect(result?.payload).toMatchObject({
      state: 'working',
      prompt: 'run tests',
      agentType: 'amp',
      toolName: 'shell_command',
      toolInput: 'pnpm test --run src/main/amp/hook-service.test.ts',
      lastAssistantMessage: 'tests passed'
    })
  })

  it('does not let Amp tool result messages overwrite the cached prompt', () => {
    _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.start',
        message: 'run tests'
      }),
      'production'
    )

    const result = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'tool.result',
        tool: 'shell_command',
        input: { command: 'pnpm test' },
        message: 'tests passed'
      }),
      'production'
    )

    expect(result?.payload).toMatchObject({
      state: 'working',
      prompt: 'run tests',
      agentType: 'amp',
      lastAssistantMessage: 'tests passed'
    })

    const done = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.end',
        status: 'done'
      }),
      'production'
    )

    expect(done?.payload).toMatchObject({
      state: 'done',
      prompt: 'run tests',
      agentType: 'amp'
    })
  })

  it('keeps Amp prompt and tool caches isolated by thread id within one pane', () => {
    _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.start',
        threadId: 'thread-a',
        message: 'first task'
      }),
      'production'
    )

    _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.start',
        threadId: 'thread-b',
        message: 'second task'
      }),
      'production'
    )

    const threadAResult = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'tool.result',
        threadId: 'thread-a',
        tool: 'shell_command',
        input: { command: 'pnpm test:a' },
        output: 'first done'
      }),
      'production'
    )

    expect(threadAResult?.payload).toMatchObject({
      state: 'working',
      prompt: 'first task',
      agentType: 'amp',
      toolName: 'shell_command',
      toolInput: 'pnpm test:a',
      lastAssistantMessage: 'first done'
    })

    const threadBDone = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.end',
        threadId: 'thread-b',
        status: 'done'
      }),
      'production'
    )

    expect(threadBDone?.payload).toMatchObject({
      state: 'done',
      prompt: 'second task',
      agentType: 'amp'
    })
  })

  it('drops stale Amp tool events that arrive after the thread ended', () => {
    _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.start',
        threadId: 'thread-a',
        message: 'run tests'
      }),
      'production'
    )

    const done = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.end',
        threadId: 'thread-a',
        status: 'done'
      }),
      'production'
    )

    expect(done?.payload).toMatchObject({
      state: 'done',
      prompt: 'run tests',
      agentType: 'amp'
    })

    const staleToolResult = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'tool.result',
        threadId: 'thread-a',
        tool: 'shell_command',
        input: { command: 'pnpm test' },
        message: 'tests passed'
      }),
      'production'
    )

    expect(staleToolResult).toBeNull()
  })

  it('does not mark Amp tool result messages as explicit prompts', () => {
    _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.start',
        threadId: 'thread-a',
        message: 'run tests'
      }),
      'production'
    )

    const result = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'tool.result',
        threadId: 'thread-a',
        tool: 'shell_command',
        input: { command: 'pnpm test' },
        message: 'tests passed'
      }),
      'production'
    )

    expect(result?.payload).toMatchObject({
      state: 'working',
      prompt: 'run tests',
      agentType: 'amp',
      lastAssistantMessage: 'tests passed'
    })
    expect(result?.hasExplicitPrompt).toBeUndefined()
  })

  it('marks cancelled Amp turns as interrupted done states', () => {
    const cancelled = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.end',
        message: 'stop this run',
        status: 'cancelled'
      }),
      'production'
    )

    expect(cancelled?.payload).toMatchObject({
      state: 'done',
      prompt: 'stop this run',
      agentType: 'amp',
      interrupted: true
    })
  })

  it('treats session.start as cache reset without creating a visible row', () => {
    _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'agent.start',
        message: 'old prompt'
      }),
      'production'
    )

    const sessionStart = _internals.normalizeHookPayload(
      'amp',
      buildBody({ hook_event_name: 'session.start', threadId: 'thread-1' }),
      'production'
    )
    expect(sessionStart).toBeNull()

    const nextTool = _internals.normalizeHookPayload(
      'amp',
      buildBody({
        hook_event_name: 'tool.call',
        tool: 'Read',
        input: { file_path: '/tmp/file.ts' }
      }),
      'production'
    )

    expect(nextTool?.payload).toMatchObject({
      state: 'working',
      prompt: '',
      agentType: 'amp',
      toolName: 'Read',
      toolInput: '/tmp/file.ts'
    })
  })
})

describe('AgentHookServer prompt-sent telemetry', () => {
  it('tracks a live local hook explicit prompt with conservative attribution', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: JSON.stringify(
          buildBody({
            hook_event_name: 'UserPromptSubmit',
            prompt: '  fix the spinner  '
          })
        )
      })

      expect(response.status).toBe(204)
      expect(trackMock).toHaveBeenCalledWith('agent_prompt_sent', {
        agent_kind: 'claude-code',
        launch_source: 'unknown',
        request_kind: 'followup',
        nth_repo_added: 2
      })
    } finally {
      server.stop()
    }
  })

  it('tracks a live SSH hook explicit prompt through ingestRemote', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: 'remote prompt', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(trackMock).toHaveBeenCalledWith('agent_prompt_sent', {
      agent_kind: 'codex',
      launch_source: 'unknown',
      request_kind: 'followup',
      nth_repo_added: 2
    })
  })

  it('dedupes adjacent same-turn reports without considering hook state', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: { state: 'working', prompt: 'same turn', agentType: 'claude' }
        },
        'conn-1'
      )
      vi.setSystemTime(1_500)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: { state: 'done', prompt: 'same turn', agentType: 'claude' }
        },
        'conn-1'
      )

      expect(trackMock).toHaveBeenCalledTimes(1)
      expect(trackMock).toHaveBeenCalledWith('agent_prompt_sent', {
        agent_kind: 'claude-code',
        launch_source: 'unknown',
        request_kind: 'followup',
        nth_repo_added: 2
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('tracks the same prompt again after a completed turn starts over', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: { state: 'working', prompt: 'continue', agentType: 'codex' }
        },
        'conn-1'
      )
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          payload: { state: 'done', prompt: 'continue', agentType: 'codex' }
        },
        'conn-1'
      )
      vi.setSystemTime(1_500)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: { state: 'working', prompt: 'continue', agentType: 'codex' }
        },
        'conn-1'
      )

      expect(trackMock).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('dedupes duplicate Command Code stop hooks but tracks same-prompt reruns', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        promptInteractionKey: 'command-code-transcript-user-1',
        payload: { state: 'done', prompt: 'rerun', agentType: 'codex' }
      },
      'conn-1'
    )
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        promptInteractionKey: 'command-code-transcript-user-1',
        payload: { state: 'done', prompt: 'rerun', agentType: 'codex' }
      },
      'conn-1'
    )
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        promptInteractionKey: 'command-code-transcript-user-2',
        payload: { state: 'done', prompt: 'rerun', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(trackMock).toHaveBeenCalledTimes(2)
  })

  it('dedupes Command Code direct prompt hooks followed by transcript-backed stop hooks', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: 'same command', agentType: 'codex' }
      },
      'conn-1'
    )
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        promptInteractionKey: 'command-code-transcript-a-1',
        payload: { state: 'done', prompt: 'same command', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(trackMock).toHaveBeenCalledTimes(1)
  })

  it('does not let a reused interaction key suppress different prompt text', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        promptInteractionKey: 'command-code-transcript-reused',
        payload: { state: 'done', prompt: 'first command', agentType: 'codex' }
      },
      'conn-1'
    )
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        promptInteractionKey: 'command-code-transcript-reused',
        payload: { state: 'done', prompt: 'second command', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(trackMock).toHaveBeenCalledTimes(2)
  })

  it('does not treat Command Code cached prompts as explicit prompt evidence', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'done', prompt: 'cached prompt', agentType: 'codex' }
      },
      'conn-1'
    )
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: false,
        payload: { state: 'done', prompt: 'cached prompt', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(trackMock).toHaveBeenCalledTimes(1)
  })

  it('preserves prompt dedupe when a live status row is dismissed', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: 'long turn', agentType: 'codex' }
      },
      'conn-1'
    )
    server.dropStatusEntry(PANE)
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: 'long turn', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(trackMock).toHaveBeenCalledTimes(1)
  })

  it('lets a dismissed completed row start the same prompt again', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'done', prompt: 'rerun after done', agentType: 'codex' }
      },
      'conn-1'
    )
    server.dropStatusEntry(PANE)
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: 'rerun after done', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(trackMock).toHaveBeenCalledTimes(2)
  })

  it('dedupes the same prompt until a completed turn boundary is observed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    try {
      const server = new AgentHookServer()
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: { state: 'working', prompt: 'repeat later', agentType: 'codex' }
        },
        'conn-1'
      )
      vi.setSystemTime(32_000)
      server.ingestRemote(
        {
          paneKey: PANE,
          tabId: 'tab-1',
          worktreeId: 'wt-1',
          hasExplicitPrompt: true,
          payload: { state: 'working', prompt: 'repeat later', agentType: 'codex' }
        },
        'conn-1'
      )

      expect(trackMock).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not track replays, empty prompts, or inherited prompt snapshots', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        isReplay: true,
        payload: { state: 'working', prompt: 'replayed prompt', agentType: 'codex' }
      },
      'conn-1'
    )
    server.ingestRemote(
      {
        paneKey: GOOD_PANE,
        tabId: 'tab-good',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: '   ', agentType: 'codex' }
      },
      'conn-1'
    )
    server.ingestRemote(
      {
        paneKey: FRESH_PANE,
        tabId: 'tab-fresh',
        worktreeId: 'wt-1',
        payload: { state: 'working', prompt: 'inherited prompt', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(trackMock).not.toHaveBeenCalledWith('agent_prompt_sent', expect.anything())
  })

  it('does not track hook status messages that preserve a cached prompt', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: 'real prompt', agentType: 'droid' }
      },
      'conn-1'
    )
    trackMock.mockClear()
    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: false,
        payload: { state: 'waiting', prompt: 'real prompt', agentType: 'droid' }
      },
      'conn-1'
    )

    expect(trackMock).not.toHaveBeenCalledWith('agent_prompt_sent', expect.anything())
  })

  it('tracks OpenCode user MessagePart hooks once per message id', async () => {
    const server = new AgentHookServer()
    await server.start({ env: 'production' })
    try {
      const env = server.buildPtyEnv()
      const response = await fetch(`http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/opencode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
        },
        body: JSON.stringify(
          buildBody({
            hook_event_name: 'MessagePart',
            role: 'user',
            text: 'fix',
            messageID: 'msg-1'
          })
        )
      })
      const updatedResponse = await fetch(
        `http://127.0.0.1:${env.ORCA_AGENT_HOOK_PORT}/hook/opencode`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Orca-Agent-Hook-Token': env.ORCA_AGENT_HOOK_TOKEN
          },
          body: JSON.stringify(
            buildBody({
              hook_event_name: 'MessagePart',
              role: 'user',
              text: 'fix tests',
              messageID: 'msg-1'
            })
          )
        }
      )

      expect(response.status).toBe(204)
      expect(updatedResponse.status).toBe(204)
      expect(server.getStatusSnapshot()[0]).toMatchObject({
        state: 'working',
        prompt: 'fix tests',
        agentType: 'opencode'
      })
      expect(trackMock).toHaveBeenCalledTimes(1)
      expect(trackMock).toHaveBeenCalledWith('agent_prompt_sent', {
        agent_kind: 'opencode',
        launch_source: 'unknown',
        request_kind: 'followup',
        nth_repo_added: 2
      })
    } finally {
      server.stop()
    }
  })

  it('maps custom hook agent types to other', () => {
    const server = new AgentHookServer()

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: 'custom prompt', agentType: 'my-local-agent' }
      },
      'conn-1'
    )

    expect(trackMock).toHaveBeenCalledWith('agent_prompt_sent', {
      agent_kind: 'other',
      launch_source: 'unknown',
      request_kind: 'followup',
      nth_repo_added: 2
    })
  })

  it('does not block status cache mutation or listener fanout when telemetry throws', () => {
    const server = new AgentHookServer()
    const listener = vi.fn()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    trackMock.mockImplementationOnce(() => {
      throw new Error('telemetry unavailable')
    })
    server.setListener(listener)

    server.ingestRemote(
      {
        paneKey: PANE,
        tabId: 'tab-1',
        worktreeId: 'wt-1',
        hasExplicitPrompt: true,
        payload: { state: 'working', prompt: 'keep status moving', agentType: 'codex' }
      },
      'conn-1'
    )

    expect(server.getStatusSnapshot()).toEqual([
      expect.objectContaining({
        paneKey: PANE,
        state: 'working',
        prompt: 'keep status moving',
        agentType: 'codex'
      })
    ])
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        paneKey: PANE,
        payload: expect.objectContaining({ prompt: 'keep status moving' })
      })
    )
    errorSpy.mockRestore()
  })
})

describe('Claude hook normalization', () => {
  it('PostToolUse for Edit surfaces toolName + file_path preview', () => {
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PostToolUse',
        tool_name: 'Edit',
        tool_input: { file_path: '/src/config.ts', old_string: 'a', new_string: 'b' },
        tool_response: {}
      }),
      'production'
    )
    expect(result?.payload.state).toBe('working')
    expect(result?.payload.toolName).toBe('Edit')
    expect(result?.payload.toolInput).toBe('/src/config.ts')
  })

  it('PostToolUse for Bash surfaces the command string', () => {
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test --run' },
        tool_response: { content: [{ type: 'text', text: 'tests passed' }] }
      }),
      'production'
    )
    expect(result?.payload.toolName).toBe('Bash')
    expect(result?.payload.toolInput).toBe('pnpm test --run')
    expect(result?.payload.lastAssistantMessage).toBe('tests passed')
  })

  it('PostToolUse for Grep surfaces the search pattern', () => {
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PostToolUse',
        tool_name: 'Grep',
        tool_input: { pattern: 'foo.*bar', path: '/src' }
      }),
      'production'
    )
    expect(result?.payload.toolName).toBe('Grep')
    expect(result?.payload.toolInput).toBe('foo.*bar')
  })

  it('PostToolUse for an unknown tool surfaces the name without input', () => {
    // Why: we use a per-tool allowlist to decide which field to preview.
    // Tools we do not recognize render as name-only rather than guessing at
    // a field, which avoids noisy/misleading previews (e.g. an opaque ID).
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PostToolUse',
        tool_name: 'BespokeTool',
        tool_input: { irrelevantFlag: true, summary: 'doing the thing' }
      }),
      'production'
    )
    expect(result?.payload.toolName).toBe('BespokeTool')
    expect(result?.payload.toolInput).toBeUndefined()
  })

  it('PostToolUse for TaskUpdate does not produce a misleading input preview', () => {
    // Why: TaskUpdate's tool_input (e.g. { task_id: "3", status: "in_progress" })
    // has no meaningful preview — rendering "3" is actively confusing. The
    // allowlist approach leaves toolInput undefined for unlisted tools.
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PostToolUse',
        tool_name: 'TaskUpdate',
        tool_input: { task_id: '3', status: 'in_progress' }
      }),
      'production'
    )
    expect(result?.payload.toolName).toBe('TaskUpdate')
    expect(result?.payload.toolInput).toBeUndefined()
  })

  it('PostToolUseFailure surfaces the error text as lastAssistantMessage', () => {
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PostToolUseFailure',
        tool_name: 'Edit',
        tool_input: { file_path: '/src/config.ts' },
        error: 'file is read-only'
      }),
      'production'
    )
    expect(result?.payload.state).toBe('working')
    expect(result?.payload.toolName).toBe('Edit')
    expect(result?.payload.lastAssistantMessage).toBe('file is read-only')
  })

  it('PreToolUse normalizes to working + tool fields', () => {
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PreToolUse',
        tool_name: 'Read',
        tool_input: { file_path: '/src/index.ts' }
      }),
      'production'
    )
    expect(result?.payload.state).toBe('working')
    expect(result?.payload.toolName).toBe('Read')
    expect(result?.payload.toolInput).toBe('/src/index.ts')
  })

  it('PermissionRequest normalizes to waiting + tool fields', () => {
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PermissionRequest',
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf build' }
      }),
      'production'
    )
    expect(result?.payload.state).toBe('waiting')
    expect(result?.payload.toolName).toBe('Bash')
    expect(result?.payload.toolInput).toBe('rm -rf build')
  })

  it('PermissionRequest for a fresh tool without input preview clears cached tool input', () => {
    _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' }
      }),
      'production'
    )

    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PermissionRequest',
        tool_name: 'BespokeTool',
        tool_input: { request_id: 'approval-1' }
      }),
      'production'
    )

    expect(result?.payload.state).toBe('waiting')
    expect(result?.payload.toolName).toBe('BespokeTool')
    expect(result?.payload.toolInput).toBeUndefined()
  })

  it('PermissionRequest for the same tool without input preview clears cached tool input', () => {
    _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PreToolUse',
        tool_name: 'BespokeTool',
        tool_input: 'old preview'
      }),
      'production'
    )

    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PermissionRequest',
        tool_name: 'BespokeTool',
        tool_input: { request_id: 'approval-1' }
      }),
      'production'
    )

    expect(result?.payload.state).toBe('waiting')
    expect(result?.payload.toolName).toBe('BespokeTool')
    expect(result?.payload.toolInput).toBeUndefined()
  })

  it('PermissionRequest without a tool name does not inherit stale tool details when input is explicit', () => {
    _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'pnpm test' }
      }),
      'production'
    )

    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PermissionRequest',
        tool_input: { request_id: 'approval-1' }
      }),
      'production'
    )

    expect(result?.payload.state).toBe('waiting')
    expect(result?.payload.toolName).toBeUndefined()
    expect(result?.payload.toolInput).toBeUndefined()
  })

  it('UserPromptSubmit clears the cached tool state from the prior turn', () => {
    _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PostToolUse',
        tool_name: 'Edit',
        tool_input: { file_path: '/src/stale.ts' }
      }),
      'production'
    )
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'UserPromptSubmit',
        prompt: 'Do the next thing'
      }),
      'production'
    )
    expect(result?.payload.state).toBe('working')
    expect(result?.payload.prompt).toBe('Do the next thing')
    expect(result?.payload.toolName).toBeUndefined()
    expect(result?.payload.toolInput).toBeUndefined()
  })

  it('Stop carries last_assistant_message directly when present', () => {
    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'Stop',
        last_assistant_message: 'what is up my dude'
      }),
      'production'
    )
    expect(result?.payload.state).toBe('done')
    expect(result?.payload.lastAssistantMessage).toBe('what is up my dude')
  })

  it('StopFailure maps to done without copying provider error text', () => {
    _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'UserPromptSubmit',
        prompt: 'say hi'
      }),
      'production'
    )

    const result = _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'StopFailure',
        error: 'invalid_request',
        error_details: 'model is not supported',
        last_assistant_message: 'API Error: model is not supported'
      }),
      'production'
    )

    expect(result?.payload.state).toBe('done')
    expect(result?.payload.prompt).toBe('say hi')
    expect(result?.payload.lastAssistantMessage).toBeUndefined()
  })

  describe('Stop transcript scan', () => {
    let tmpDir: string
    let transcriptPath: string

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'orca-hook-test-'))
      transcriptPath = join(tmpDir, 'transcript.jsonl')
    })

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true })
    })

    it('surfaces the most recent assistant text entry', () => {
      const lines = [
        { role: 'user', content: 'hi' },
        { role: 'assistant', message: { role: 'assistant', content: 'earlier reply' } },
        { role: 'user', content: 'do it' },
        {
          role: 'assistant',
          message: { role: 'assistant', content: [{ type: 'text', text: 'final reply' }] }
        }
      ]
      writeFileSync(transcriptPath, `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`)

      const result = _internals.normalizeHookPayload(
        'claude',
        buildBody({ hook_event_name: 'Stop', transcript_path: transcriptPath }),
        'production'
      )
      expect(result?.payload.lastAssistantMessage).toBe('final reply')
    })

    it('skips tool_use-only assistant entries to find the previous text reply', () => {
      const lines = [
        { role: 'assistant', message: { role: 'assistant', content: 'the answer is 42' } },
        {
          role: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } }]
          }
        }
      ]
      writeFileSync(transcriptPath, `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`)

      const result = _internals.normalizeHookPayload(
        'claude',
        buildBody({ hook_event_name: 'Stop', transcript_path: transcriptPath }),
        'production'
      )
      expect(result?.payload.lastAssistantMessage).toBe('the answer is 42')
    })

    it('finds an assistant reply that sits past the first chunk boundary', () => {
      // Why: a turn with many large tool_result entries pushes the final text
      // reply well past the first 64 KB chunk; the chunked scan should keep
      // reading backward until it finds it.
      const filler = 'x'.repeat(70_000)
      const lines = [
        { role: 'assistant', message: { role: 'assistant', content: 'deeply buried reply' } },
        // 70 KB of tool_result content straddling the first chunk boundary.
        {
          role: 'user',
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: 't1', content: filler }]
          }
        },
        {
          role: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } }]
          }
        }
      ]
      writeFileSync(transcriptPath, `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`)

      const result = _internals.normalizeHookPayload(
        'claude',
        buildBody({ hook_event_name: 'Stop', transcript_path: transcriptPath }),
        'production'
      )
      expect(result?.payload.lastAssistantMessage).toBe('deeply buried reply')
    })

    it('returns undefined when the transcript has no assistant text at all', () => {
      const lines = [
        { role: 'user', content: 'hi' },
        {
          role: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } }]
          }
        }
      ]
      writeFileSync(transcriptPath, `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`)

      const result = _internals.normalizeHookPayload(
        'claude',
        buildBody({ hook_event_name: 'Stop', transcript_path: transcriptPath }),
        'production'
      )
      expect(result?.payload.lastAssistantMessage).toBeUndefined()
    })
  })

  it('merges tool fields across consecutive events in the same turn', () => {
    _internals.normalizeHookPayload(
      'claude',
      buildBody({
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'ls -la' }
      }),
      'production'
    )
    // Stop event has no tool fields of its own — merged snapshot should still
    // carry the earlier PreToolUse values.
    const stop = _internals.normalizeHookPayload(
      'claude',
      buildBody({ hook_event_name: 'Stop' }),
      'production'
    )
    expect(stop?.payload.state).toBe('done')
    expect(stop?.payload.toolName).toBe('Bash')
    expect(stop?.payload.toolInput).toBe('ls -la')
  })
})

describe('Codex hook normalization', () => {
  it('Stop carries last_assistant_message into lastAssistantMessage', () => {
    const result = _internals.normalizeHookPayload(
      'codex',
      buildBody({
        hook_event_name: 'Stop',
        last_assistant_message: 'Summary of what I did.'
      }),
      'production'
    )
    expect(result?.payload.state).toBe('done')
    expect(result?.payload.lastAssistantMessage).toBe('Summary of what I did.')
  })

  it('PreToolUse surfaces tool name + input preview and stays in working state', () => {
    // Why: Codex's PreToolUse is NOT an approval prompt — it fires for every
    // tool call. We map it to `working` (never `waiting`) and use it only to
    // give the dashboard a live readout during the gap between prompt and
    // Stop. Real approval signals flow through PermissionRequest.
    const result = _internals.normalizeHookPayload(
      'codex',
      buildBody({
        hook_event_name: 'PreToolUse',
        tool_name: 'exec_command',
        tool_input: { cmd: 'git status', workdir: '/tmp' }
      }),
      'production'
    )
    expect(result?.payload.state).toBe('working')
    expect(result?.payload.toolName).toBe('exec_command')
    expect(result?.payload.toolInput).toBe('git status')
  })

  it('PermissionRequest maps to waiting and surfaces the pending tool input', () => {
    // Why: Codex asks for user attention through PermissionRequest. Orca's
    // sidebar red dot depends on this becoming `waiting`; treating it like
    // PreToolUse would leave the pane looking busy while it is blocked on the
    // user.
    const result = _internals.normalizeHookPayload(
      'codex',
      buildBody({
        hook_event_name: 'PermissionRequest',
        tool_name: 'exec_command',
        tool_input: { cmd: 'rm -rf build', workdir: '/tmp' }
      }),
      'production'
    )
    expect(result?.payload.state).toBe('waiting')
    expect(result?.payload.agentType).toBe('codex')
    expect(result?.payload.toolName).toBe('exec_command')
    expect(result?.payload.toolInput).toBe('rm -rf build')
  })

  it('UserPromptSubmit does not extract tool fields even when the payload carries them', () => {
    // Why: UserPromptSubmit is a turn-boundary event; any tool_name on it
    // would be leftover noise and should not leak into the working-state
    // preview. Tool extraction is gated to PreToolUse/PostToolUse.
    const result = _internals.normalizeHookPayload(
      'codex',
      buildBody({
        hook_event_name: 'UserPromptSubmit',
        prompt: 'Hello',
        tool_name: 'Edit',
        tool_input: { file_path: '/ignored.ts' }
      }),
      'production'
    )
    expect(result?.payload.state).toBe('working')
    expect(result?.payload.toolName).toBeUndefined()
    expect(result?.payload.toolInput).toBeUndefined()
  })

  it('SessionStart clears cached tool state from a prior session', () => {
    // Seed a Stop snapshot with an assistant message.
    _internals.normalizeHookPayload(
      'codex',
      buildBody({
        hook_event_name: 'Stop',
        last_assistant_message: 'Previous run finished'
      }),
      'production'
    )
    const result = _internals.normalizeHookPayload(
      'codex',
      buildBody({ hook_event_name: 'SessionStart' }),
      'production'
    )
    expect(result?.payload.state).toBe('working')
    expect(result?.payload.lastAssistantMessage).toBeUndefined()
  })

  it('SessionStart clears the cached prompt from a prior session until a new prompt arrives', () => {
    _internals.normalizeHookPayload(
      'codex',
      buildBody({
        hook_event_name: 'UserPromptSubmit',
        prompt: 'stale prompt'
      }),
      'production'
    )
    const result = _internals.normalizeHookPayload(
      'codex',
      buildBody({ hook_event_name: 'SessionStart' }),
      'production'
    )
    expect(result?.payload.state).toBe('working')
    expect(result?.payload.prompt).toBe('')
  })
})
