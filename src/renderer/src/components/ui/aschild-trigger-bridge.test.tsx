// @vitest-environment happy-dom

import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { Button } from './button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from './dialog'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const roots: Root[] = []

afterEach(() => {
  roots.splice(0).forEach((root) => {
    act(() => root.unmount())
  })
  document.body.replaceChildren()
})

function render(ui: React.ReactNode): void {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  roots.push(root)
  act(() => {
    root.render(ui)
  })
}

describe('asChild trigger bridges (Base UI render + nativeButton)', () => {
  it('CollapsibleTrigger asChild + Button does not nest buttons', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost">
            Toggle
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>Panel</CollapsibleContent>
      </Collapsible>
    )

    const buttons = document.body.querySelectorAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.textContent).toContain('Toggle')
    expect(buttons[0]?.getAttribute('aria-expanded')).toBe('false')
    expect(buttons[0]?.getAttribute('data-slot')).toBe('collapsible-trigger')
  })

  it('DialogTrigger asChild + Button does not nest buttons', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="ghost">
            Open
          </Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>Body</DialogContent>
      </Dialog>
    )

    const buttons = document.body.querySelectorAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.textContent).toContain('Open')
    expect(buttons[0]?.getAttribute('data-slot')).toBe('dialog-trigger')
  })

  it('DialogClose asChild + Button does not nest buttons when dialog is open', () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Dismiss
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    )

    const dismiss = Array.from(document.body.querySelectorAll('button')).find((el) =>
      el.textContent?.includes('Dismiss')
    )
    expect(dismiss).toBeDefined()
    expect(dismiss?.parentElement?.tagName.toLowerCase()).not.toBe('button')
    // Why: Close render merges onto Button; slot may be dialog-close or button.
    expect(dismiss?.tagName.toLowerCase()).toBe('button')
  })
})
