import React, { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import type { AgentChangedFile, UnifiedHunkLine } from './agent-changes-types'

export function AgentChangesHunkList({
  file,
  loadingFile,
  onSelectionChange
}: {
  file: AgentChangedFile | null
  loadingFile: boolean
  onSelectionChange: (lines: UnifiedHunkLine[]) => void
}): React.JSX.Element {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())

  const flatLines = useMemo(() => {
    if (!file?.hunks) {
      return [] as (UnifiedHunkLine & { key: string; isHeader?: boolean; header?: string })[]
    }
    const rows: (UnifiedHunkLine & { key: string; isHeader?: boolean; header?: string })[] = []
    file.hunks.forEach((hunk, hunkIndex) => {
      rows.push({
        key: `h-${hunkIndex}`,
        kind: 'context',
        text: hunk.header,
        isHeader: true,
        header: hunk.header
      })
      hunk.lines.forEach((line, lineIndex) => {
        rows.push({
          ...line,
          key: `h-${hunkIndex}-l-${lineIndex}`
        })
      })
    })
    return rows
  }, [file?.hunks])

  const toggleLine = useCallback(
    (key: string, isHeader: boolean | undefined) => {
      if (isHeader) {
        return
      }
      setSelectedKeys((prev) => {
        const next = new Set(prev)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }
        const selected = flatLines
          .filter((row) => !row.isHeader && next.has(row.key))
          .map(({ kind, text, oldLine, newLine }) => ({ kind, text, oldLine, newLine }))
        onSelectionChange(selected)
        return next
      })
    },
    [flatLines, onSelectionChange]
  )

  if (!file) {
    return (
      <div className="flex flex-1 items-center justify-center px-3 text-xs text-muted-foreground">
        {translate('auto.components.agent.changes.hunkList.selectFile', 'Select a file to review')}
      </div>
    )
  }

  if (file.binary) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center text-xs text-muted-foreground">
        <div className="font-medium text-foreground">
          {translate('auto.components.agent.changes.hunkList.binaryFile', 'Binary file')}
        </div>
        <div>
          {translate(
            'auto.components.agent.changes.hunkList.binaryHint',
            'Text diff is unavailable. Open in your external editor to inspect.'
          )}
        </div>
      </div>
    )
  }

  if (file.tooLarge) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center text-xs text-muted-foreground">
        <div className="font-medium text-foreground">
          {translate('auto.components.agent.changes.hunkList.tooLarge', 'Diff too large')}
        </div>
        <div>
          {translate(
            'auto.components.agent.changes.hunkList.tooLargeHint',
            'Open in your external editor for the full review.'
          )}
        </div>
      </div>
    )
  }

  if (loadingFile && file.hunks === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
        {translate('auto.components.agent.changes.hunkList.loading', 'Loading diff…')}
      </div>
    )
  }

  if (!file.hunks || file.hunks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
        {translate(
          'auto.components.agent.changes.hunkList.noChanges',
          'No textual changes to display'
        )}
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto scrollbar-editor font-mono text-[11px] leading-5">
      {flatLines.map((row) => {
        if (row.isHeader) {
          return (
            <div
              key={row.key}
              className="sticky top-0 z-[1] bg-muted/80 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {row.header}
            </div>
          )
        }
        const selected = selectedKeys.has(row.key)
        return (
          <button
            key={row.key}
            type="button"
            className={cn(
              'flex w-full text-left whitespace-pre',
              row.kind === 'add' && 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
              row.kind === 'del' && 'bg-rose-500/10 text-rose-900 dark:text-rose-100',
              selected && 'ring-1 ring-inset ring-ring'
            )}
            onClick={() => toggleLine(row.key, row.isHeader)}
          >
            <span className="w-10 shrink-0 select-none border-r border-border/40 px-1 text-right text-[10px] text-muted-foreground tabular-nums">
              {row.newLine ?? row.oldLine ?? ''}
            </span>
            <span className="w-3 shrink-0 select-none px-0.5 text-muted-foreground">
              {row.kind === 'add' ? '+' : row.kind === 'del' ? '−' : ' '}
            </span>
            <span className="min-w-0 flex-1 overflow-x-auto px-1">{row.text || ' '}</span>
          </button>
        )
      })}
    </div>
  )
}
