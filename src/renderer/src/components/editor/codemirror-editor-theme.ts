import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

export function codemirrorEditorTheme(
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
        fontFamily,
        minHeight: '100%'
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
      '.cm-search-result-highlight': {
        backgroundColor: 'color-mix(in srgb, var(--warning, #f59e0b) 34%, transparent)',
        borderRadius: '3px',
        boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--warning, #f59e0b) 52%, transparent)'
      },
      // Why: native CM find panel should share Sol surface tokens, not browser defaults.
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
      },
      '.cm-markdown-doc-link': {
        color: 'var(--primary)',
        textDecoration: 'underline',
        textUnderlineOffset: '2px'
      }
    }),
    ...(wordWrap ? [EditorView.lineWrapping] : [])
  ]
}
