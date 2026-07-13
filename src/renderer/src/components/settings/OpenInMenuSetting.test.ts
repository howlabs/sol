import { describe, expect, it } from 'vitest'
import {
  createPresetOpenInApplication,
  shouldCommitOpenInApplicationsDraft
} from './OpenInMenuSetting'
import {
  getOpenInAppPresets,
  isOpenInAppPresetAdded,
  OpenInApplicationIcon
} from '@/lib/open-in-app-catalog'
import type { OpenInAppPreset } from '@/lib/open-in-app-catalog'

function requirePreset(id: string): OpenInAppPreset {
  const preset = getOpenInAppPresets().find((entry) => entry.id === id)
  if (!preset) {
    throw new Error(`Preset not found: ${id}`)
  }
  return preset
}

describe('OpenInMenuSetting presets', () => {
  it('creates stable preset rows for known apps', () => {
    const cursor = requirePreset('codex')

    expect(createPresetOpenInApplication(cursor)).toEqual({
      id: 'codex',
      label: 'Cursor',
      command: 'codex'
    })
  })

  it('recognizes legacy preset rows by command', () => {
    const cursor = requirePreset('codex')

    expect(isOpenInAppPresetAdded([{ command: ' cursor ' }], cursor)).toBe(true)
  })

  it('keeps the Zed icon visible on dark menus', () => {
    const icon = OpenInApplicationIcon({ application: { command: 'zed' } })

    expect(icon.props.className).toContain('dark:invert')
  })
})

describe('OpenInMenuSetting application drafts', () => {
  it('does not commit rows until both label and command are present', () => {
    expect(
      shouldCommitOpenInApplicationsDraft([{ id: 'draft', label: 'Cursor', command: '' }])
    ).toBe(false)
    expect(
      shouldCommitOpenInApplicationsDraft([{ id: 'draft', label: '', command: 'codex' }])
    ).toBe(false)
    expect(
      shouldCommitOpenInApplicationsDraft([{ id: 'draft', label: '   ', command: 'codex' }])
    ).toBe(false)
    expect(
      shouldCommitOpenInApplicationsDraft([{ id: 'draft', label: 'Cursor', command: '   ' }])
    ).toBe(false)
  })

  it('allows commit when every draft row has a label and command', () => {
    expect(shouldCommitOpenInApplicationsDraft([])).toBe(true)
    expect(
      shouldCommitOpenInApplicationsDraft([{ id: 'codex', label: 'Cursor', command: 'codex' }])
    ).toBe(true)
    expect(
      shouldCommitOpenInApplicationsDraft([
        { id: 'codex', label: 'Cursor', command: 'codex' },
        { id: 'zed', label: 'Zed', command: 'zed' }
      ])
    ).toBe(true)
  })
})
