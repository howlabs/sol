/**
 * CodeMirror 6 editor for notebook code cells.
 *
 * CodeMirror 6 editor for notebook code cells.
 * viewer. Supports: syntax highlighting, auto-height, save shortcut, escape
 * to deactivate, blur to deactivate, focus on mount, dark/light theme.
 */

import React, { useEffect, useRef } from 'react'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { installEditorSaveShortcut } from './editor-shortcuts'
import { notebookLanguageExtension } from './notebook-codemirror-language'

type NotebookCodeEditorProps = {
  value: string
  language: string
  fontSize: number
  fontFamily: string
  isDark: boolean
  height: number
  onChange: (value: string) => void
  onMount?: (view: EditorView) => void
  onBlur?: () => void
  onEscape?: () => void
  onSave?: () => void
}

/** Minimal dark theme matching the app's `dark` class surface tokens. */
function notebookEditorTheme(isDark: boolean, fontSize: number, fontFamily: string): Extension {
  const bg = isDark ? '#1e1e1e' : '#ffffff'
  const fg = isDark ? '#d4d4d4' : '#000000'
  const gutterBg = isDark ? '#1e1e1e' : '#ffffff'
  const gutterFg = isDark ? '#858585' : '#237893'
  const selectionBg = isDark ? '#264f78' : '#add6ff'
  const cursorColor = isDark ? '#aeafad' : '#000000'

  return EditorView.theme({
    '&': {
      backgroundColor: bg,
      color: fg,
      height: '100%',
      fontSize: `${fontSize}px`,
      fontFamily
    },
    '.cm-content': {
      caretColor: cursorColor,
      padding: '4px 0'
    },
    '.cm-gutters': {
      backgroundColor: gutterBg,
      color: gutterFg,
      border: 'none'
    },
    '.cm-activeLineGutter': {
      backgroundColor: isDark ? '#2a2d2e' : '#f2f2f2'
    },
    '.cm-activeLine': {
      backgroundColor: isDark ? '#2a2d2e' : '#f2f2f2'
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: selectionBg
    },
    '.cm-selectionBackground': {
      backgroundColor: selectionBg
    },
    '&.cm-focused': {
      outline: 'none'
    },
    '.cm-cursor': {
      borderLeftColor: cursorColor
    }
  })
}

export function NotebookCodeEditor({
  value,
  language,
  fontSize,
  fontFamily,
  isDark,
  height,
  onChange,
  onMount,
  onBlur,
  onEscape,
  onSave
}: NotebookCodeEditorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  // Why: CodeMirror callbacks are installed once on mount; refs keep the
  // latest closures without rebuilding the editor.
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)
  const onEscapeRef = useRef(onEscape)
  const onSaveRef = useRef(onSave)
  onChangeRef.current = onChange
  onBlurRef.current = onBlur
  onEscapeRef.current = onEscape
  onSaveRef.current = onSave

  // Why: track the current value to avoid dispatching a transaction when
  // the external value matches the editor's internal state (e.g. after
  // the user types and onChange propagates back).
  const currentValueRef = useRef(value)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const extensions: Extension[] = [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      ...notebookLanguageExtension(language),
      lineNumbers(),
      notebookEditorTheme(isDark, fontSize, fontFamily),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const next = update.state.doc.toString()
          currentValueRef.current = next
          onChangeRef.current(next)
        }
        if (update.focusChanged) {
          if (!update.view.hasFocus) {
            onBlurRef.current?.()
          }
        }
      }),
      keymap.of([
        {
          key: 'Escape',
          preventDefault: true,
          run: () => {
            onEscapeRef.current?.()
            return true
          }
        }
      ])
    ]

    const state = EditorState.create({
      doc: value,
      extensions
    })

    const view = new EditorView({ state, parent: container })
    viewRef.current = view
    currentValueRef.current = value

    // Why: save shortcut is installed on the container DOM node so it
    // intercepts Cmd/Ctrl+S before the browser's default save dialog.
    const cleanupSave = installEditorSaveShortcut(container, () => {
      onSaveRef.current?.()
    })

    view.focus()
    onMount?.(view)

    return () => {
      cleanupSave()
      view.destroy()
      viewRef.current = null
    }
    // Why: the editor is rebuilt only when language or theme changes —
    // value updates are handled by the separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, isDark, fontSize, fontFamily])

  // Sync external value changes into the editor without rebuilding.
  useEffect(() => {
    const view = viewRef.current
    if (!view) {
      return
    }
    if (value === currentValueRef.current) {
      return
    }
    currentValueRef.current = value
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value }
    })
  }, [value])

  return (
    <div
      ref={containerRef}
      className="bg-editor-surface focus-within:ring-1 focus-within:ring-ring"
      style={{ height }}
    />
  )
}
