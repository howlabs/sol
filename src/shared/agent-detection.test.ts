import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  detectAgentStatusFromTitle,
  extractAllOscTitles,
  extractLastOscTitle,
  getAgentLabel,
  MAX_OSC_TITLE_CHARS,
  normalizeTerminalTitle
} from './agent-detection'
import {
  hasCompatibleAgentTitleIdentity,
  normalizeCompatibleAgentStatusEntryForOwner,
  normalizeCompatibleAgentTitleForOwner,
  resolveCompatibleAgentTypeForOwner
} from './agent-title-owner'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OSC title extraction', () => {
  it('extracts the last OSC title from BEL-terminated PTY data', () => {
    expect(extractLastOscTitle('\x1b]0;First\x07noise\x1b]2;Second\x07')).toBe('Second')
  })

  it('extracts all OSC titles including ST-terminated titles', () => {
    expect(extractAllOscTitles('\x1b]0;First\x1b\\noise\x1b]2;Second\x07')).toEqual([
      'First',
      'Second'
    ])
  })

  it('ignores incomplete OSC titles until a later chunk supplies the terminator', () => {
    expect(extractAllOscTitles('\x1b]0;Incomplete title')).toEqual([])
    expect(extractLastOscTitle('\x1b]0;Incomplete title')).toBeNull()
  })

  it('recovers when an abandoned incomplete OSC title is followed by a fresh title', () => {
    const data = '\x1b]0;abandoned\x1b]0;Fresh title\x07'

    expect(extractLastOscTitle(data)).toBe('Fresh title')
    expect(extractAllOscTitles(data)).toEqual(['Fresh title'])
  })

  it('scans large PTY chunks without regex match iteration', () => {
    const matchAll = vi.spyOn(String.prototype, 'matchAll')
    const data = `${'pasted terminal noise \x1b]x;ignored\x07 '.repeat(10_000)}\x1b]0;Agent working\x07`

    expect(extractLastOscTitle(data)).toBe('Agent working')
    expect(extractAllOscTitles(data).at(-1)).toBe('Agent working')
    expect(matchAll).not.toHaveBeenCalled()
  })

  it('caps oversized OSC titles before downstream title processing', () => {
    const title = `${'a'.repeat(MAX_OSC_TITLE_CHARS)}${'b'.repeat(10_000)}`
    const data = `before\x1b]0;${title}\x07after`

    const extracted = extractLastOscTitle(data)

    expect(extracted).toHaveLength(MAX_OSC_TITLE_CHARS)
    expect(extracted?.startsWith('a'.repeat(MAX_OSC_TITLE_CHARS / 2))).toBe(true)
    expect(extracted?.endsWith('b'.repeat(MAX_OSC_TITLE_CHARS / 2))).toBe(true)
    expect(extractAllOscTitles(data)).toEqual([extracted])
  })
})

describe('Pi-compatible title detection', () => {
  it.each([
    ['\u280b Pi', 'Pi', 'working'],
    ['Pi ready', 'Pi', 'idle'],
    // Why: normalizeTerminalTitle collapses idle π frames to bare "Pi"; re-detection
    // from stored lastOscTitle must still classify idle, not neutral.
    ['Pi', 'Pi', 'idle'],
    ['Pi - action required', 'Pi', 'permission']
  ] as const)('classifies synthesized %s', (title, expectedLabel, expectedStatus) => {
    expect(getAgentLabel(title)).toBe(expectedLabel)
    expect(detectAgentStatusFromTitle(title)).toBe(expectedStatus)
  })

  it('re-detects status after display-title normalization for Pi idle frames', () => {
    expect(normalizeTerminalTitle('π - my-project')).toBe('Pi')
    expect(detectAgentStatusFromTitle(normalizeTerminalTitle('π - my-project'))).toBe('idle')
    expect(detectAgentStatusFromTitle(normalizeTerminalTitle('\u280b π - my-project'))).toBe(
      'working'
    )
  })

  it.each([
    ['\u280b Pi', 'pi', '\u280b Pi'],
    ['Pi ready', 'pi', 'Pi ready'],
    ['Pi - action required', 'pi', 'Pi - action required'],
    ['π - tmp', 'pi', 'Pi ready'],
    ['π: tmp', 'pi', 'Pi ready'],
    ['\u280b π: tmp', 'pi', '\u280b Pi'],
    ['\u280b π - tmp', 'pi', '\u280b Pi']
  ] as const)('normalizes %s under the authoritative %s owner', (title, owner, expectedTitle) => {
    expect(normalizeCompatibleAgentTitleForOwner(title, owner)).toBe(expectedTitle)
  })

  it('preserves custom titles and unrelated owners', () => {
    expect(normalizeCompatibleAgentTitleForOwner('Fix pi bugs', 'pi')).toBe('Fix pi bugs')
    expect(normalizeCompatibleAgentTitleForOwner('\u280b Pi', 'codex')).toBe('\u280b Pi')
  })

  it('identifies titles whose compatible identity can be re-owned', () => {
    expect(hasCompatibleAgentTitleIdentity('Pi ready')).toBe(true)
    expect(hasCompatibleAgentTitleIdentity('π - tmp')).toBe(true)
    expect(hasCompatibleAgentTitleIdentity('Fix pi bugs')).toBe(false)
    expect(hasCompatibleAgentTitleIdentity('\u280b Codex')).toBe(false)
  })

  it('normalizes Pi-compatible status identity and terminal title to the owner', () => {
    const status = normalizeCompatibleAgentStatusEntryForOwner(
      {
        state: 'working',
        prompt: '',
        updatedAt: 1,
        stateStartedAt: 1,
        agentType: 'pi',
        paneKey: 'tab-1:leaf-1',
        terminalTitle: '\u280b Pi',
        stateHistory: []
      },
      'pi'
    )

    expect(status.agentType).toBe('pi')
    expect(status.terminalTitle).toBe('\u280b Pi')
    expect(resolveCompatibleAgentTypeForOwner('codex', 'pi')).toBe('codex')
  })

  it.each(['~/omp/working', 'omp-harness ready', 'OMP ready', '~/pi/working', 'pi-scratch ready'])(
    'does not classify path, hyphen, or retired-agent false positive %s',
    (title) => {
      expect(getAgentLabel(title)).toBeNull()
      expect(detectAgentStatusFromTitle(title)).toBeNull()
    }
  )
})
