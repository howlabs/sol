import React, { useEffect, useMemo, useState } from 'react'
import { computeEditorFontSize } from '@/lib/editor-font-zoom'
import { resolveDocumentTheme } from '@/lib/document-theme'
import { highlightCode, type HighlightedLine } from '@/lib/shiki-highlighter'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

type MonacoCodeExcerptProps = {
  lines: string[]
  firstLineNumber: number
  highlightedStartLine: number
  highlightedEndLine: number
  language: string
}

export default function MonacoCodeExcerpt({
  lines,
  firstLineNumber,
  highlightedStartLine,
  highlightedEndLine,
  language
}: MonacoCodeExcerptProps): React.JSX.Element {
  const settings = useAppStore((s) => s.settings)
  const editorFontZoomLevel = useAppStore((s) => s.editorFontZoomLevel)
  const editorFontSize = computeEditorFontSize(
    settings?.terminalFontSize ?? 13,
    editorFontZoomLevel
  )
  const fontFamily = settings?.terminalFontFamily || 'monospace'
  const isDark = resolveDocumentTheme(settings?.theme ?? 'system')
  const code = useMemo(() => lines.join('\n'), [lines])
  const [highlightedLines, setHighlightedLines] = useState<HighlightedLine[]>(() => [])

  useEffect(() => {
    if (lines.length === 0) {
      setHighlightedLines([])
      return
    }

    let cancelled = false
    void highlightCode(code, language, isDark)
      .then((result) => {
        if (cancelled) {
          return
        }
        setHighlightedLines(result.lines.slice(0, lines.length))
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setHighlightedLines([])
      })

    return () => {
      cancelled = true
    }
  }, [code, language, isDark, lines])

  return (
    <div
      className="overflow-x-auto py-1 text-[12px] leading-5"
      style={{ fontFamily, fontSize: editorFontSize }}
    >
      {lines.map((codeLine, index) => {
        const lineNumber = firstLineNumber + index
        const isCommentedLine =
          lineNumber >= highlightedStartLine && lineNumber <= highlightedEndLine
        const tokens = highlightedLines[index]
        return (
          <div
            key={lineNumber}
            className={cn('flex font-mono', isCommentedLine && 'bg-emerald-500/10')}
          >
            <span className="w-12 shrink-0 select-none border-r border-border/40 px-2 text-right text-muted-foreground tabular-nums">
              {lineNumber}
            </span>
            {tokens && tokens.length > 0 ? (
              <code className="min-w-max flex-1 whitespace-pre px-3 text-foreground">
                {tokens.map((token, tokenIndex) => (
                  <span key={tokenIndex} style={token.color ? { color: token.color } : undefined}>
                    {token.content}
                  </span>
                ))}
              </code>
            ) : (
              <code className="min-w-max flex-1 whitespace-pre px-3 text-foreground">
                {codeLine || ' '}
              </code>
            )}
          </div>
        )
      })}
    </div>
  )
}
