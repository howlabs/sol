import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { DiffViewerProps } from './diff-viewer-props'

vi.mock('@/store', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      settings: {
        theme: 'dark',
        terminalFontSize: 13,
        terminalFontFamily: 'monospace',
        diffWordWrap: false
      },
      editorFontZoomLevel: 0
    })
}))

vi.mock('./codemirror-diff-host', () => ({
  mountCodeMirrorDiffHost: vi.fn(() => ({ kind: 'unified', view: { destroy: vi.fn() } })),
  destroyCodeMirrorDiffHost: vi.fn(),
  readCodeMirrorDiffViewState: vi.fn(() => ({ scrollTop: 0 })),
  applyCodeMirrorDiffViewState: vi.fn(),
  scrollCodeMirrorDiffToFirstChange: vi.fn(),
  syncCodeMirrorDiffHostDocs: vi.fn(),
  getCodeMirrorDiffModifiedDom: vi.fn(() => document.createElement('div')),
  getCodeMirrorDiffModifiedText: vi.fn(() => ''),
  focusCodeMirrorDiffHost: vi.fn()
}))

import DiffViewer from './DiffViewer'

function baseProps(overrides: Partial<DiffViewerProps> = {}): DiffViewerProps {
  return {
    modelKey: 'tab-1',
    originalContent: 'a\n',
    modifiedContent: 'b\n',
    language: 'typescript',
    filePath: '/repo/a.ts',
    relativePath: 'a.ts',
    sideBySide: false,
    editable: false,
    ...overrides
  }
}

describe('DiffViewer (CodeMirror)', () => {
  it('renders the CodeMirror host container for normal-size diffs', () => {
    const markup = renderToStaticMarkup(<DiffViewer {...baseProps()} />)
    expect(markup).toContain('data-testid="codemirror-diff-viewer"')
    expect(markup).toContain('data-side-by-side="false"')
    expect(markup).toContain('data-editable="false"')
    expect(markup).toContain('role="region"')
    expect(markup).toContain('a.ts')
  })

  it('marks side-by-side and editable flags for callers', () => {
    const markup = renderToStaticMarkup(
      <DiffViewer {...baseProps({ sideBySide: true, editable: true })} />
    )
    expect(markup).toContain('data-side-by-side="true"')
    expect(markup).toContain('data-editable="true"')
  })

  it('uses LargeDiffFallback instead of the host when limited', () => {
    const markup = renderToStaticMarkup(
      <DiffViewer
        {...baseProps({
          largeDiffRenderLimit: {
            limited: true,
            reason: 'line-count',
            lineCounts: { original: 50_000, modified: 50_000 },
            characterCount: 1_000_000,
            limits: {
              maxLinesPerSide: 20_000,
              maxCombinedCharacters: 2_000_000
            }
          }
        })}
      />
    )
    expect(markup).not.toContain('data-testid="codemirror-diff-viewer"')
  })
})
