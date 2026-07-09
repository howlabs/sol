// @vitest-environment happy-dom

import { createRef, type MutableRefObject } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DictationState } from '../../../../shared/speech-types'
import type { GlobalSettings } from '../../../../shared/types'
import type { DictationInsertionTarget } from './dictation-insertion-target'
import { useHoldDictationGesture } from './use-hold-dictation-gesture'

let root: Root | null = null
let container: HTMLDivElement | null = null

function Probe(): null {
  useHoldDictationGesture({
    dictationStateRef: createRef() as MutableRefObject<DictationState>,
    holdGestureActiveRef: createRef() as MutableRefObject<boolean>,
    insertionTargetRef: createRef() as MutableRefObject<DictationInsertionTarget | null>,
    intentionalTargetCancellationRef: createRef() as MutableRefObject<boolean>,
    keybindings: {},
    settings: { voice: { dictationMode: 'hold' } } as GlobalSettings,
    startDictation: vi.fn(),
    stopDictation: vi.fn()
  })
  return null
}

describe('useHoldDictationGesture', () => {
  afterEach(() => {
    root?.unmount()
    root = null
    container?.remove()
    container = null
  })

  it('does not register hold-mode listeners after voice.dictation removal', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root!.render(<Probe />)
    })
    expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function), true)
    addSpy.mockRestore()
  })
})
