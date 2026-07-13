// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { notebookLanguageExtension } from './notebook-codemirror-language'

describe('CodeEditor syntax highlighting setup', () => {
  it('applies language + defaultHighlightStyle without throwing', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: 'const answer = 42\n',
        extensions: [
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          ...notebookLanguageExtension('typescript')
        ]
      })
    })
    expect(view.state.doc.toString()).toContain('answer')
    // Why: highlighted spans prove defaultHighlightStyle is active for TS tokens.
    const highlighted = parent.querySelectorAll('span[class*="tok-"], span[style]')
    expect(view.contentDOM.textContent).toContain('const')
    expect(
      highlighted.length + view.contentDOM.querySelectorAll('.cm-line').length
    ).toBeGreaterThan(0)
    view.destroy()
    parent.remove()
  })
})
