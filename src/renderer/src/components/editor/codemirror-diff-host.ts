import { EditorState, ChangeSet, type Extension } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  drawSelection,
  highlightActiveLine
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import {
  MergeView,
  unifiedMergeView,
  goToNextChunk,
  originalDocChangeEffect,
  getOriginalDoc
} from '@codemirror/merge'
import type { DiffViewState } from '@/lib/scroll-cache'
import { notebookLanguageExtension } from './notebook-codemirror-language'
import { codemirrorDiffTheme } from './codemirror-diff-theme'
import { formatCopiedSelectionLines } from './selection-copy'
import { diffReviewExtension } from './codemirror-diff-review'

export type CodeMirrorDiffHost =
  | { kind: 'split'; view: MergeView }
  | { kind: 'unified'; view: EditorView }

export type MountCodeMirrorDiffHostInput = {
  parent: HTMLElement
  originalContent: string
  modifiedContent: string
  language: string
  fontSize: number
  fontFamily: string
  wordWrap: boolean
  sideBySide: boolean
  editable: boolean
  /** Collapse long unchanged runs (combined review defaults on). */
  collapseUnchanged?: boolean | { margin?: number; minSize?: number }
  /** Optional path/language for multi-line contextual copy (Mod-Shift-c). */
  relativePath?: string
  /** Stable identity for local line review notes. */
  reviewKey?: string
  onContentChange?: (content: string) => void
  /** Fired after layout/content size changes (combined section height). */
  onContentHeightChange?: (height: number) => void
}

function resolveCollapseUnchanged(
  value: MountCodeMirrorDiffHostInput['collapseUnchanged']
): { margin?: number; minSize?: number } | undefined {
  if (value === false) {
    return undefined
  }
  if (value === true || value === undefined) {
    return { margin: 3, minSize: 8 }
  }
  return value
}

export function measureCodeMirrorDiffHostHeight(host: CodeMirrorDiffHost): number {
  if (host.kind === 'split') {
    // Why: split panes share one outer shell; take the taller side plus chrome.
    return Math.max(
      host.view.a.contentHeight,
      host.view.b.contentHeight,
      host.view.dom.offsetHeight
    )
  }
  return Math.max(host.view.contentHeight, host.view.dom.offsetHeight)
}

function baseExtensions(input: {
  language: string
  fontSize: number
  fontFamily: string
  wordWrap: boolean
  editable: boolean
}): Extension[] {
  const readOnly = !input.editable
  return [
    history(),
    drawSelection(),
    highlightActiveLine(),
    bracketMatching(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    search({ top: true }),
    highlightSelectionMatches(),
    lineNumbers(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    ...notebookLanguageExtension(input.language),
    ...codemirrorDiffTheme(input.fontSize, input.fontFamily, input.wordWrap),
    EditorView.editable.of(!readOnly),
    EditorState.readOnly.of(readOnly)
  ]
}

function heightListener(
  onContentHeightChange: ((height: number) => void) | undefined,
  measure: () => number
): Extension {
  if (!onContentHeightChange) {
    return []
  }
  return EditorView.updateListener.of((update) => {
    if (update.docChanged || update.geometryChanged) {
      onContentHeightChange(measure())
    }
  })
}

function contextCopyExtension(relativePath: string | undefined, language: string): Extension {
  if (!relativePath) {
    return []
  }
  return keymap.of([
    {
      key: 'Mod-Shift-c',
      run: (view) => {
        const sel = view.state.selection.main
        if (sel.empty) {
          return false
        }
        const selectedText = view.state.sliceDoc(sel.from, sel.to)
        const startLine = view.state.doc.lineAt(sel.from).number
        const endLine = view.state.doc.lineAt(sel.to).number
        // Why: single-line selections keep native clipboard text.
        if (startLine === endLine) {
          return false
        }
        const formatted = formatCopiedSelectionLines({
          relativePath,
          language,
          startLine,
          endLine,
          selectedText
        })
        if (!formatted) {
          return false
        }
        void navigator.clipboard.writeText(formatted)
        return true
      }
    }
  ])
}

export function mountCodeMirrorDiffHost(input: MountCodeMirrorDiffHostInput): CodeMirrorDiffHost {
  const shared = {
    language: input.language,
    fontSize: input.fontSize,
    fontFamily: input.fontFamily,
    wordWrap: input.wordWrap
  }
  const collapseUnchanged = resolveCollapseUnchanged(input.collapseUnchanged)
  const contextCopy = contextCopyExtension(input.relativePath, input.language)
  const review = input.reviewKey ? diffReviewExtension(input.reviewKey) : []

  if (input.sideBySide) {
    // Why: height callbacks may run during construction; resolve via holder.
    const holder: { host: CodeMirrorDiffHost | null } = { host: null }
    const measure = (): number => (holder.host ? measureCodeMirrorDiffHostHeight(holder.host) : 0)
    const view = new MergeView({
      parent: input.parent,
      orientation: 'a-b',
      gutter: true,
      highlightChanges: true,
      ...(collapseUnchanged ? { collapseUnchanged } : {}),
      a: {
        doc: input.originalContent,
        extensions: [
          ...baseExtensions({ ...shared, editable: false }),
          EditorView.editable.of(false),
          EditorState.readOnly.of(true),
          contextCopy,
          review,
          heightListener(input.onContentHeightChange, measure)
        ]
      },
      b: {
        doc: input.modifiedContent,
        extensions: [
          ...baseExtensions({ ...shared, editable: input.editable }),
          contextCopy,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && input.editable) {
              input.onContentChange?.(update.state.doc.toString())
            }
          }),
          heightListener(input.onContentHeightChange, measure)
        ]
      }
    })
    const host: CodeMirrorDiffHost = { kind: 'split', view }
    holder.host = host
    input.onContentHeightChange?.(measureCodeMirrorDiffHostHeight(host))
    return host
  }

  const holder: { host: CodeMirrorDiffHost | null } = { host: null }
  const view = new EditorView({
    parent: input.parent,
    state: EditorState.create({
      doc: input.modifiedContent,
      extensions: [
        ...baseExtensions({ ...shared, editable: input.editable }),
        unifiedMergeView({
          original: input.originalContent,
          highlightChanges: true,
          gutter: true,
          mergeControls: false,
          ...(collapseUnchanged ? { collapseUnchanged } : {})
        }),
        review,
        contextCopy,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && input.editable) {
            input.onContentChange?.(update.state.doc.toString())
          }
        }),
        heightListener(input.onContentHeightChange, () =>
          holder.host ? measureCodeMirrorDiffHostHeight(holder.host) : view.contentHeight
        )
      ]
    })
  })
  const host: CodeMirrorDiffHost = { kind: 'unified', view }
  holder.host = host
  input.onContentHeightChange?.(measureCodeMirrorDiffHostHeight(host))
  return host
}

export function destroyCodeMirrorDiffHost(host: CodeMirrorDiffHost): void {
  host.view.destroy()
}

export function readCodeMirrorDiffViewState(host: CodeMirrorDiffHost): DiffViewState {
  const target = host.kind === 'split' ? host.view.b : host.view
  return {
    scrollTop: target.scrollDOM.scrollTop,
    selectionFrom: target.state.selection.main.from,
    selectionTo: target.state.selection.main.to
  }
}

export function applyCodeMirrorDiffViewState(
  host: CodeMirrorDiffHost,
  state: DiffViewState | undefined
): void {
  if (!state) {
    return
  }
  const target = host.kind === 'split' ? host.view.b : host.view
  target.scrollDOM.scrollTop = state.scrollTop
  const docLen = target.state.doc.length
  const from = Math.min(Math.max(0, state.selectionFrom ?? 0), docLen)
  const to = Math.min(Math.max(0, state.selectionTo ?? from), docLen)
  target.dispatch({
    selection: { anchor: from, head: to },
    scrollIntoView: false
  })
}

export function scrollCodeMirrorDiffToFirstChange(host: CodeMirrorDiffHost): void {
  const view = host.kind === 'split' ? host.view.b : host.view
  if (!goToNextChunk(view)) {
    view.scrollDOM.scrollTop = 0
  }
}

export function syncCodeMirrorDiffHostDocs(
  host: CodeMirrorDiffHost,
  originalContent: string,
  modifiedContent: string
): void {
  if (host.kind === 'split') {
    if (host.view.a.state.doc.toString() !== originalContent) {
      host.view.a.dispatch({
        changes: { from: 0, to: host.view.a.state.doc.length, insert: originalContent }
      })
    }
    if (host.view.b.state.doc.toString() !== modifiedContent) {
      host.view.b.dispatch({
        changes: { from: 0, to: host.view.b.state.doc.length, insert: modifiedContent }
      })
    }
    return
  }

  if (host.view.state.doc.toString() !== modifiedContent) {
    host.view.dispatch({
      changes: { from: 0, to: host.view.state.doc.length, insert: modifiedContent }
    })
  }

  const currentOriginal = getOriginalDoc(host.view.state).toString()
  if (currentOriginal !== originalContent) {
    const changes = ChangeSet.of(
      { from: 0, to: getOriginalDoc(host.view.state).length, insert: originalContent },
      getOriginalDoc(host.view.state).length
    )
    host.view.dispatch({
      effects: originalDocChangeEffect(host.view.state, changes)
    })
  }
}

export function getCodeMirrorDiffModifiedDom(host: CodeMirrorDiffHost): HTMLElement {
  return host.kind === 'split' ? host.view.b.dom : host.view.dom
}

export function getCodeMirrorDiffModifiedText(host: CodeMirrorDiffHost): string {
  return host.kind === 'split' ? host.view.b.state.doc.toString() : host.view.state.doc.toString()
}

export function focusCodeMirrorDiffHost(host: CodeMirrorDiffHost, editable: boolean): void {
  const target = host.kind === 'split' ? (editable ? host.view.b : host.view.a) : host.view
  target.focus()
}
