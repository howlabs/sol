import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { EditorState, Compartment } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  drawSelection,
  highlightActiveLine
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { useAppStore } from '@/store'
import { scrollTopCache, cursorPositionCache, setWithLRU } from '@/lib/scroll-cache'
import { computeEditorFontSize } from '@/lib/editor-font-zoom'
import { registerFileSearchSelectedTextProvider } from '@/lib/file-search-selection'
import { installEditorSaveShortcut } from './editor-shortcuts'
import { notebookLanguageExtension } from './notebook-codemirror-language'
import { codemirrorEditorTheme } from './codemirror-editor-theme'
import { conflictDecorationsExtension } from './codemirror-conflict-decorations'
import { clampAutoHeight, getAutoHeightForContent, isAutoHeightCapped } from './editor-auto-height'
import { formatCopiedSelectionLines } from './selection-copy'
import { EditorGutterContextMenu } from './EditorGutterContextMenu'
import { applyCodeEditorReveal, revealHighlightField } from './code-editor-reveal'

export type CodeEditorProps = {
  fileId: string
  filePath: string
  viewStateKey: string
  relativePath: string
  content: string
  language: string
  onContentChange: (content: string) => void
  onSave: (content: string) => void
  revealLine?: number
  revealColumn?: number
  revealMatchLength?: number
  conflictDecorationsEnabled?: boolean
  readOnly?: boolean
  autoHeight?: boolean
}

export default function CodeEditor({
  fileId,
  filePath,
  viewStateKey,
  relativePath,
  content,
  language,
  onContentChange,
  onSave,
  revealLine,
  revealColumn,
  revealMatchLength,
  conflictDecorationsEnabled = false,
  readOnly = false,
  autoHeight = false
}: CodeEditorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const languageCompartment = useRef(new Compartment())
  const readOnlyCompartment = useRef(new Compartment())
  const conflictCompartment = useRef(new Compartment())
  const themeCompartment = useRef(new Compartment())
  const lastSyncedContentRef = useRef(content)
  const applyingProgrammaticRef = useRef(false)
  const onSaveRef = useRef(onSave)
  const onContentChangeRef = useRef(onContentChange)
  onSaveRef.current = onSave
  onContentChangeRef.current = onContentChange
  const scrollThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unregisterFileSearchRef = useRef<(() => void) | null>(null)

  const [gutterMenuOpen, setGutterMenuOpen] = useState(false)
  const [gutterMenuPoint, setGutterMenuPoint] = useState({ x: 0, y: 0 })
  const [gutterMenuLine, setGutterMenuLine] = useState(1)
  const [autoHeightPx, setAutoHeightPx] = useState<number | null>(null)

  const settings = useAppStore((s) => s.settings)
  const editorFontZoomLevel = useAppStore((s) => s.editorFontZoomLevel)
  const setEditorCursorLine = useAppStore((s) => s.setEditorCursorLine)
  const fontSize = computeEditorFontSize(settings?.terminalFontSize ?? 13, editorFontZoomLevel)
  const fontFamily = settings?.terminalFontFamily || 'monospace'
  // Why: the previous file editor always wrapped; keep that default surface.
  const wordWrap = true
  const lineHeight = Math.ceil(fontSize * 1.45)

  const estimatedAutoHeight = useMemo(() => {
    if (!autoHeight) {
      return null
    }
    return getAutoHeightForContent(content, lineHeight)
  }, [autoHeight, content, lineHeight])
  const renderedHeight = autoHeight ? (autoHeightPx ?? estimatedAutoHeight ?? 80) : null

  const applyReveal = useCallback(
    (view: EditorView, line: number, column: number, matchLength: number): void => {
      applyCodeEditorReveal(view, line, column, matchLength, (clear) => {
        if (revealTimerRef.current) {
          clearTimeout(revealTimerRef.current)
        }
        revealTimerRef.current = setTimeout(() => {
          clear()
          revealTimerRef.current = null
        }, 1200)
      })
    },
    []
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const extensions = [
      history(),
      drawSelection(),
      highlightActiveLine(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      search({ top: true }),
      highlightSelectionMatches(),
      lineNumbers({
        domEventHandlers: {
          contextmenu: (view, line, event) => {
            event.preventDefault()
            const mouse = event as MouseEvent
            const lineNumber = view.state.doc.lineAt(line.from).number
            view.dispatch({
              selection: { anchor: line.from, head: line.from }
            })
            setGutterMenuLine(lineNumber)
            setGutterMenuPoint({ x: mouse.clientX, y: mouse.clientY })
            setGutterMenuOpen(true)
            return true
          }
        }
      }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
        {
          key: 'Mod-Shift-c',
          run: (view) => {
            const sel = view.state.selection.main
            if (sel.empty) {
              return false
            }
            const startLine = view.state.doc.lineAt(sel.from).number
            const endLine = view.state.doc.lineAt(sel.to).number
            // Why: caret / single-line selections keep native clipboard text.
            if (startLine === endLine) {
              return false
            }
            const selectedText = view.state.sliceDoc(sel.from, sel.to)
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
      ]),
      languageCompartment.current.of(notebookLanguageExtension(language)),
      readOnlyCompartment.current.of([
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly)
      ]),
      conflictCompartment.current.of(conflictDecorationsExtension(conflictDecorationsEnabled)),
      themeCompartment.current.of(codemirrorEditorTheme(fontSize, fontFamily, wordWrap)),
      revealHighlightField,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !applyingProgrammaticRef.current) {
          const next = update.state.doc.toString()
          lastSyncedContentRef.current = next
          onContentChangeRef.current(next)
          if (autoHeight) {
            setAutoHeightPx(clampAutoHeight(update.view.contentHeight + 1, lineHeight))
          }
        }
        if (update.selectionSet) {
          const head = update.state.selection.main.head
          const line = update.state.doc.lineAt(head)
          const column = head - line.from + 1
          setEditorCursorLine(filePath, line.number)
          setWithLRU(cursorPositionCache, viewStateKey, {
            lineNumber: line.number,
            column
          })
        }
        if (update.geometryChanged || update.docChanged) {
          if (scrollThrottleTimerRef.current) {
            clearTimeout(scrollThrottleTimerRef.current)
          }
          scrollThrottleTimerRef.current = setTimeout(() => {
            const view = viewRef.current
            if (view) {
              setWithLRU(scrollTopCache, viewStateKey, view.scrollDOM.scrollTop)
            }
            scrollThrottleTimerRef.current = null
          }, 150)
        }
      })
    ]

    const state = EditorState.create({
      doc: content,
      extensions
    })
    const view = new EditorView({ state, parent: container })
    viewRef.current = view
    lastSyncedContentRef.current = content

    const cleanupSave = installEditorSaveShortcut(container, () => {
      onSaveRef.current(view.state.doc.toString())
    })

    unregisterFileSearchRef.current?.()
    unregisterFileSearchRef.current = registerFileSearchSelectedTextProvider(() => {
      if (!view.hasFocus) {
        return null
      }
      const sel = view.state.selection.main
      if (sel.empty) {
        return null
      }
      return view.state.sliceDoc(sel.from, sel.to)
    })

    // Mount-time reveal or restore scroll/cursor.
    const reveal = useAppStore.getState().pendingEditorReveal
    const revealMatches = reveal?.fileId ? reveal.fileId === fileId : reveal?.filePath === filePath
    if (reveal && revealMatches) {
      requestAnimationFrame(() => {
        applyReveal(view, reveal.line, reveal.column, reveal.matchLength)
        useAppStore.getState().setPendingEditorReveal(null)
      })
    } else {
      const savedCursor = cursorPositionCache.get(viewStateKey)
      const savedScrollTop = scrollTopCache.get(viewStateKey)
      requestAnimationFrame(() => {
        if (savedCursor) {
          const line = Math.min(savedCursor.lineNumber, view.state.doc.lines)
          const lineObj = view.state.doc.line(line)
          const pos = Math.min(lineObj.from + savedCursor.column - 1, lineObj.to)
          view.dispatch({ selection: { anchor: pos, head: pos } })
        }
        if (savedScrollTop !== undefined) {
          view.scrollDOM.scrollTop = savedScrollTop
        }
        view.focus()
      })
    }

    if (autoHeight) {
      setAutoHeightPx(clampAutoHeight(view.contentHeight + 1, lineHeight))
    }

    return () => {
      cleanupSave()
      unregisterFileSearchRef.current?.()
      unregisterFileSearchRef.current = null
      if (scrollThrottleTimerRef.current) {
        clearTimeout(scrollThrottleTimerRef.current)
        scrollThrottleTimerRef.current = null
      }
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current)
        revealTimerRef.current = null
      }
      const current = viewRef.current
      if (current) {
        setWithLRU(scrollTopCache, viewStateKey, current.scrollDOM.scrollTop)
        const head = current.state.selection.main.head
        const line = current.state.doc.lineAt(head)
        setWithLRU(cursorPositionCache, viewStateKey, {
          lineNumber: line.number,
          column: head - line.from + 1
        })
        current.destroy()
      }
      viewRef.current = null
      container.replaceChildren()
    }
    // Why: remount only when the editor identity or height mode changes;
    // content/language/theme reconfigure in dedicated effects to avoid churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, filePath, viewStateKey, autoHeight])

  // External content sync without loops.
  useEffect(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    if (content === lastSyncedContentRef.current) {
      return
    }
    applyingProgrammaticRef.current = true
    try {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content }
      })
      lastSyncedContentRef.current = content
    } finally {
      applyingProgrammaticRef.current = false
    }
  }, [content])

  useEffect(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    view.dispatch({
      effects: languageCompartment.current.reconfigure(notebookLanguageExtension(language))
    })
  }, [language])

  useEffect(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    view.dispatch({
      effects: readOnlyCompartment.current.reconfigure([
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly)
      ])
    })
  }, [readOnly])

  useEffect(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    view.dispatch({
      effects: conflictCompartment.current.reconfigure(
        conflictDecorationsExtension(conflictDecorationsEnabled)
      )
    })
  }, [conflictDecorationsEnabled])

  useEffect(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    view.dispatch({
      effects: themeCompartment.current.reconfigure(
        codemirrorEditorTheme(fontSize, fontFamily, wordWrap)
      )
    })
  }, [fontFamily, fontSize, wordWrap])

  // Prop-driven reveal while already mounted.
  useEffect(() => {
    const view = viewRef.current
    if (!view || revealLine === undefined) {
      return
    }
    applyReveal(view, revealLine, revealColumn ?? 1, revealMatchLength ?? 0)
    useAppStore.getState().setPendingEditorReveal(null)
  }, [applyReveal, revealColumn, revealLine, revealMatchLength])

  useLayoutEffect(() => {
    return () => {
      const view = viewRef.current
      if (view) {
        setWithLRU(scrollTopCache, viewStateKey, view.scrollDOM.scrollTop)
      }
    }
  }, [viewStateKey])

  const heightStyle =
    renderedHeight !== null
      ? {
          height: renderedHeight,
          maxHeight: isAutoHeightCapped(renderedHeight, lineHeight) ? renderedHeight : undefined,
          overflow: isAutoHeightCapped(renderedHeight, lineHeight) ? 'auto' : 'hidden'
        }
      : { height: '100%' }

  return (
    <div className="relative h-full min-h-0 w-full" data-testid="code-editor">
      <div
        ref={containerRef}
        className="h-full min-h-0 w-full overflow-hidden bg-editor-surface"
        style={heightStyle}
        role="textbox"
        aria-label={relativePath || filePath}
        aria-readonly={readOnly || undefined}
      />
      <EditorGutterContextMenu
        open={gutterMenuOpen}
        onOpenChange={setGutterMenuOpen}
        point={gutterMenuPoint}
        line={gutterMenuLine}
        filePath={filePath}
        relativePath={relativePath}
      />
    </div>
  )
}
