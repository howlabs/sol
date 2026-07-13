export const EDITOR_AUTO_HEIGHT_LINE_SCAN_CODE_UNITS = 64 * 1024
export const EDITOR_AUTO_HEIGHT_MAX_LINES = 2_000
const EDITOR_AUTO_HEIGHT_EXTRA_PX = 18
const EDITOR_AUTO_HEIGHT_MIN_PX = 80

export function getAutoHeightForContent(content: string, lineHeight: number): number {
  const lineCount = countAutoHeightLines(content)
  return clampAutoHeight(lineCount * lineHeight + EDITOR_AUTO_HEIGHT_EXTRA_PX, lineHeight)
}

export function clampAutoHeight(height: number, lineHeight: number): number {
  return Math.max(
    EDITOR_AUTO_HEIGHT_MIN_PX,
    Math.min(Math.ceil(height), getAutoHeightMaxPx(lineHeight))
  )
}

export function isAutoHeightCapped(height: number | null, lineHeight: number): boolean {
  return height !== null && height >= getAutoHeightMaxPx(lineHeight)
}

function countAutoHeightLines(content: string): number {
  if (content.length === 0) {
    return 1
  }

  const scanLength = Math.min(content.length, EDITOR_AUTO_HEIGHT_LINE_SCAN_CODE_UNITS)
  let lineCount = 1
  for (let index = 0; index < scanLength; index += 1) {
    if (content.charCodeAt(index) !== 10) {
      continue
    }
    lineCount += 1
    if (lineCount >= EDITOR_AUTO_HEIGHT_MAX_LINES) {
      return EDITOR_AUTO_HEIGHT_MAX_LINES
    }
  }
  return lineCount
}

function getAutoHeightMaxPx(lineHeight: number): number {
  return EDITOR_AUTO_HEIGHT_MAX_LINES * lineHeight + EDITOR_AUTO_HEIGHT_EXTRA_PX
}
