// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SETTINGS_SWITCH_HIT_TARGET_CLASS,
  SETTINGS_SWITCH_TRACK_CLASS,
  SettingsSwitch
} from './SettingsFormControls'

describe('SettingsSwitch', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    document.body.replaceChildren()
  })

  it('exports a larger hit target while keeping the track compact', () => {
    expect(SETTINGS_SWITCH_HIT_TARGET_CLASS).toContain('min-h-7')
    expect(SETTINGS_SWITCH_HIT_TARGET_CLASS).toContain('min-w-9')
    expect(SETTINGS_SWITCH_TRACK_CLASS).toContain('h-4')
    expect(SETTINGS_SWITCH_TRACK_CLASS).toContain('w-7')
  })

  it('renders checked/disabled/aria props and invokes onChange', async () => {
    const onChange = vi.fn()

    await act(async () => {
      root.render(
        <SettingsSwitch
          checked
          disabled={false}
          ariaLabel="Enable task source"
          ariaDescribedBy="task-source-help"
          onChange={onChange}
        />
      )
    })

    const switchButton = container.querySelector<HTMLButtonElement>('button[role="switch"]')
    expect(switchButton).not.toBeNull()
    expect(switchButton?.getAttribute('aria-checked')).toBe('true')
    expect(switchButton?.getAttribute('aria-label')).toBe('Enable task source')
    expect(switchButton?.getAttribute('aria-describedby')).toBe('task-source-help')
    expect(switchButton?.className).toBe(SETTINGS_SWITCH_HIT_TARGET_CLASS)
    expect(switchButton?.className).toContain('focus-visible:ring-2')

    const track = switchButton?.querySelector('span')
    expect(track?.className).toContain(SETTINGS_SWITCH_TRACK_CLASS)
    expect(track?.className).toContain('bg-foreground')

    await act(async () => {
      switchButton?.click()
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('marks the control disabled without firing onChange', async () => {
    const onChange = vi.fn()

    await act(async () => {
      root.render(<SettingsSwitch checked={false} disabled onChange={onChange} />)
    })

    const switchButton = container.querySelector<HTMLButtonElement>('button[role="switch"]')
    expect(switchButton?.disabled).toBe(true)
    expect(switchButton?.getAttribute('aria-checked')).toBe('false')

    const track = switchButton?.querySelector('span')
    expect(track?.className).toContain('bg-muted-foreground/30')

    await act(async () => {
      switchButton?.click()
    })
    expect(onChange).not.toHaveBeenCalled()
  })
})
