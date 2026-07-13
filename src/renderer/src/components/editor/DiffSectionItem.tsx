import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode
} from 'react'
import type { DiffOnMount } from '@monaco-editor/react'
import type { editor as monacoEditor } from 'monaco-editor'
import { monaco } from '@/lib/monaco-setup'
import { detectLanguage } from '@/lib/language-detect'
import { useAppStore } from '@/store'
import { computeDiffEditorFontSize } from '@/lib/editor-font-zoom'
import { applyDiffEditorLineNumberOptions } from './diff-editor-line-number-options'
import { DiffSectionHeader } from './DiffSectionHeader'
import type { DiffSection } from './diff-section-types'
import { installEditorSaveShortcut } from './editor-shortcuts'
import { DiffSectionBody } from './DiffSectionBody'
import { useDiffSectionLayoutMetrics } from './useDiffSectionLayoutMetrics'
import { disposeUnattachedMonacoModelPaths } from './diff-monaco-model-disposal'
import { getLiveDiffSectionRenderLimit } from './diff-section-live-render-limit'
import { useDiffSectionFallbackCleanup } from './useDiffSectionFallbackCleanup'

export function DiffSectionItem({
  section,
  index,
  isBranchMode,
  sideBySide,
  isDark,
  settings,
  sectionHeight,
  worktreeId,
  loadSection,
  retrySection,
  toggleSection,
  openSection,
  openSectionTitle,
  renderHeaderTrailingContent,
  setSectionHeights,
  setSections,
  modifiedEditorsRef,
  handleSectionSaveRef
}: {
  section: DiffSection
  index: number
  isBranchMode: boolean
  sideBySide: boolean
  isDark: boolean
  settings: {
    terminalFontSize?: number
    terminalFontFamily?: string
    diffWordWrap?: boolean
  } | null
  sectionHeight: number | undefined
  worktreeId?: string
  loadSection: (index: number) => void
  retrySection: (index: number) => void
  toggleSection: (index: number) => void
  openSection: (index: number) => void
  openSectionTitle: string
  renderHeaderTrailingContent?: (section: DiffSection, index: number) => ReactNode
  setSectionHeights: React.Dispatch<React.SetStateAction<Record<number, number>>>
  setSections: React.Dispatch<React.SetStateAction<DiffSection[]>>
  modifiedEditorsRef: MutableRefObject<Map<number, monacoEditor.IStandaloneCodeEditor>>
  handleSectionSaveRef: MutableRefObject<(index: number) => Promise<void>>
}): React.JSX.Element {
  const editorFontZoomLevel = useAppStore((s) => s.editorFontZoomLevel)
  const language = detectLanguage(section.path)
  const isEditable = section.area === 'unstaged'
  const modelPathBase = useMemo(
    () =>
      `diff-section:${encodeURIComponent(worktreeId ?? 'review')}:${encodeURIComponent(section.key)}:${section.contentGeneration ?? 0}`,
    [section.contentGeneration, section.key, worktreeId]
  )
  const diffEditorFontSize = computeDiffEditorFontSize(
    settings?.terminalFontSize ?? 13,
    editorFontZoomLevel
  )

  const diffEditorRef = useRef<monacoEditor.IStandaloneDiffEditor | null>(null)
  const sectionBodyRef = useRef<HTMLDivElement | null>(null)
  const lineNumberOptionsSubRef = useRef<{ dispose: () => void } | null>(null)

  const disposeDiffModels = useCallback(() => {
    window.setTimeout(() => {
      disposeUnattachedMonacoModelPaths(monaco, [
        `${modelPathBase}:original`,
        `${modelPathBase}:modified`
      ])
    }, 0)
  }, [modelPathBase])
  const disposeDiffModelsRef = useRef(disposeDiffModels)
  disposeDiffModelsRef.current = disposeDiffModels

  const setSectionRootNode = useCallback((node: HTMLDivElement | null): void => {
    if (node) {
      return
    }
    // Why: virtualized diff rows remount as their keyed section/collapse state
    // changes; the row root is the owner of the detached Monaco models.
    disposeDiffModelsRef.current()
  }, [])

  useEffect(() => {
    if (section.collapsed) {
      disposeDiffModels()
    }
  }, [disposeDiffModels, section.collapsed])

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

  const { lineStats, sectionBodyHeight, useIntrinsicImageHeight, isLargeDiffLimited } =
    useDiffSectionLayoutMetrics({
      section,
      sectionHeight
    })

  useDiffSectionFallbackCleanup({
    disposeDiffModels,
    index,
    isLargeDiffLimited,
    setSectionHeights
  })

  const handleMount: DiffOnMount = (editor, _monaco) => {
    diffEditorRef.current = editor
    lineNumberOptionsSubRef.current?.dispose()
    lineNumberOptionsSubRef.current = applyDiffEditorLineNumberOptions(editor, sideBySide)
    const modified = editor.getModifiedEditor()

    // Why: measuring before Monaco computes hidden unchanged regions records
    // full-file height, making virtualized combined diffs jump as rows remount.
    let diffLayoutReady = false
    let pendingHeightFrame: number | null = null
    const updateHeight = (): void => {
      const contentHeight = editor.getModifiedEditor().getContentHeight()
      setSectionHeights((prev) => {
        if (prev[index] === contentHeight) {
          return prev
        }
        return { ...prev, [index]: contentHeight }
      })
    }
    const requestHeightUpdate = (): void => {
      if (pendingHeightFrame !== null) {
        return
      }
      pendingHeightFrame = window.requestAnimationFrame(() => {
        pendingHeightFrame = null
        updateHeight()
      })
    }
    const markDiffLayoutReady = (): void => {
      diffLayoutReady = true
      requestHeightUpdate()
    }
    const contentSizeSub = modified.onDidContentSizeChange(() => {
      if (diffLayoutReady) {
        requestHeightUpdate()
      }
    })
    const diffUpdateSub = editor.onDidUpdateDiff(markDiffLayoutReady)
    if (editor.getLineChanges() !== null) {
      markDiffLayoutReady()
    }

    // Why: Monaco disposes inner editors when the DiffEditor container is
    // unmounted (e.g. section collapse, tab change). Clearing the ref
    // prevents effects from invoking methods on a disposed editor instance.
    modified.onDidDispose(() => {
      contentSizeSub.dispose()
      diffUpdateSub.dispose()
      if (pendingHeightFrame !== null) {
        window.cancelAnimationFrame(pendingHeightFrame)
        pendingHeightFrame = null
      }
      lineNumberOptionsSubRef.current?.dispose()
      lineNumberOptionsSubRef.current = null
      diffEditorRef.current = null
      if (modifiedEditorsRef.current.get(index) === modified) {
        modifiedEditorsRef.current.delete(index)
      }
    })

    if (!isEditable) {
      return
    }

    modifiedEditorsRef.current.set(index, modified)
    const cleanupSaveShortcut = installEditorSaveShortcut(modified.getContainerDomNode(), () =>
      handleSectionSaveRef.current(index)
    )
    const modelContentSub = modified.onDidChangeModelContent(() => {
      const current = modified.getValue()
      setSections((prev) => {
        let changed = false
        const next = prev.map((s, i) => {
          if (i !== index) {
            return s
          }

          const savedModifiedContent =
            s.diffResult?.kind === 'text' ? s.diffResult.modifiedContent : s.modifiedContent
          const dirty = current !== savedModifiedContent
          if (s.modifiedContent === current && s.dirty === dirty) {
            return s
          }

          changed = true
          // Why: virtualized rows unmount when scrolled away, so the draft must
          // live in section state instead of only in Monaco's mounted model.
          return {
            ...s,
            modifiedContent: current,
            dirty,
            largeDiffRenderLimit: getLiveDiffSectionRenderLimit({
              section: s,
              modifiedEditor: modified,
              modifiedContent: current
            })
          }
        })
        return changed ? next : prev
      })
    })
    modified.onDidDispose(() => {
      // Why: editable diff sections own both the save shortcut and model-change
      // subscription for this Monaco editor instance.
      cleanupSaveShortcut()
      modelContentSub.dispose()
    })
  }

  useEffect(() => {
    loadSection(index)
  }, [index, loadSection])

  return (
    <div ref={setSectionRootNode} className="border-b border-border">
      <DiffSectionHeader
        path={section.path}
        dirty={section.dirty}
        collapsed={section.collapsed}
        added={lineStats?.added ?? section.added ?? 0}
        removed={lineStats?.removed ?? section.removed ?? 0}
        onToggle={() => toggleSection(index)}
        onOpenSection={(event) => {
          event.stopPropagation()
          openSection(index)
        }}
        openSectionTitle={openSectionTitle}
        trailingContent={renderHeaderTrailingContent?.(section, index)}
      />

      {!section.collapsed && (
        <DiffSectionBody
          section={section}
          index={index}
          sectionBodyRef={sectionBodyRef}
          sectionBodyHeight={sectionBodyHeight}
          useIntrinsicImageHeight={useIntrinsicImageHeight}
          isBranchMode={isBranchMode}
          sideBySide={sideBySide}
          isDark={isDark}
          language={language}
          modelPathBase={modelPathBase}
          isEditable={isEditable}
          diffEditorFontSize={diffEditorFontSize}
          diffWordWrap={settings?.diffWordWrap}
          terminalFontFamily={settings?.terminalFontFamily}
          onRetrySection={retrySection}
          onSaveLimitedDiff={() => {
            void handleSectionSaveRef.current(index)
          }}
          onMount={handleMount}
        />
      )}
    </div>
  )
}
