import { useEffect, useRef, useState, type ComponentType, type ReactNode, type Ref } from 'react'
import { CircleStop, Loader2 } from '@/lib/icons'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShortcutKeyCombo } from '@/components/ShortcutKeyCombo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getAddRepoLocalStartActions } from './add-repo-local-start-actions'
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
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
      <Loader2 className="size-3.5 shrink-0 animate-spin" />
      <span className="min-w-0 flex-1">{busyLabel}</span>
      {nestedScanInProgress && nestedScanId ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="group text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive focus-visible:ring-destructive/40"
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
              <Loader2 className="size-3.5 animate-spin text-annotation-highlight group-hover:hidden group-focus-visible:hidden" />
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
 * Start step aligned with Landing empty-state: one primary path, quiet
 * alternate methods, document rows (no nested marketing cards).
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

  // Why: ⏎ chip follows keyboard focus so Enter always activates the highlighted action.
  const [selectedKind, setSelectedKind] = useState<string | null>(primaryAction.kind)

  useEffect(() => {
    if (isAdding) {
      setSelectedKind(null)
      return
    }
    if (!isAdding) {
      browseActionRef.current?.focus()
    }
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
    <>
      <DialogHeader className="gap-1.5 space-y-0 text-left">
        <DialogTitle className="text-[1.05rem] font-semibold tracking-tight">
          {translate('auto.components.sidebar.AddRepoStartSteps.d13757911c', 'Add a project')}
        </DialogTitle>
        {repoCount === 0 ? (
          <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
            {/* Why: same line as Landing empty-state so the modal feels like a continuation. */}
            {translate('auto.components.Landing.cd21242762', 'Add a project to get started.')}
          </DialogDescription>
        ) : null}
      </DialogHeader>

      <div
        className="space-y-5 pt-1"
        ref={actionsRef}
        onBlur={handleActionsBlur}
        onKeyDown={handleArrowNavigation}
      >
        {hostSelector ? <div className="space-y-1.5">{hostSelector}</div> : null}

        <div className="space-y-2">
          <AddRepoPrimaryStartAction
            icon={primaryAction.icon}
            title={primaryAction.title}
            description={primaryAction.description}
            disabled={isAdding}
            selected={selectedKind === primaryAction.kind}
            buttonRef={browseActionRef}
            onClick={primaryAction.onClick}
            onFocus={() => setSelectedKind(primaryAction.kind)}
          />

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {translate(
                'auto.components.sidebar.AddRepoStartSteps.87596c1446',
                'Other ways to add'
              )}
            </p>
            <div className="border-t border-border/50">
              {secondaryActions.map((action) => (
                <AddRepoSecondaryStartAction
                  key={action.kind}
                  icon={action.icon}
                  title={action.title}
                  description={action.description}
                  disabled={isAdding || Boolean(action.disabled)}
                  selected={selectedKind === action.kind}
                  onClick={action.onClick}
                  onFocus={() => setSelectedKind(action.kind)}
                />
              ))}
            </div>
          </div>
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
    </>
  )
}

type AddRepoStartActionProps = {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  disabled: boolean
  selected: boolean
  onClick: () => void
  onFocus: () => void
  buttonRef?: Ref<HTMLButtonElement>
}

const AddRepoEnterChip = (): React.JSX.Element => (
  <span aria-hidden="true" className="shrink-0">
    <ShortcutKeyCombo
      keys={['⏎']}
      keyCapClassName="min-w-6 border-border/60 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-none"
    />
  </span>
)

const AddRepoPrimaryStartAction = ({
  icon: Icon,
  title,
  description,
  disabled,
  selected,
  onClick,
  onFocus,
  buttonRef
}: AddRepoStartActionProps): React.JSX.Element => (
  // Why: primary path mirrors Landing Add Project — solid CTA, ⏎ only when focused.
  <Button
    ref={buttonRef}
    type="button"
    variant={selected ? 'default' : 'outline'}
    onClick={onClick}
    onFocus={onFocus}
    disabled={disabled}
    data-add-repo-action
    className={cn(
      'h-auto min-h-12 w-full justify-start gap-3 whitespace-normal px-3 py-3 text-left',
      selected
        ? 'border-transparent focus-visible:ring-2 focus-visible:ring-ring/30'
        : 'shadow-none'
    )}
  >
    <span
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-md',
        selected
          ? 'bg-primary-foreground/15 text-primary-foreground'
          : 'bg-muted/50 text-foreground'
      )}
    >
      <Icon className="size-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-medium leading-5">{title}</span>
      <span
        className={cn(
          'mt-0.5 block text-[12px] font-normal leading-relaxed',
          selected ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}
      >
        {description}
      </span>
    </span>
    {selected ? <AddRepoEnterChip /> : null}
  </Button>
)

function AddRepoSecondaryStartAction({
  icon: Icon,
  title,
  description,
  disabled,
  selected,
  onClick,
  onFocus
}: AddRepoStartActionProps): React.JSX.Element {
  return (
    <button
      type="button"
      data-add-repo-action
      disabled={disabled}
      onClick={onClick}
      onFocus={onFocus}
      className={cn(
        'flex min-h-12 w-full items-center gap-3 border-b border-border/50 px-0.5 py-3 text-left transition-colors last:border-b-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40',
        'disabled:pointer-events-none disabled:cursor-default disabled:opacity-40',
        selected ? 'bg-muted/50 text-foreground' : 'hover:bg-muted/30'
      )}
    >
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-md',
          selected ? 'bg-muted text-foreground' : 'bg-muted/40 text-muted-foreground'
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium leading-5 text-foreground">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      {selected ? <AddRepoEnterChip /> : null}
    </button>
  )
}
