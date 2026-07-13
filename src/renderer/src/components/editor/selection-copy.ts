export type LineRangeSelection = {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

type FormatCopiedSelectionArgs = {
  relativePath: string
  language: string
  selection: LineRangeSelection
  selectedText: string
}

/** Format a selection for agent-ready paste (editor line numbers). */
export function formatCopiedSelectionLines({
  relativePath,
  language,
  startLine,
  endLine,
  selectedText
}: {
  relativePath: string
  language: string
  startLine: number
  endLine: number
  selectedText: string
}): string | null {
  if (endLine < startLine) {
    return null
  }

  const codeFenceLanguage = getCodeFenceLanguage(language)
  const codeBlock = selectedText.endsWith('\n') ? selectedText : `${selectedText}\n`
  const lineLabel = startLine === endLine ? `Line: ${startLine}` : `Lines: ${startLine}-${endLine}`

  return `File: ${relativePath}\n${lineLabel}\n\n\`\`\`${codeFenceLanguage}\n${codeBlock}\`\`\``
}

export function formatCopiedSelectionWithContext({
  relativePath,
  language,
  selection,
  selectedText
}: FormatCopiedSelectionArgs): string | null {
  // Why: caret-sized one-line the editor selections stay plain clipboard text.
  const isSingleLineSelection = selection.startLineNumber === selection.endLineNumber
  if (isSingleLineSelection) {
    return null
  }
  const { startLine, endLine } = getContextualCopyLineRange(selection)
  return formatCopiedSelectionLines({
    relativePath,
    language,
    startLine,
    endLine,
    selectedText
  })
}

export function getContextualCopyLineRange(selection: LineRangeSelection): {
  startLine: number
  endLine: number
} {
  return {
    startLine: selection.startLineNumber,
    endLine: getInclusiveEndLine(selection)
  }
}

export function getInclusiveEndLine(selection: LineRangeSelection): number {
  if (selection.startLineNumber === selection.endLineNumber) {
    return selection.endLineNumber
  }

  // Why: the editor reports a full-line selection as ending at column 1 of the
  // following line. We translate that boundary back to the last copied line so
  // pasted context matches what the user actually selected.
  if (selection.endColumn === 1) {
    return selection.endLineNumber - 1
  }

  return selection.endLineNumber
}

function getCodeFenceLanguage(language: string): string {
  switch (language) {
    case 'plaintext':
      return ''
    case 'typescript':
      return 'ts'
    case 'javascript':
      return 'js'
    default:
      return language
  }
}
