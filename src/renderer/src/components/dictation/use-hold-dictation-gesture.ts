import { useEffect, type MutableRefObject } from 'react'
import type { KeybindingOverrides } from '../../../../shared/keybindings'
import { resolveVoiceSettings, type DictationState } from '../../../../shared/speech-types'
import type { GlobalSettings } from '../../../../shared/types'
import type { DictationInsertionTarget } from './dictation-insertion-target'

type HoldDictationGestureOptions = {
  dictationStateRef: MutableRefObject<DictationState>
  holdGestureActiveRef: MutableRefObject<boolean>
  insertionTargetRef: MutableRefObject<DictationInsertionTarget | null>
  intentionalTargetCancellationRef: MutableRefObject<boolean>
  keybindings: KeybindingOverrides
  settings: GlobalSettings | null
  startDictation: () => Promise<void> | void
  stopDictation: () => Promise<void> | void
}

export function useHoldDictationGesture({
  dictationStateRef: _dictationStateRef,
  holdGestureActiveRef: _holdGestureActiveRef,
  insertionTargetRef: _insertionTargetRef,
  intentionalTargetCancellationRef: _intentionalTargetCancellationRef,
  keybindings: _keybindings,
  settings,
  startDictation: _startDictation,
  stopDictation: _stopDictation
}: HoldDictationGestureOptions): void {
  // Why: hold-mode dictation depended on voice.dictation bindings removed in PR1.
  useEffect(() => {
    if (resolveVoiceSettings(settings ?? {}).dictationMode === 'hold') {
      // Hold gesture handlers were removed with voice dictation bindings in PR1.
    }
  }, [settings])
}
