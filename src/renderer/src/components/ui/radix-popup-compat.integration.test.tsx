// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog, DialogContent } from './dialog'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Why: Base UI ScrollArea/floating may touch getAnimations in some paths.
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

describe('Phase F radix popup integration', () => {
  it('does not leak Radix dismiss/focus props onto the dialog popup DOM node', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    roots.push(root)

    await act(async () => {
      root.render(
        <Dialog open>
          <DialogContent
            showCloseButton={false}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
            onFocusOutside={(event) => event.preventDefault()}
          >
            <div>body</div>
          </DialogContent>
        </Dialog>
      )
    })

    const popup = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(popup).not.toBeNull()
    // Unknown React props would surface as attributes or still be set on the node.
    expect(popup?.getAttribute('onOpenAutoFocus')).toBeNull()
    expect(popup?.getAttribute('oninteractoutside')).toBeNull()
    expect('onOpenAutoFocus' in (popup as object)).toBe(false)
  })

  it('keeps popover open when onInteractOutside preventDefault runs for outsidePress', async () => {
    const onOpenChange = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    roots.push(root)

    await act(async () => {
      root.render(
        <Popover open onOpenChange={onOpenChange}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent onInteractOutside={(event) => event.preventDefault()}>
            <div>menu</div>
          </PopoverContent>
        </Popover>
      )
    })

    // Simulate what Base UI emits on outside press through our Root shim path.
    const { applyRadixDismissHandlers } = await import('./radix-popup-compat')
    const cancel = vi.fn()
    applyRadixDismissHandlers([{ onInteractOutside: (event) => event.preventDefault() }], false, {
      reason: 'outsidePress',
      event: new MouseEvent('pointerdown'),
      cancel,
      isCanceled: false
    })
    expect(cancel).toHaveBeenCalled()

    const popup = document.querySelector('[data-slot="popover-content"]')
    expect(popup).not.toBeNull()
  })
})
