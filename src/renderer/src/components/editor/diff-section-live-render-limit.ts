import type { DiffSection } from './diff-section-types'
import {
  countLinesEmptyAsZero,
  getLargeDiffRenderLimitFromCounts,
  type LargeDiffRenderLimit
} from './large-diff-render-limit'

export function getLiveDiffSectionRenderLimit({
  section,
  modifiedContent
}: {
  section: DiffSection
  modifiedContent: string
}): LargeDiffRenderLimit {
  const modifiedLineCount = countLinesEmptyAsZero(modifiedContent)

  return getLargeDiffRenderLimitFromCounts({
    originalLineCount: section.largeDiffRenderLimit?.lineCounts?.original ?? 0,
    modifiedLineCount,
    originalCharacterCount: section.originalContent.length,
    modifiedCharacterCount: modifiedContent.length
  })
}
