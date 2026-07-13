import { useCallback, useEffect, useRef, type MutableRefObject, type ReactNode } from 'react'
import { detectLanguage } from '@/lib/language-detect'
import { useAppStore } from '@/store'
import { computeDiffEditorFontSize } from '@/lib/editor-font-zoom'
import { DiffSectionHeader } from './DiffSectionHeader'
import type { DiffSection } from './diff-section-types'
import { installEditorSaveShortcut } from './editor-shortcuts'
import { DiffSectionBody } from './DiffSectionBody'
import { useDiffSectionLayoutMetrics } from './useDiffSectionLayoutMetrics'
import { useDiffSectionFallbackCleanup } from './useDiffSectionFallbackCleanup'
import { getLiveDiffSectionRenderLimit } from './diff-section-live-render-limit'
import {
  destroyCodeMirrorDiffHost,
  focusCodeMirrorDiffHost,
  getCodeMirrorDiffModifiedDom,
  getCodeMirrorDiffModifiedText,
  mountCodeMirrorDiffHost,
  syncCodeMirrorDiffHostDocs,
  type CodeMirrorDiffHost
} from './codemirror-diff-host'

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
  modifiedContentGettersRef,
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
  modifiedContentGettersRef: MutableRefObject<Map<number, () => string>>
  handleSectionSaveRef: MutableRefObject<(index: number) => Promise<void>>
}): React.JSX.Element {
  const editorFontZoomLevel = useAppStore((s) => s.editorFontZoomLevel)
  const language = detectLanguage(section.path)
  const isEditable = section.area === 'unstaged'
  const fontSize = computeDiffEditorFontSize(settings?.terminalFontSize ?? 13, editorFontZoomLevel)
  const fontFamily = settings?.terminalFontFamily || 'monospace'
  const wordWrap = settings?.diffWordWrap === true

  const sectionBodyRef = useRef<HTMLDivElement | null>(null)
  const editorHostRef = useRef<HTMLDivElement | null>(null)
  const hostRef = useRef<CodeMirrorDiffHost | null>(null)

  const { lineStats, sectionBodyHeight, useIntrinsicImageHeight, isLargeDiffLimited } =
    useDiffSectionLayoutMetrics({
      section,
      sectionHeight
    })

  const destroyHost = useCallback((): void => {
    if (hostRef.current) {
      destroyCodeMirrorDiffHost(hostRef.current)
      hostRef.current = null
    }
    if (modifiedContentGettersRef.current.get(index)) {
      modifiedContentGettersRef.current.delete(index)
    }
  }, [index, modifiedContentGettersRef])

  useDiffSectionFallbackCleanup({
    disposeDiffModels: destroyHost,
    index,
    isLargeDiffLimited,
    setSectionHeights
  })

  useEffect(() => {
    if (section.collapsed) {
      destroyHost()
    }
  }, [destroyHost, section.collapsed])

  useEffect(() => {
    loadSection(index)
  }, [index, loadSection])

  const showTextHost =
    !section.collapsed &&
    !section.loading &&
    !section.error &&
    section.diffResult?.kind !== 'binary' &&
    !isLargeDiffLimited

  // Mount / rebuild CodeMirror when the section is ready for a text diff.
  useEffect(() => {
    if (!showTextHost) {
      destroyHost()
      return
    }
    const parent = editorHostRef.current
    if (!parent) {
      return
    }

    destroyHost()
    parent.replaceChildren()

    const host = mountCodeMirrorDiffHost({
      parent,
      originalContent: section.originalContent,
      modifiedContent: section.modifiedContent,
      language,
      fontSize,
      fontFamily,
      wordWrap,
      sideBySide,
      editable: isEditable,
      relativePath: section.path,
      reviewKey: `${worktreeId ?? 'diff'}\0${section.key}`,
      collapseUnchanged: true,
      onContentChange: (current) => {
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
            // Why: virtualized rows unmount when scrolled away; draft lives in section state.
            return {
              ...s,
              modifiedContent: current,
              dirty,
              largeDiffRenderLimit: getLiveDiffSectionRenderLimit({
                section: s,
                modifiedContent: current
              })
            }
          })
          return changed ? next : prev
        })
      },
      onContentHeightChange: (contentHeight) => {
        setSectionHeights((prev) => {
          if (prev[index] === contentHeight) {
            return prev
          }
          return { ...prev, [index]: contentHeight }
        })
      }
    })
    hostRef.current = host
    modifiedContentGettersRef.current.set(index, () => getCodeMirrorDiffModifiedText(host))

    let cleanupSave: (() => void) | undefined
    if (isEditable) {
      cleanupSave = installEditorSaveShortcut(getCodeMirrorDiffModifiedDom(host), () => {
        void handleSectionSaveRef.current(index)
      })
    }
    focusCodeMirrorDiffHost(host, isEditable)

    return () => {
      cleanupSave?.()
      destroyHost()
      parent.replaceChildren()
    }
    // Rebuild on structural config; document text syncs separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional structural deps
  }, [
    destroyHost,
    fontFamily,
    fontSize,
    handleSectionSaveRef,
    index,
    isDark,
    isEditable,
    language,
    modifiedContentGettersRef,
    setSectionHeights,
    setSections,
    showTextHost,
    sideBySide,
    wordWrap,
    worktreeId,
    section.contentGeneration,
    section.path
  ])

  // Sync docs when section content updates without remount (e.g. external reload).
  useEffect(() => {
    if (!hostRef.current || !showTextHost) {
      return
    }
    syncCodeMirrorDiffHostDocs(hostRef.current, section.originalContent, section.modifiedContent)
  }, [
    section.modifiedContent,
    section.originalContent,
    showTextHost,
    sideBySide,
    section.contentGeneration
  ])

  return (
    <div className="border-b border-border">
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
          editorHostRef={editorHostRef}
          sectionBodyHeight={sectionBodyHeight}
          useIntrinsicImageHeight={useIntrinsicImageHeight}
          isBranchMode={isBranchMode}
          sideBySide={sideBySide}
          isEditable={isEditable}
          onRetrySection={retrySection}
          onSaveLimitedDiff={() => {
            void handleSectionSaveRef.current(index)
          }}
        />
      )}
    </div>
  )
}
