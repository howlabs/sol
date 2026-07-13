import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink, RefreshCw, RotateCcw, MessageSquare } from '@/lib/icons'
import { useConfirmationDialog } from '@/components/confirmation-dialog'
import { isLocalPathOpenBlocked, showLocalPathOpenBlockedToast } from '@/lib/local-path-open-guard'
import {
  activeAgentNotesSendFailureMessage,
  sendNotesToActiveAgentSession
} from '@/lib/active-agent-note-send'
import { getConnectionId } from '@/lib/connection-context'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { buildAgentChangesAskAgentPrompt } from './agent-changes-ask-agent'
import { AgentChangesFileList } from './agent-changes-file-list'
import { AgentChangesHunkList } from './agent-changes-hunk-list'
import { useAgentChangesPanel } from './use-agent-changes-panel'

export default function AgentChangesPanel(): React.JSX.Element {
  const rightSidebarOpen = useAppStore((s) => s.rightSidebarOpen)
  const rightSidebarTab = useAppStore((s) => s.rightSidebarTab)
  const settings = useAppStore((s) => s.settings)
  const active = rightSidebarOpen && rightSidebarTab === 'agent-changes'

  const panel = useAgentChangesPanel(active)
  const confirm = useConfirmationDialog()
  const [isFileDetailOpen, setIsFileDetailOpen] = useState(false)

  const selectedFile = useMemo(
    () => panel.snapshot?.files.find((f) => f.relativePath === panel.selectedPath) ?? null,
    [panel.snapshot, panel.selectedPath]
  )

  const handleOpenInIde = useCallback(async () => {
    if (!selectedFile || !panel.worktreeId) {
      return
    }
    const connectionId = getConnectionId(panel.worktreeId)
    if (isLocalPathOpenBlocked(settings, { connectionId })) {
      showLocalPathOpenBlockedToast()
      return
    }
    const result = await window.api.shell.openInExternalEditor(selectedFile.absolutePath)
    if (!result.ok) {
      toast.error(
        translate(
          'auto.components.agent.changes.openIdeFailed',
          'Could not open file in external editor.'
        )
      )
    }
  }, [selectedFile, panel.worktreeId, settings])

  const handleDiscard = useCallback(async () => {
    if (!selectedFile) {
      return
    }
    const confirmed = await confirm({
      title: translate('auto.components.agent.changes.discardTitle', 'Discard file changes?'),
      description: translate(
        'auto.components.agent.changes.discardDescription',
        'This restores or removes “{path}” in the worktree. This cannot be undone from Sol.'
      ).replace('{path}', selectedFile.relativePath),
      confirmLabel: translate('auto.components.agent.changes.discardConfirm', 'Discard'),
      confirmVariant: 'destructive'
    })
    if (!confirmed) {
      return
    }
    try {
      await panel.discardSelected()
      toast.success(
        translate('auto.components.agent.changes.discardDone', 'Discarded {path}').replace(
          '{path}',
          selectedFile.relativePath
        )
      )
    } catch {
      toast.error(
        translate('auto.components.agent.changes.discardFailed', 'Could not discard changes.')
      )
    }
  }, [confirm, panel, selectedFile])

  const handleAskAgent = useCallback(async () => {
    if (!selectedFile || !panel.worktreeId) {
      return
    }
    const prompt = buildAgentChangesAskAgentPrompt({
      relativePath: selectedFile.relativePath,
      status: selectedFile.status,
      selectedLines: panel.selectedLines
    })
    if (!prompt) {
      return
    }
    const result = await sendNotesToActiveAgentSession({
      worktreeId: panel.worktreeId,
      prompt
    })
    if (result.status === 'sent') {
      toast.success(translate('auto.components.agent.changes.askAgentSent', 'Sent to active agent'))
      return
    }
    // Fallback: clipboard so the user can paste into any agent composer.
    try {
      await window.api.ui.writeClipboardText(prompt)
      toast.message(
        translate(
          'auto.components.agent.changes.askAgentClipboard',
          'Copied review prompt to clipboard (no active agent ready).'
        )
      )
    } catch {
      const message = activeAgentNotesSendFailureMessage(result.status, {
        explicitTarget: false
      })
      toast.error(message)
    }
  }, [panel.selectedLines, panel.worktreeId, selectedFile])

  const summary = panel.snapshot?.summary
  const showFileDetail = isFileDetailOpen && selectedFile !== null

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-foreground">
            {translate('auto.components.agent.changes.title', 'Changes')}
          </div>
          <div className="text-[11px] text-muted-foreground tabular-nums">
            {summary
              ? translate(
                  'auto.components.agent.changes.summary',
                  '{files} files · +{additions} −{deletions}'
                )
                  .replace('{files}', String(summary.files))
                  .replace('{additions}', String(summary.additions))
                  .replace('{deletions}', String(summary.deletions))
              : translate('auto.components.agent.changes.summaryIdle', 'Worktree local changes')}
          </div>
        </div>
        <PanelIconButton
          label={translate('auto.components.agent.changes.refresh', 'Refresh')}
          onClick={() => panel.refresh()}
          disabled={panel.loading}
        >
          <RefreshCw className={cn('size-3.5', panel.loading && 'animate-spin')} />
        </PanelIconButton>
      </div>

      {!panel.worktreeId || !panel.worktreePath ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-muted-foreground">
          {translate(
            'auto.components.agent.changes.noWorktree',
            'Select a worktree to review changes.'
          )}
        </div>
      ) : panel.error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-xs">
          <div className="text-destructive">{panel.error}</div>
          <button
            type="button"
            className="text-foreground underline-offset-2 hover:underline"
            onClick={() => panel.refresh()}
          >
            {translate('auto.components.agent.changes.retry', 'Retry')}
          </button>
        </div>
      ) : panel.loading && !panel.snapshot ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
          {translate('auto.components.agent.changes.loading', 'Loading changes…')}
        </div>
      ) : panel.snapshot && panel.snapshot.files.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-muted-foreground">
          {translate('auto.components.agent.changes.empty', 'No local changes')}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Why: a selected diff needs the full pane; rendering it beneath the
              file navigator creates a cramped review surface and competing scroll regions. */}
          {showFileDetail ? (
            <>
              <div className="flex min-w-0 items-center gap-1 border-b border-sidebar-border bg-background/40 px-2 py-1">
                <PanelIconButton
                  label={translate('auto.components.agent.changes.backToFiles', 'Back to files')}
                  onClick={() => setIsFileDetailOpen(false)}
                >
                  <ArrowLeft className="size-3.5" />
                </PanelIconButton>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground">
                  {selectedFile.relativePath}
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{selectedFile.additions}
                  </span>{' '}
                  <span className="text-rose-600 dark:text-rose-400">
                    −{selectedFile.deletions}
                  </span>
                </span>
                <PanelIconButton
                  label={translate('auto.components.agent.changes.openIde', 'Open in IDE')}
                  onClick={() => void handleOpenInIde()}
                  disabled={!selectedFile}
                >
                  <ExternalLink className="size-3.5" />
                </PanelIconButton>
                <PanelIconButton
                  label={translate('auto.components.agent.changes.discard', 'Discard')}
                  onClick={() => void handleDiscard()}
                  disabled={!selectedFile}
                >
                  <RotateCcw className="size-3.5" />
                </PanelIconButton>
                <PanelIconButton
                  label={translate('auto.components.agent.changes.askAgent', 'Ask agent')}
                  onClick={() => void handleAskAgent()}
                  disabled={!selectedFile}
                >
                  <MessageSquare className="size-3.5" />
                </PanelIconButton>
              </div>
              <AgentChangesHunkList
                key={selectedFile.relativePath}
                file={selectedFile}
                loadingFile={panel.loadingFile}
                onSelectionChange={panel.setSelectedLines}
              />
            </>
          ) : (
            <AgentChangesFileList
              files={panel.snapshot?.files ?? []}
              selectedPath={panel.selectedPath}
              onSelect={(relativePath) => {
                panel.selectFile(relativePath)
                setIsFileDetailOpen(true)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function PanelIconButton({
  label,
  onClick,
  disabled,
  children
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}
