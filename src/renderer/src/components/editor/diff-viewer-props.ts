import type { LargeDiffRenderLimit } from './large-diff-render-limit'

export type DiffViewerProps = {
  modelKey: string
  originalModelKey?: string
  modifiedModelKey?: string
  originalContent: string
  modifiedContent: string
  language: string
  filePath: string
  relativePath: string
  sideBySide: boolean
  editable?: boolean
  worktreeId?: string
  onContentChange?: (content: string) => void
  onSave?: (content: string) => void
  largeDiffRenderLimit?: LargeDiffRenderLimit
  // Why: main-process limited diffs intentionally blank text bodies before IPC;
  // the fallback must not treat that placeholder as a saveable draft.
  largeDiffSaveContentAvailable?: boolean
}
