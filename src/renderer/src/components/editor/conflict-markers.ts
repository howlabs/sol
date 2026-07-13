/** Pure git conflict marker parsing for editor decorations. */

export type ConflictBlock = {
  startLine: number
  baseLine?: number
  separatorLine: number
  endLine: number
}

export function findGitConflictBlocks(content: string): ConflictBlock[] {
  const blocks: ConflictBlock[] = []
  let current: {
    startLine: number
    baseLine?: number
    separatorLine?: number
  } | null = null

  forEachLine(content, (lineStart, lineEnd, lineNumber) => {
    if (lineStartsWith(content, lineStart, lineEnd, '<<<<<<<')) {
      current = { startLine: lineNumber }
      return
    }
    if (!current) {
      return
    }
    if (lineStartsWith(content, lineStart, lineEnd, '|||||||')) {
      current.baseLine = lineNumber
      return
    }
    if (lineEquals(content, lineStart, lineEnd, '=======')) {
      current.separatorLine = lineNumber
      return
    }
    if (lineStartsWith(content, lineStart, lineEnd, '>>>>>>>')) {
      if (current.separatorLine) {
        blocks.push({
          startLine: current.startLine,
          ...(current.baseLine === undefined ? {} : { baseLine: current.baseLine }),
          separatorLine: current.separatorLine,
          endLine: lineNumber
        })
      }
      current = null
    }
  })

  return blocks
}

export function hasGitConflictMarkers(content: string): boolean {
  let found = false
  forEachLine(content, (lineStart, lineEnd) => {
    found =
      lineStartsWith(content, lineStart, lineEnd, '<<<<<<<') ||
      lineStartsWith(content, lineStart, lineEnd, '|||||||') ||
      lineEquals(content, lineStart, lineEnd, '=======') ||
      lineStartsWith(content, lineStart, lineEnd, '>>>>>>>')
    return found ? false : undefined
  })
  return found
}

export function getGitConflictMarkerLineLength(content: string, lineNumber: number): number {
  if (!Number.isInteger(lineNumber) || lineNumber < 1) {
    return 0
  }
  let foundLength = 0
  forEachLine(content, (lineStart, lineEnd, currentLineNumber) => {
    if (currentLineNumber !== lineNumber) {
      return
    }
    foundLength = lineEnd - lineStart
    return false
  })
  return foundLength
}

function forEachLine(
  content: string,
  visit: (lineStart: number, lineEnd: number, lineNumber: number) => boolean | void
): void {
  let lineStart = 0
  let lineNumber = 1
  for (let index = 0; index <= content.length; index += 1) {
    if (index < content.length && content.charCodeAt(index) !== 10) {
      continue
    }
    const lineEnd = index > lineStart && content.charCodeAt(index - 1) === 13 ? index - 1 : index
    if (visit(lineStart, lineEnd, lineNumber) === false) {
      return
    }
    lineStart = index + 1
    lineNumber += 1
  }
}

function lineStartsWith(
  content: string,
  lineStart: number,
  lineEnd: number,
  prefix: string
): boolean {
  return lineEnd - lineStart >= prefix.length && content.startsWith(prefix, lineStart)
}

function lineEquals(content: string, lineStart: number, lineEnd: number, value: string): boolean {
  return lineEnd - lineStart === value.length && content.startsWith(value, lineStart)
}
