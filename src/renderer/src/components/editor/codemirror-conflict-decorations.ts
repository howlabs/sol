import { RangeSetBuilder } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { Decoration, ViewPlugin } from '@codemirror/view'
import type { DecorationSet, EditorView, ViewUpdate } from '@codemirror/view'
import { findGitConflictBlocks } from './conflict-markers'

const markerLine = Decoration.line({ class: 'orca-conflict-marker-line' })
const currentLine = Decoration.line({
  class: 'orca-conflict-section-line orca-conflict-current-line'
})
const baseLine = Decoration.line({
  class: 'orca-conflict-section-line orca-conflict-base-line'
})
const incomingLine = Decoration.line({
  class: 'orca-conflict-section-line orca-conflict-incoming-line'
})

function buildConflictDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const content = view.state.doc.toString()
  const blocks = findGitConflictBlocks(content)

  for (const block of blocks) {
    const ranges: { line: number; deco: typeof markerLine }[] = []
    const currentEnd = (block.baseLine ?? block.separatorLine) - 1
    for (let line = block.startLine + 1; line <= currentEnd; line += 1) {
      ranges.push({ line, deco: currentLine })
    }
    if (block.baseLine) {
      for (let line = block.baseLine + 1; line <= block.separatorLine - 1; line += 1) {
        ranges.push({ line, deco: baseLine })
      }
    }
    for (let line = block.separatorLine + 1; line <= block.endLine - 1; line += 1) {
      ranges.push({ line, deco: incomingLine })
    }
    ranges.push(
      { line: block.startLine, deco: markerLine },
      ...(block.baseLine ? [{ line: block.baseLine, deco: markerLine }] : []),
      { line: block.separatorLine, deco: markerLine },
      { line: block.endLine, deco: markerLine }
    )
    ranges.sort((a, b) => a.line - b.line)
    for (const { line, deco } of ranges) {
      if (line < 1 || line > view.state.doc.lines) {
        continue
      }
      const from = view.state.doc.line(line).from
      builder.add(from, from, deco)
    }
  }

  return builder.finish()
}

export function conflictDecorationsExtension(enabled: boolean): Extension {
  if (!enabled) {
    return []
  }
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) {
        this.decorations = buildConflictDecorations(view)
      }
      update(update: ViewUpdate): void {
        if (update.docChanged) {
          this.decorations = buildConflictDecorations(update.view)
        }
      }
    },
    { decorations: (value) => value.decorations }
  )
}
