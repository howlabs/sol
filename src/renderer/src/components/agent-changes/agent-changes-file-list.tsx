import React from 'react'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import type { AgentChangedFile } from './agent-changes-types'

function statusLabel(status: AgentChangedFile['status']): string {
  switch (status) {
    case 'added':
      return 'A'
    case 'deleted':
      return 'D'
    case 'renamed':
      return 'R'
    case 'untracked':
      return 'U'
    case 'conflict':
      return 'C'
    case 'modified':
    default:
      return 'M'
  }
}

export function AgentChangesFileList({
  files,
  selectedPath,
  onSelect
}: {
  files: readonly AgentChangedFile[]
  selectedPath: string | null
  onSelect: (relativePath: string) => void
}): React.JSX.Element {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-sleek py-1">
      {files.map((file) => {
        const selected = file.relativePath === selectedPath
        return (
          <button
            key={file.relativePath}
            type="button"
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1 text-left text-xs transition-colors',
              selected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/40'
            )}
            onClick={() => onSelect(file.relativePath)}
          >
            <span
              className={cn(
                'w-3 shrink-0 font-mono text-[10px] font-medium',
                file.status === 'added' || file.status === 'untracked'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : file.status === 'deleted'
                    ? 'text-rose-600 dark:text-rose-400'
                    : file.status === 'conflict'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
              )}
            >
              {statusLabel(file.status)}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono" title={file.relativePath}>
              {file.relativePath}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
              {file.binary ? (
                translate('auto.components.agent.changes.fileList.binary', 'bin')
              ) : (
                <>
                  <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>{' '}
                  <span className="text-rose-600 dark:text-rose-400">−{file.deletions}</span>
                </>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
