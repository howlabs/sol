// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest'
import {
  applyRadixDismissHandlers,
  createRadixPreventableEvent,
  mapRadixCloseAutoFocus,
  mapRadixOpenAutoFocus,
  splitRadixContentCompatProps
} from './radix-popup-compat'

describe('radix-popup-compat', () => {
  it('maps onOpenAutoFocus preventDefault to initialFocus false', () => {
    const mapped = mapRadixOpenAutoFocus((event) => event.preventDefault(), undefined)
    expect(typeof mapped).toBe('function')
    expect((mapped as () => boolean)()).toBe(false)
  })

  it('maps onOpenAutoFocus without preventDefault to initialFocus true', () => {
    const mapped = mapRadixOpenAutoFocus(() => undefined, undefined)
    expect((mapped as () => boolean)()).toBe(true)
  })

  it('prefers explicit initialFocus over onOpenAutoFocus', () => {
    expect(mapRadixOpenAutoFocus((e) => e.preventDefault(), false)).toBe(false)
  })

  it('maps onCloseAutoFocus preventDefault to finalFocus false', () => {
    const mapped = mapRadixCloseAutoFocus((event) => event.preventDefault(), undefined)
    expect((mapped as () => boolean)()).toBe(false)
  })

  it('cancels outsidePress when onInteractOutside preventDefault', () => {
    const cancel = vi.fn()
    const target = document.createElement('div')
    applyRadixDismissHandlers(
      [
        {
          onInteractOutside: (event) => {
            if (event.target === target) {
              event.preventDefault()
            }
          }
        }
      ],
      false,
      {
        reason: 'outsidePress',
        event: { target } as unknown as Event,
        cancel,
        isCanceled: false
      }
    )
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('cancels escapeKey when onEscapeKeyDown preventDefault', () => {
    const cancel = vi.fn()
    applyRadixDismissHandlers([{ onEscapeKeyDown: (event) => event.preventDefault() }], false, {
      reason: 'escapeKey',
      event: new KeyboardEvent('keydown', { key: 'Escape' }),
      cancel,
      isCanceled: false
    })
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('does not cancel open transitions', () => {
    const cancel = vi.fn()
    applyRadixDismissHandlers([{ onInteractOutside: (event) => event.preventDefault() }], true, {
      reason: 'outsidePress',
      cancel,
      isCanceled: false
    })
    expect(cancel).not.toHaveBeenCalled()
  })

  it('strips radix props from rest', () => {
    const { radix, rest } = splitRadixContentCompatProps({
      className: 'x',
      onOpenAutoFocus: () => undefined,
      onInteractOutside: () => undefined,
      side: 'bottom'
    })
    expect(radix.onOpenAutoFocus).toEqual(expect.any(Function))
    expect(radix.onInteractOutside).toEqual(expect.any(Function))
    expect(rest).toEqual({ className: 'x', side: 'bottom' })
  })

  it('createRadixPreventableEvent tracks preventDefault', () => {
    const event = createRadixPreventableEvent(null, 'test')
    expect(event.defaultPrevented).toBe(false)
    event.preventDefault()
    expect(event.defaultPrevented).toBe(true)
  })
})
