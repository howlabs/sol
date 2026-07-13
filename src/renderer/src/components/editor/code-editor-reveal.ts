import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'
import { computeRevealRange } from './editor-reveal-range'

export const revealHighlightEffect = StateEffect.define<{ from: number; to: number } | null>()

export const revealHighlightField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const effect of tr.effects) {
      if (effect.is(revealHighlightEffect)) {
        if (!effect.value) {
          return Decoration.none
        }
        return Decoration.set([
          Decoration.mark({ class: 'cm-search-result-highlight' }).range(
            effect.value.from,
            effect.value.to
          )
        ])
      }
    }
    return deco.map(tr.changes)
  },
  provide: (field) => EditorView.decorations.from(field)
})

export function applyCodeEditorReveal(
  view: EditorView,
  line: number,
  column: number,
  matchLength: number,
  onHighlightTimeout: (clear: () => void) => void
): void {
  const doc = view.state.doc
  const range = computeRevealRange({
    line,
    column,
    matchLength,
    maxLine: doc.lines,
    lineMaxColumn: doc.line(Math.min(Math.max(1, line), doc.lines)).length + 1
  })
  const lineObj = doc.line(range.startLineNumber)
  const from = Math.min(lineObj.from + range.startColumn - 1, lineObj.to)
  const to = Math.min(lineObj.from + range.endColumn - 1, lineObj.to)
  const shouldHighlight = matchLength > 0
  view.dispatch({
    selection: shouldHighlight
      ? { anchor: from, head: Math.max(from + 1, to) }
      : { anchor: from, head: from },
    effects: shouldHighlight
      ? revealHighlightEffect.of({ from, to: Math.max(from + 1, to) })
      : revealHighlightEffect.of(null),
    scrollIntoView: true
  })
  if (shouldHighlight) {
    onHighlightTimeout(() => {
      view.dispatch({ effects: revealHighlightEffect.of(null) })
    })
  }
  view.focus()
}
