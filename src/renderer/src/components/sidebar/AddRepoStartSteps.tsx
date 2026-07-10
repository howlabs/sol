import { useEffect, useRef, useState, type ComponentType, type ReactNode, type Ref } from 'react'
import { CircleStop, Loader2 } from '@/lib/icons'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShortcutKeyCombo } from '@/components/ShortcutKeyCombo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  getAddRepoLocalStartActions,
  type AddRepoLocalStartAction
} from './add-repo-local-start-actions'
import { translate } from '@/i18n/i18n'

type AddRepoNestedScanProgressNoticeProps = {
  busyLabel: string
  nestedScanInProgress: boolean
  nestedScanId: string | null
  onStopNestedScan: () => void
}

function AddRepoNestedScanProgressNotice({
  busyLabel,
  nestedScanInProgress,
  nestedScanId,
  onStopNestedScan
}: AddRepoNestedScanProgressNoticeProps): React.JSX.Element {
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-t border-border/50 pt-3 text-[12px] text-muted-foreground"
    >
      <Loader2 className="size-3.5 shrink-0 animate-spin" />
      <span className="min-w-0 flex-1">{busyLabel}</span>
      {nestedScanInProgress && nestedScanId ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="group text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={translate(
                'auto.components.sidebar.AddRepoStartSteps.9906cae183',
                'Stop scan'
              )}
              title={translate(
                'auto.components.sidebar.AddRepoStartSteps.69ea7f8dc4',
                'Stop scanning'
              )}
              onClick={onStopNestedScan}
            >
              <Loader2 className="size-3.5 animate-spin group-hover:hidden group-focus-visible:hidden" />
              <CircleStop className="hidden size-3.5 group-hover:block group-focus-visible:block" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4}>
            {translate(
              'auto.components.sidebar.AddRepoStartSteps.d301db1c9a',
              'Scanning repositories. Click to stop.'
            )}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

type AddRepoLocalStartStepProps = {
  repoCount: number
  isSshLikely: boolean
  isAdding: boolean
  addProjectBusyLabel: string | null
  nestedScanInProgress: boolean
  nestedScanId: string | null
  hostSelector?: ReactNode
  showRemoteAction?: boolean
  canCreateProject?: boolean
  browseHostKind?: 'local' | 'ssh' | 'runtime'
  onBrowse: () => void
  onOpenCloneStep: () => void
  onOpenRemoteStep: () => void
  onOpenCreateStep: () => void
  onStopNestedScan: () => void
}

/**
 * Rebuilt Add Project start surface:
 * host field → one primary stack button → compact alternate methods.
 * Keyboard: ↑/↓ roves focus; ⏎ chip marks the active target.
 */
export function AddRepoLocalStartStep({
  repoCount,
  isSshLikely,
  isAdding,
  addProjectBusyLabel,
  nestedScanInProgress,
  nestedScanId,
  hostSelector,
  showRemoteAction = true,
  canCreateProject = true,
  browseHostKind = 'local',
  onBrowse,
  onOpenCloneStep,
  onOpenRemoteStep,
  onOpenCreateStep,
  onStopNestedScan
}: AddRepoLocalStartStepProps): React.JSX.Element {
  const browseActionRef = useRef<HTMLButtonElement | null>(null)
  const actionsRef = useRef<HTMLDivElement | null>(null)
  const { primaryAction, secondaryActions } = getAddRepoLocalStartActions({
    isSshLikely,
    onBrowse,
    onOpenCloneStep,
    onOpenRemoteStep,
    onOpenCreateStep,
    showRemoteAction,
    canCreateProject,
    browseHostKind
  })

  const [selectedKind, setSelectedKind] = useState<string | null>(primaryAction.kind)

  useEffect(() => {
    if (isAdding) {
      setSelectedKind(null)
      return
    }
    browseActionRef.current?.focus()
  }, [isAdding])

  const handleArrowNavigation = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }
    const buttons = Array.from(
      actionsRef.current?.querySelectorAll<HTMLButtonElement>('button[data-add-repo-action]') ?? []
    )
    if (buttons.length === 0) {
      return
    }
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + delta + buttons.length) % buttons.length
    event.preventDefault()
    buttons[nextIndex]?.focus()
  }

  const handleActionsBlur = (event: React.FocusEvent<HTMLDivElement>): void => {
    if (!(event.relatedTarget instanceof HTMLButtonElement)) {
      setSelectedKind(null)
      return
    }
    if (!event.relatedTarget.matches('button[data-add-repo-action]')) {
      setSelectedKind(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <DialogHeader className="gap-1.5 space-y-0 text-left sm:text-left">
        <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
          {translate('auto.components.sidebar.AddRepoStartSteps.d13757911c', 'Add a project')}
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          {repoCount === 0
            ? translate('auto.components.Landing.cd21242762', 'Add a project to get started.')
            : translate(
                'auto.components.sidebar.AddRepoStartSteps.addAnother',
                'Open another project on this machine or host.'
              )}
        </DialogDescription>
      </DialogHeader>

      {hostSelector}

      <div
        ref={actionsRef}
        className="flex flex-col gap-3"
        onBlur={handleActionsBlur}
        onKeyDown={handleArrowNavigation}
      >
        <AddRepoPathButton
          action={primaryAction}
          variant="primary"
          disabled={isAdding}
          selected={selectedKind === primaryAction.kind}
          buttonRef={browseActionRef}
          onFocus={() => setSelectedKind(primaryAction.kind)}
        />

        <div className="relative my-0.5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {translate('auto.components.sidebar.AddRepoStartSteps.87596c1446', 'Other ways to add')}
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        {secondaryActions.map((action) => (
          <AddRepoPathButton
            key={action.kind}
            action={action}
            variant="secondary"
            disabled={isAdding || Boolean(action.disabled)}
            selected={selectedKind === action.kind}
            onFocus={() => setSelectedKind(action.kind)}
          />
        ))}
      </div>

      {isAdding && addProjectBusyLabel ? (
        <AddRepoNestedScanProgressNotice
          busyLabel={addProjectBusyLabel}
          nestedScanInProgress={nestedScanInProgress}
          nestedScanId={nestedScanId}
          onStopNestedScan={onStopNestedScan}
        />
      ) : null}
    </div>
  )
}

type AddRepoPathButtonProps = {
  action: AddRepoLocalStartAction
  variant: 'primary' | 'secondary'
  disabled: boolean
  selected: boolean
  onFocus: () => void
  buttonRef?: Ref<HTMLButtonElement>
}

function AddRepoEnterChip(): React.JSX.Element {
  return (
    <span aria-hidden="true" className="shrink-0">
      <ShortcutKeyCombo
        keys={['⏎']}
        keyCapClassName={cn(
          'min-w-6 border-border/50 px-1.5 py-0.5 text-[11px] font-medium shadow-none',
          'bg-background/80 text-muted-foreground'
        )}
      />
    </span>
  )
}

function AddRepoPathButton({
  action,
  variant,
  disabled,
  selected,
  onFocus,
  buttonRef
}: AddRepoPathButtonProps): React.JSX.Element {
  const Icon = action.icon as ComponentType<{ className?: string }>
  const isPrimary = variant === 'primary'

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant={isPrimary ? (selected ? 'default' : 'outline') : 'outline'}
      disabled={disabled}
      data-add-repo-action
      onClick={action.onClick}
      onFocus={onFocus}
      className={cn(
        // Why: large hit targets — min ~48px secondary, taller primary with two-line copy.
        'h-auto w-full justify-start gap-3 whitespace-normal px-4 text-left shadow-none',
        isPrimary ? 'min-h-14 py-3.5' : 'min-h-12 py-3',
        !isPrimary && selected && 'border-ring bg-muted/40 ring-1 ring-ring/30',
        isPrimary && !selected && 'bg-background'
      )}
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-md',
          isPrimary ? 'size-9' : 'size-8',
          selected && isPrimary
            ? 'bg-primary-foreground/15 text-primary-foreground'
            : 'bg-muted/50 text-foreground'
        )}
      >
        <Icon className={cn(isPrimary ? 'size-4' : 'size-3.5', 'opacity-90')} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-snug">{action.title}</span>
        {isPrimary || action.description ? (
          <span
            className={cn(
              'mt-0.5 block text-[13px] font-normal leading-snug',
              selected && isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}
          >
            {action.description}
          </span>
        ) : null}
      </span>
      {selected ? <AddRepoEnterChip /> : null}
    </Button>
  )
}
