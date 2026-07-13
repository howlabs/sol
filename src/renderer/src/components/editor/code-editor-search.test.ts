// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import {
  search,
  searchKeymap,
  openSearchPanel,
  searchPanelOpen,
  highlightSelectionMatches
} from '@codemirror/search'
import { mountCodeMirrorDiffHost, destroyCodeMirrorDiffHost } from './codemirror-diff-host'

describe('CodeMirror native find', () => {
  it('registers Mod-f on searchKeymap and opens .cm-search panel', () => {
    expect(searchKeymap.some((b) => b.key === 'Mod-f')).toBe(true)

    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: 'find me in this buffer\n',
        extensions: [search({ top: true }), highlightSelectionMatches(), keymap.of(searchKeymap)]
      })
    })
    expect(searchPanelOpen(view.state)).toBe(false)
    expect(openSearchPanel(view)).toBe(true)
    expect(searchPanelOpen(view.state)).toBe(true)
    expect(parent.querySelector('.cm-search')).not.toBeNull()
    view.destroy()
    parent.remove()
  })

  it('opens search on unified and both split-pane diff hosts', () => {
    for (const sideBySide of [true, false]) {
      const parent = document.createElement('div')
      document.body.appendChild(parent)
      const host = mountCodeMirrorDiffHost({
        parent,
        originalContent: 'alpha\n',
        modifiedContent: 'alpha beta\n',
        language: 'typescript',
        fontSize: 13,
        fontFamily: 'monospace',
        wordWrap: false,
        sideBySide,
        editable: sideBySide // cover editable modified pane too
      })
      if (host.kind === 'split') {
        expect(openSearchPanel(host.view.a)).toBe(true)
        expect(searchPanelOpen(host.view.a.state)).toBe(true)
        expect(openSearchPanel(host.view.b)).toBe(true)
        expect(searchPanelOpen(host.view.b.state)).toBe(true)
      } else {
        expect(openSearchPanel(host.view)).toBe(true)
        expect(searchPanelOpen(host.view.state)).toBe(true)
        expect(parent.querySelector('.cm-search')).not.toBeNull()
      }
      destroyCodeMirrorDiffHost(host)
      parent.remove()
    }
  })
})
