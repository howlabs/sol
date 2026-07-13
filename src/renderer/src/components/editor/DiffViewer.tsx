import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useAppStore } from '@/store'
import { diffViewStateCache, setWithLRU } from '@/lib/scroll-cache'
import { computeDiffEditorFontSize } from '@/lib/editor-font-zoom'
import { useContextualCopySetup } from './useContextualCopySetup'
import { applyDiffEditorLineNumberOptions } from './diff-editor-line-number-options'
import { installEditorSaveShortcut } from './editor-shortcuts'
import { diffEditorScrollbarOptions } from './diff-editor-scrollbar-options'
import { LargeDiffFallback } from './LargeDiffFallback'
import { getLargeDiffRenderLimit } from './large-diff-render-limit'
import { useDiffViewerLargeDiffLifecycle } from './useDiffViewerLargeDiffLifecycle'
import { getDiffViewerLargeDiffSaveAction } from './diff-viewer-large-diff-save-action'
import type { DiffViewerProps } from './diff-viewer-props'
import { buildDiffEditorWordWrapOptions } from './diff-editor-word-wrap-options'

export default function DiffViewer({
  modelKey,
  originalModelKey,
  modifiedModelKey,
  originalContent,
  modifiedContent,
  language,
  filePath,
  relativePath,
  sideBySide,
  editable,
  onContentChange,
  onSave,
  largeDiffRenderLimit,
  largeDiffSaveContentAvailable
}: DiffViewerProps): React.JSX.Element {
  const settings = useAppStore((s) => s.settings)
  const editorFontZoomLevel = useAppStore((s) => s.editorFontZoomLevel)
  const diffEditorFontSize = computeDiffEditorFontSize(
    settings?.terminalFontSize ?? 13,
    editorFontZoomLevel
  )
  const isDark =
    settings?.theme === 'dark' ||
    (settings?.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null)
  const diffBodyRef = useRef<HTMLDivElement | null>(null)
  const lineNumberOptionsSubRef = useRef<{ dispose: () => void } | null>(null)
  const [modifiedEditor, setModifiedEditor] = useState<editor.ICodeEditor | null>(null)

  const renderLimit = useMemo(
    () => largeDiffRenderLimit ?? getLargeDiffRenderLimit({ originalContent, modifiedContent }),
    [largeDiffRenderLimit, originalContent, modifiedContent]
  )

  // Why: on a fresh open (no cached view state), center the first diff change
  // in the viewport. We do this from a dedicated effect — not from handleMount
  // — so it runs after Monaco finishes laying out. The didScroll guard makes
  // this strictly one-shot per mount.
  const didAutoScrollFirstDiffRef = useRef(false)
  const didAutoScrollModelKeyRef = useRef(modelKey)
  useEffect(() => {
    if (didAutoScrollModelKeyRef.current !== modelKey) {
      didAutoScrollModelKeyRef.current = modelKey
      // Why: the one-shot above is intentionally per-modelKey. Reset inside
      // this Effect before its first-diff guard runs for the new file.
      didAutoScrollFirstDiffRef.current = false
    }
    const diffEditor = diffEditorRef.current
    if (!diffEditor || !modifiedEditor) {
      return
    }
    if (didAutoScrollFirstDiffRef.current) {
      return
    }
    if (diffViewStateCache.get(modelKey)) {
      return
    }
    let rafId: number | null = null
    const run = (): void => {
      if (didAutoScrollFirstDiffRef.current) {
        return
      }
      const changes = diffEditor.getLineChanges()
      if (!changes || changes.length === 0) {
        return
      }
      const line = Math.max(1, changes[0].modifiedStartLineNumber)
      // Defer one frame so any view zones added in this render pass are part
      // of the layout before we measure. Cancel any earlier pending rAF so
      // a late onDidUpdateDiff can't enqueue a redundant scroll.
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (didAutoScrollFirstDiffRef.current || !modifiedEditor.getModel()) {
          return
        }
        const top = modifiedEditor.getTopForLineNumber(line, true)
        const editorHeight = modifiedEditor.getLayoutInfo().height
        modifiedEditor.setPosition({ lineNumber: line, column: 1 })
        modifiedEditor.setScrollTop(Math.max(0, top - editorHeight / 2))
        didAutoScrollFirstDiffRef.current = true
      })
    }
    // If the diff result is already available, run immediately; otherwise
    // wait for it. onDidUpdateDiff fires once the diff computation lands.
    if (diffEditor.getLineChanges()) {
      run()
    }
    const sub = diffEditor.onDidUpdateDiff(() => run())
    return () => {
      sub.dispose()
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [modifiedEditor, modelKey])

  const handleEnterLargeDiffFallback = useCallback(() => {
    // Why: when a tab transitions to the safety fallback, stale Monaco refs
    // must not keep save handlers talking to disposed UI.
    lineNumberOptionsSubRef.current?.dispose()
    lineNumberOptionsSubRef.current = null
    diffEditorRef.current = null
    setModifiedEditor(null)
  }, [])

  // Keep refs to latest callbacks so the mounted editor always calls current versions
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const onContentChangeRef = useRef(onContentChange)
  onContentChangeRef.current = onContentChange

  const { setupCopy, toastNode } = useContextualCopySetup()

  const propsRef = useRef({ relativePath, language, onSave })
  propsRef.current = { relativePath, language, onSave }
  const currentDiffModelPaths = useDiffViewerLargeDiffLifecycle({
    limited: renderLimit.limited,
    modelKey,
    originalModelKey,
    modifiedModelKey,
    onEnterFallback: handleEnterLargeDiffFallback
  })

  const handleMount: DiffOnMount = useCallback(
    (diffEditor, monaco) => {
      diffEditorRef.current = diffEditor
      lineNumberOptionsSubRef.current?.dispose()
      lineNumberOptionsSubRef.current = applyDiffEditorLineNumberOptions(diffEditor, sideBySide)

      const originalEditor = diffEditor.getOriginalEditor()
      const modifiedEditor = diffEditor.getModifiedEditor()

      setupCopy(originalEditor, monaco, filePath, propsRef)
      setupCopy(modifiedEditor, monaco, filePath, propsRef)
      setModifiedEditor(modifiedEditor)

      // Why: restoring the full diff view state matches VS Code more closely
      // than replaying scrollTop alone, and avoids divergent cursor/selection
      // state between the original and modified panes.
      const savedViewState = diffViewStateCache.get(modelKey)
      if (savedViewState) {
        requestAnimationFrame(() => diffEditor.restoreViewState(savedViewState))
      }

      if (editable) {
        const cleanupSaveShortcut = installEditorSaveShortcut(
          modifiedEditor.getContainerDomNode(),
          () => {
            onSaveRef.current?.(modifiedEditor.getValue())
          }
        )

        // Track changes
        const modelContentSub = modifiedEditor.onDidChangeModelContent(() => {
          onContentChangeRef.current?.(modifiedEditor.getValue())
        })
        modifiedEditor.onDidDispose(() => {
          // Why: editable diff views own both the save shortcut and
          // model-change subscription for this Monaco editor instance.
          cleanupSaveShortcut()
          modelContentSub.dispose()
        })

        modifiedEditor.focus()
      } else {
        diffEditor.focus()
      }

      // Why: clear modifiedEditor on dispose so effects don't invoke methods
      // on a disposed Monaco editor.
      diffEditor.onDidDispose(() => {
        lineNumberOptionsSubRef.current?.dispose()
        lineNumberOptionsSubRef.current = null
        diffEditorRef.current = null
        setModifiedEditor(null)
      })
    },
    [editable, setupCopy, modelKey, filePath, sideBySide]
  )

  // Why: VS Code snapshots diff view state on deactivation, not on scroll events.
  // The useLayoutEffect cleanup fires synchronously before React unmounts the
  // component on tab switch, which is Orca's equivalent of VS Code's clearInput().
  useLayoutEffect(() => {
    return () => {
      const de = diffEditorRef.current
      if (de) {
        const currentViewState = de.saveViewState()
        if (currentViewState) {
          setWithLRU(diffViewStateCache, modelKey, currentViewState)
        }
      }
    }
  }, [modelKey])

  useEffect(() => {
    const diffEditor = diffEditorRef.current
    if (!diffEditor) {
      return
    }
    lineNumberOptionsSubRef.current?.dispose()
    lineNumberOptionsSubRef.current = applyDiffEditorLineNumberOptions(diffEditor, sideBySide)
    return () => {
      lineNumberOptionsSubRef.current?.dispose()
      lineNumberOptionsSubRef.current = null
    }
  }, [sideBySide])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={diffBodyRef} className="flex-1 min-h-0 relative">
        {renderLimit.limited ? (
          <LargeDiffFallback
            filePath={relativePath}
            renderLimit={renderLimit}
            action={getDiffViewerLargeDiffSaveAction({
              editable,
              modifiedContent,
              onSave,
              saveContentAvailable: largeDiffSaveContentAvailable
            })}
          />
        ) : (
          <DiffEditor
            height="100%"
            language={language}
            original={originalContent}
            modified={modifiedContent}
            theme={isDark ? 'vs-dark' : 'vs'}
            onMount={handleMount}
            // Why: A single file can have multiple live diff tabs at once
            // (staged, unstaged, branch compare versions). The kept Monaco models
            // must therefore key off the tab identity, not the raw file path, or
            // one diff tab can incorrectly reuse another tab's model contents.
            // Why: Changes mode sometimes needs to rotate only the original-side
            // model after HEAD moves, while preserving the modified-side model's
            // undo stack for continued editing.
            originalModelPath={currentDiffModelPaths.originalModelPath}
            modifiedModelPath={currentDiffModelPaths.modifiedModelPath}
            keepCurrentOriginalModel
            keepCurrentModifiedModel
            options={{
              readOnly: !editable,
              originalEditable: false,
              renderSideBySide: sideBySide,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: diffEditorFontSize,
              fontFamily: settings?.terminalFontFamily || 'monospace',
              lineNumbers: 'on',
              ...buildDiffEditorWordWrapOptions(settings?.diffWordWrap),
              automaticLayout: true,
              renderOverviewRuler: true,
              scrollbar: diffEditorScrollbarOptions,
              padding: { top: 0 },
              find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: 'never',
                seedSearchStringFromSelection: 'never'
              }
            }}
          />
        )}
      </div>
      {toastNode}
    </div>
  )
}
