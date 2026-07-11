// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { ScrollArea } from './scroll-area'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Why: Base UI ScrollArea uses getAnimations(); happy-dom does not implement it.
if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
  Element.prototype.getAnimations = () => []
}

const roots: Root[] = []

afterEach(() => {
  roots.splice(0).forEach((root) => {
    act(() => root.unmount())
  })
  document.body.replaceChildren()
})

describe('ScrollArea sizing footgun', () => {
  // Why: Root's inline `position: relative` always beats an `absolute` class,
  // so the ScrollArea must be sized by height (h-full), not absolute — locked here.
  it('keeps Root inline position:relative even when given an absolute className', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    roots.push(root)

    await act(async () => {
      root.render(
        <ScrollArea className="absolute inset-0">
          <div />
        </ScrollArea>
      )
    })

    const el = container.querySelector<HTMLElement>('[data-slot="scroll-area"]')
    expect(el).not.toBeNull()
    expect(el!.style.position).toBe('relative')
  })

  it('merges root style while keeping position:relative and forwards viewportProps', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    roots.push(root)

    await act(async () => {
      root.render(
        <ScrollArea
          style={{ maxHeight: 'var(--available-height)' }}
          viewportProps={{ style: { maxHeight: 'var(--available-height)' } }}
        >
          <div />
        </ScrollArea>
      )
    })

    const el = container.querySelector<HTMLElement>('[data-slot="scroll-area"]')
    const viewport = container.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    expect(el?.style.position).toBe('relative')
    expect(el?.style.maxHeight).toBe('var(--available-height)')
    expect(viewport?.style.maxHeight).toBe('var(--available-height)')
  })

  // Why: the Base UI migration (13a9877c9) accidentally dropped viewportRef,
  // viewportTabIndex, and viewportClassName forwarding, which made the File
  // Explorer virtualizer receive a null scroll element and render zero rows.
  it('forwards viewportRef, viewportTabIndex, and viewportClassName to the viewport', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    roots.push(root)

    const ref = { current: null as HTMLDivElement | null }

    await act(async () => {
      root.render(
        <ScrollArea viewportRef={ref} viewportTabIndex={-1} viewportClassName="h-full min-h-0 py-2">
          <div />
        </ScrollArea>
      )
    })

    const viewport = container.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    expect(ref.current).toBe(viewport)
    expect(viewport?.tabIndex).toBe(-1)
    expect(viewport?.className).toContain('h-full')
    expect(viewport?.className).toContain('py-2')
  })
})
