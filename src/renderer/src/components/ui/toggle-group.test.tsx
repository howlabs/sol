// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const roots: Root[] = []

afterEach(() => {
  roots.splice(0).forEach((root) => {
    act(() => root.unmount())
  })
  document.body.replaceChildren()
})

describe('ToggleGroup Base UI / Radix bridge', () => {
  it('marks the controlled single value as pressed (Group by selection)', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    roots.push(root)

    await act(async () => {
      root.render(
        <ToggleGroup type="single" value="repo" onValueChange={() => undefined}>
          <ToggleGroupItem value="none">None</ToggleGroupItem>
          <ToggleGroupItem value="repo">Project</ToggleGroupItem>
          <ToggleGroupItem value="status">Status</ToggleGroupItem>
        </ToggleGroup>
      )
    })

    const items = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[data-slot="toggle-group-item"]')
    )
    expect(items).toHaveLength(3)
    const project = items.find((item) => item.textContent === 'Project')
    const none = items.find((item) => item.textContent === 'None')
    expect(project?.getAttribute('aria-pressed')).toBe('true')
    expect(project?.hasAttribute('data-pressed')).toBe(true)
    expect(none?.getAttribute('aria-pressed')).toBe('false')
  })

  it('emits a string onValueChange for type=single', async () => {
    const onValueChange = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    roots.push(root)

    await act(async () => {
      root.render(
        <ToggleGroup type="single" value="none" onValueChange={onValueChange}>
          <ToggleGroupItem value="none">None</ToggleGroupItem>
          <ToggleGroupItem value="repo">Project</ToggleGroupItem>
        </ToggleGroup>
      )
    })

    const project = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[data-slot="toggle-group-item"]')
    ).find((item) => item.textContent === 'Project')
    expect(project).toBeTruthy()

    await act(async () => {
      project?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onValueChange).toHaveBeenCalled()
    const firstArg = onValueChange.mock.calls.at(-1)?.[0]
    expect(firstArg).toBe('repo')
  })
})
