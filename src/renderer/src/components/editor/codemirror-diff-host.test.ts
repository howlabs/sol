// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyCodeMirrorDiffViewState,
  destroyCodeMirrorDiffHost,
  getCodeMirrorDiffModifiedText,
  measureCodeMirrorDiffHostHeight,
  mountCodeMirrorDiffHost,
  readCodeMirrorDiffViewState,
  syncCodeMirrorDiffHostDocs
} from './codemirror-diff-host'

function mount(sideBySide: boolean, editable = false) {
  const parent = document.createElement('div')
  document.body.appendChild(parent)
  const host = mountCodeMirrorDiffHost({
    parent,
    originalContent: 'line one\nline two\n',
    modifiedContent: 'line one\nline two changed\n',
    language: 'typescript',
    fontSize: 13,
    fontFamily: 'monospace',
    wordWrap: false,
    sideBySide,
    editable
  })
  return { parent, host }
}

describe('codemirror-diff-host', () => {
  beforeEach(() => window.localStorage.clear())

  it('mounts a split merge view and exposes modified text', () => {
    const { parent, host } = mount(true)
    expect(host.kind).toBe('split')
    expect(getCodeMirrorDiffModifiedText(host)).toContain('line two changed')
    destroyCodeMirrorDiffHost(host)
    parent.remove()
  })

  it('mounts a unified merge view for non-side-by-side mode', () => {
    const { parent, host } = mount(false)
    expect(host.kind).toBe('unified')
    expect(getCodeMirrorDiffModifiedText(host)).toContain('line two changed')
    destroyCodeMirrorDiffHost(host)
    parent.remove()
  })

  it('keeps intraline changes free of underline-like backgrounds', () => {
    const { parent, host } = mount(false)
    const changedText = parent.querySelector<HTMLElement>('.cm-changedText')
    expect(changedText).not.toBeNull()
    expect(window.getComputedStyle(changedText!).backgroundImage).toBe('none')
    destroyCodeMirrorDiffHost(host)
    parent.remove()
  })

  it('syncs modified document content without remounting', () => {
    const { parent, host } = mount(true)
    syncCodeMirrorDiffHostDocs(host, 'line one\nline two\n', 'line one\nline two synced\n')
    expect(getCodeMirrorDiffModifiedText(host)).toBe('line one\nline two synced\n')
    destroyCodeMirrorDiffHost(host)
    parent.remove()
  })

  it('round-trips view state scroll position', () => {
    const { parent, host } = mount(true)
    const target = host.kind === 'split' ? host.view.b : host.view
    target.scrollDOM.scrollTop = 12
    const state = readCodeMirrorDiffViewState(host)
    expect(state.scrollTop).toBe(12)
    target.scrollDOM.scrollTop = 0
    applyCodeMirrorDiffViewState(host, state)
    expect(target.scrollDOM.scrollTop).toBe(12)
    destroyCodeMirrorDiffHost(host)
    parent.remove()
  })

  it('reports a positive content height for combined section layout', () => {
    const { parent, host } = mount(false)
    expect(measureCodeMirrorDiffHostHeight(host)).toBeGreaterThan(0)
    destroyCodeMirrorDiffHost(host)
    parent.remove()
  })

  it('adds and restores a review note from a changed-line gutter', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const mountReview = () =>
      mountCodeMirrorDiffHost({
        parent,
        originalContent: 'one\ntwo\n',
        modifiedContent: 'one\ntwo changed\n',
        language: 'typescript',
        fontSize: 13,
        fontFamily: 'monospace',
        wordWrap: false,
        sideBySide: false,
        editable: false,
        reviewKey: 'review-test'
      })

    let host = mountReview()
    const add = parent.querySelector<HTMLButtonElement>('[data-testid="diff-comment-add"]')
    expect(add).not.toBeNull()
    add?.click()
    const textarea = parent.querySelector<HTMLTextAreaElement>('.orca-diff-review-textarea')
    expect(textarea).not.toBeNull()
    if (textarea) {
      textarea.value = 'Please simplify this branch.'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      textarea.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true })
      )
    }
    expect(parent.querySelector('[data-testid="diff-comment-card"]')?.textContent).toContain(
      'Please simplify this branch.'
    )

    destroyCodeMirrorDiffHost(host)
    parent.replaceChildren()
    host = mountReview()
    expect(parent.querySelector('[data-testid="diff-comment-card"]')?.textContent).toContain(
      'Please simplify this branch.'
    )
    destroyCodeMirrorDiffHost(host)
    parent.remove()
  })
})
