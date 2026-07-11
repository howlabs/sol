import { describe, expect, it } from 'vitest'
import { parseMessageGraphSessionContent } from './session-scanner-graph-parsers'

describe('AI Vault graph session parsers', () => {
  it('parses Pi message-graph JSONL content', async () => {
    const content = [
      JSON.stringify({
        type: 'session',
        id: 'pi-session',
        timestamp: '2026-05-01T10:00:00.000Z',
        cwd: '/tmp/pi'
      }),
      JSON.stringify({
        type: 'message',
        timestamp: '2026-05-01T10:00:01.000Z',
        message: { role: 'user', content: [{ type: 'text', text: 'Pi vault title' }] }
      })
    ].join('\n')

    const session = await parseMessageGraphSessionContent(
      'pi',
      {
        path: '/tmp/pi-session.jsonl',
        mtimeMs: Date.now(),
        modifiedAt: '2026-05-01T10:00:01.000Z'
      },
      content,
      'darwin'
    )

    expect(session?.agent).toBe('pi')
    expect(session?.sessionId).toBe('pi-session')
    expect(session?.title).toBe('Pi vault title')
    expect(session?.cwd).toBe('/tmp/pi')
  })
})
