import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useAppStore } from '@/store'
import { diffViewStateCache, setWithLRU } from '@/lib/scroll-cache'
import { computeDiffEditorFontSize } from '@/lib/editor-font-zoom'
import { installEditorSaveShortcut } from './editor-shortcuts'
import { LargeDiffFallback } from './LargeDiffFallback'
import { getLargeDiffRenderLimit } from './large-diff-render-limit'
import { getDiffViewerLargeDiffSaveAction } from './diff-viewer-large-diff-save-action'
import type { DiffViewerProps } from './diff-viewer-props'
import {
  applyCodeMirrorDiffViewState,
  destroyCodeMirrorDiffHost,
  focusCodeMirrorDiffHost,
  getCodeMirrorDiffModifiedDom,
  getCodeMirrorDiffModifiedText,
  mountCodeMirrorDiffHost,
  readCodeMirrorDiffViewState,
  scrollCodeMirrorDiffToFirstChange,
  syncCodeMirrorDiffHostDocs,
  type CodeMirrorDiffHost
} from './codemirror-diff-host'

export default function DiffViewer({
  modelKey,
  originalContent,
  modifiedContent,
  language,
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
  const fontSize = computeDiffEditorFontSize(settings?.terminalFontSize ?? 13, editorFontZoomLevel)
  const fontFamily = settings?.terminalFontFamily || 'monospace'
  const wordWrap = settings?.diffWordWrap === true
  const isDark =
    settings?.theme === 'dark' ||
    (settings?.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const hostRef = useRef<CodeMirrorDiffHost | null>(null)
  const didAutoScrollRef = useRef(false)
  const didAutoScrollModelKeyRef = useRef(modelKey)
  const onSaveRef = useRef(onSave)
  const onContentChangeRef = useRef(onContentChange)
  onSaveRef.current = onSave
  onContentChangeRef.current = onContentChange

  const renderLimit = useMemo(
    () => largeDiffRenderLimit ?? getLargeDiffRenderLimit({ originalContent, modifiedContent }),
    [largeDiffRenderLimit, originalContent, modifiedContent]
  )

  const destroyHost = useCallback((): void => {
    if (!hostRef.current) {
      return
    }
    destroyCodeMirrorDiffHost(hostRef.current)
    hostRef.current = null
  }, [])

  useEffect(() => {
    if (renderLimit.limited) {
      destroyHost()
    }
  }, [destroyHost, renderLimit.limited])

  useEffect(() => {
    if (didAutoScrollModelKeyRef.current !== modelKey) {
      didAutoScrollModelKeyRef.current = modelKey
      didAutoScrollRef.current = false
    }
  }, [modelKey])

  useEffect(() => {
    if (renderLimit.limited) {
      return
    }
    const container = containerRef.current
    if (!container) {
      return
    }

    destroyHost()
    container.replaceChildren()

    const host = mountCodeMirrorDiffHost({
      parent: container,
      originalContent,
      modifiedContent,
      language,
      fontSize,
      fontFamily,
      wordWrap,
      sideBySide,
      editable: Boolean(editable),
      relativePath,
      reviewKey: modelKey,
      onContentChange: (content) => onContentChangeRef.current?.(content)
    })
    hostRef.current = host

    const saved = diffViewStateCache.get(modelKey)
    if (saved) {
      requestAnimationFrame(() => applyCodeMirrorDiffViewState(host, saved))
    } else if (!didAutoScrollRef.current) {
      requestAnimationFrame(() => {
        if (didAutoScrollRef.current) {
          return
        }
        scrollCodeMirrorDiffToFirstChange(host)
        didAutoScrollRef.current = true
      })
    }

    let cleanupSave: (() => void) | undefined
    if (editable) {
      cleanupSave = installEditorSaveShortcut(getCodeMirrorDiffModifiedDom(host), () => {
        onSaveRef.current?.(getCodeMirrorDiffModifiedText(host))
      })
    }
    focusCodeMirrorDiffHost(host, Boolean(editable))

    return () => {
      cleanupSave?.()
      const current = hostRef.current
      if (current) {
        setWithLRU(diffViewStateCache, modelKey, readCodeMirrorDiffViewState(current))
      }
      destroyHost()
      container.replaceChildren()
    }
    // Structural rebuild only; document text is synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional structural deps
  }, [
    destroyHost,
    editable,
    fontFamily,
    fontSize,
    isDark,
    language,
    modelKey,
    relativePath,
    renderLimit.limited,
    sideBySide,
    wordWrap
  ])

  useEffect(() => {
    if (renderLimit.limited || !hostRef.current) {
      return
    }
    syncCodeMirrorDiffHostDocs(hostRef.current, originalContent, modifiedContent)
  }, [modifiedContent, originalContent, renderLimit.limited, sideBySide])

  useLayoutEffect(() => {
    return () => {
      const host = hostRef.current
      if (host) {
        setWithLRU(diffViewStateCache, modelKey, readCodeMirrorDiffViewState(host))
      }
    }
  }, [modelKey])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
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
          <div
            ref={containerRef}
            className="h-full min-h-0 min-w-0 w-full overflow-hidden bg-editor-surface [&_.cm-mergeView]:h-full [&_.cm-mergeView]:min-w-0 [&_.cm-mergeView]:w-full [&_.cm-editor]:h-full [&_.cm-editor]:min-w-0 [&_.cm-editor]:w-full"
            data-testid="codemirror-diff-viewer"
            data-side-by-side={sideBySide ? 'true' : 'false'}
            data-editable={editable ? 'true' : 'false'}
            role="region"
            aria-label={relativePath || 'Diff'}
          />
        )}
      </div>
    </div>
  )
}
