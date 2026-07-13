import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

/** Theme for single-file CodeMirror diffs using Sol CSS tokens. */
export function codemirrorDiffTheme(
  fontSize: number,
  fontFamily: string,
  wordWrap: boolean
): Extension[] {
  return [
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        fontFamily,
        backgroundColor: 'var(--editor-surface)',
        color: 'var(--foreground)'
      },
      '.cm-content': {
        caretColor: 'var(--foreground)',
        padding: '4px 0',
        fontFamily
      },
      '.cm-gutters': {
        backgroundColor: 'var(--editor-surface)',
        color: 'var(--muted-foreground)',
        border: 'none'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'color-mix(in srgb, var(--foreground) 6%, var(--editor-surface))'
      },
      '.cm-activeLine': {
        backgroundColor: 'color-mix(in srgb, var(--foreground) 4%, var(--editor-surface))'
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'color-mix(in srgb, var(--ring) 35%, transparent)'
      },
      '.cm-selectionBackground': {
        backgroundColor: 'color-mix(in srgb, var(--ring) 28%, transparent)'
      },
      '&.cm-focused': {
        outline: 'none'
      },
      '.cm-scroller': {
        fontFamily,
        lineHeight: '1.45',
        overflow: 'auto'
      },
      // Merge package chrome
      '.cm-mergeView, .cm-mergeViewEditors': {
        height: '100%'
      },
      '.cm-mergeViewEditors': {
        alignItems: 'stretch'
      },
      '.cm-mergeView .cm-editor': {
        height: '100%'
      },
      '.cm-deletedChunk': {
        backgroundColor: 'color-mix(in srgb, var(--destructive) 12%, transparent)'
      },
      '.cm-insertedChunk': {
        backgroundColor: 'color-mix(in srgb, var(--chart-2) 12%, transparent)'
      },
      // Why: line tint already communicates the change; merge's 2px text
      // gradients read as hyperlink underlines on syntax-highlighted code.
      '.cm-changedText, .cm-deletedText': {
        background: 'none !important'
      },
      // Why: find panel on diff surfaces uses the same Sol chrome as CodeEditor.
      '.cm-panels': {
        backgroundColor: 'var(--editor-surface)',
        color: 'var(--foreground)',
        borderColor: 'var(--border)'
      },
      '.cm-panels .cm-button, .cm-panels input, .cm-panels button': {
        fontFamily: 'inherit',
        color: 'var(--foreground)'
      },
      '.cm-panels input': {
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)'
      }
    }),
    ...(wordWrap ? [EditorView.lineWrapping] : [])
  ]
}
