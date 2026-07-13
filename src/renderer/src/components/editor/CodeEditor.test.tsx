// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/store', () => ({
  useAppStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        settings: {
          theme: 'dark',
          terminalFontSize: 13,
          terminalFontFamily: 'monospace'
        },
        editorFontZoomLevel: 0,
        setPendingEditorReveal: vi.fn(),
        setEditorCursorLine: vi.fn(),
        pendingEditorReveal: null
      }),
    {
      getState: () => ({
        pendingEditorReveal: null,
        setPendingEditorReveal: vi.fn(),
        setEditorCursorLine: vi.fn()
      })
    }
  )
}))

vi.mock('@/lib/file-search-selection', () => ({
  registerFileSearchSelectedTextProvider: () => () => {}
}))

import CodeEditor from './CodeEditor'

describe('CodeEditor', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a CodeMirror host with accessibility labels', () => {
    const markup = renderToStaticMarkup(
      <CodeEditor
        fileId="f1"
        filePath="/repo/a.ts"
        viewStateKey="f1"
        relativePath="a.ts"
        content="const x = 1\n"
        language="typescript"
        onContentChange={() => {}}
        onSave={() => {}}
      />
    )
    expect(markup).toContain('data-testid="code-editor"')
    expect(markup).toContain('role="textbox"')
    expect(markup).toContain('a.ts')
  })

  it('marks read-only mode for accessibility', () => {
    const markup = renderToStaticMarkup(
      <CodeEditor
        fileId="f1"
        filePath="/repo/a.ts"
        viewStateKey="f1"
        relativePath="a.ts"
        content="const x = 1\n"
        language="typescript"
        onContentChange={() => {}}
        onSave={() => {}}
        readOnly
      />
    )
    expect(markup).toContain('aria-readonly')
  })
})
