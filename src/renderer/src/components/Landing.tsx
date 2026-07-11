import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ExternalLink, FolderPlus, GitBranchPlus, X } from '@/lib/icons'
import { useAppStore } from '../store'
import { isGitRepoKind } from '../../../shared/repo-kind'
import type { Repo } from '../../../shared/types'
import {
  dismissPreflightIssue,
  githubProjectKeys,
  isPreflightIssueDismissed
} from './landing-preflight-dismissal'
import { ShortcutKeyCombo } from './ShortcutKeyCombo'
import { useShortcutKeyDetails, type ShortcutKeyComboDetails } from '@/hooks/useShortcutLabel'
import { Button } from './ui/button'
import logo from '../../../../resources/logo.svg'
import { translate } from '@/i18n/i18n'
import {
  getLandingPreflightIssues,
  hasGitHubBackedProject,
  type PreflightIssue
} from './landing-preflight-issues'
import { cn } from '@/lib/utils'

type ShortcutItem = {
  id: string
  shortcut: ShortcutKeyComboDetails
  action: string
}

function PreflightBanner({
  issues,
  repos
}: {
  issues: PreflightIssue[]
  repos: Repo[]
}): React.JSX.Element | null {
  // Why: keying the seed on the current GitHub project set means adding a new
  // GitHub project (which changes the key) re-evaluates dismissals, so a lapsed
  // dismissal re-surfaces the nudge without a manual reset.
  const githubKey = githubProjectKeys(repos).join('|')
  const [dismissed, setDismissed] = useState<Set<string>>(
    () =>
      new Set(
        issues
          .filter((issue) => issue.dismissible && isPreflightIssueDismissed(issue.id, repos))
          .map((issue) => issue.id)
      )
  )

  useEffect(() => {
    setDismissed(
      new Set(
        issues
          .filter((issue) => issue.dismissible && isPreflightIssueDismissed(issue.id, repos))
          .map((issue) => issue.id)
      )
    )
    // Why: re-seed only when the GitHub project set changes; issues identity is
    // stable per render and would otherwise reset transient dismiss state.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [githubKey])

  const visibleIssues = issues.filter((issue) => !dismissed.has(issue.id))
  if (visibleIssues.length === 0) {
    return null
  }

  const dismiss = (issue: PreflightIssue): void => {
    dismissPreflightIssue(issue.id, repos)
    setDismissed((prev) => new Set(prev).add(issue.id))
  }

  return (
    // Why: soft setup nudges — muted surface + hairline, not amber marketing cards.
    <div className="w-full space-y-0 divide-y divide-border/50 rounded-lg border border-border/60 bg-muted/30 text-left">
      {visibleIssues.map((issue) => (
        <div key={issue.id} className="flex items-start gap-3 px-3.5 py-3">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[13px] font-medium leading-snug text-foreground">{issue.title}</p>
            <p className="text-[12px] leading-relaxed text-muted-foreground">{issue.description}</p>
            <button
              type="button"
              className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-foreground underline-offset-4 hover:underline cursor-pointer"
              onClick={() => window.api.shell.openUrl(issue.fixUrl)}
            >
              {issue.fixLabel}
              <ExternalLink className="size-3" />
            </button>
          </div>
          {issue.dismissible ? (
            <button
              type="button"
              className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
              onClick={() => dismiss(issue)}
              aria-label={translate('auto.components.Landing.preflightDismiss', 'Dismiss')}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function LandingShortcuts({ items }: { items: readonly ShortcutItem[] }): React.JSX.Element {
  return (
    <div className="w-full border-t border-border/50 pt-6">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {translate('auto.components.Landing.shortcutsLabel', 'Shortcuts')}
      </p>
      <ul className="space-y-2.5">
        {items.map((shortcut) => (
          <li
            key={shortcut.id}
            className="grid grid-cols-[1fr_auto] items-center gap-4 text-[13px]"
          >
            <span className="text-muted-foreground">{shortcut.action}</span>
            <ShortcutKeyCombo
              keys={shortcut.shortcut.keys}
              doubleTap={shortcut.shortcut.doubleTap}
              separatorClassName="mx-0.5 text-[10px] text-muted-foreground/80"
              keyCapClassName="min-w-6 border-border/60 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium shadow-none"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Landing(): React.JSX.Element {
  const repos = useAppStore((s) => s.repos)
  const openModal = useAppStore((s) => s.openModal)

  const createTargetLabel =
    repos.length > 0 && repos.every((repo) => isGitRepoKind(repo)) ? 'Worktree' : 'Workspace'
  const canCreateWorktree = repos.length > 0
  const hasGitHubProject = useMemo(() => hasGitHubBackedProject(repos), [repos])

  const [preflightIssues, setPreflightIssues] = useState<PreflightIssue[]>([])

  useEffect(() => {
    let cancelled = false
    const refreshPreflight = (force = false): void => {
      void window.api.preflight.check(force ? { force: true } : undefined).then((status) => {
        if (cancelled) {
          return
        }
        setPreflightIssues(
          getLandingPreflightIssues(status, { hasGitHubBackedProject: hasGitHubProject })
        )
      })
    }

    // oxlint-disable-next-line react-doctor/no-initialize-state -- Why: preflight status is read from an external IPC probe on mount and focus.
    refreshPreflight()

    // Why: users often install/authenticate gh outside Sol. Re-check when the
    // window becomes active again so the landing warning clears without relaunch.
    const handleWindowActive = (): void => {
      if (document.visibilityState === 'visible') {
        refreshPreflight(true)
      }
    }

    document.addEventListener('visibilitychange', handleWindowActive)
    window.addEventListener('focus', handleWindowActive)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleWindowActive)
      window.removeEventListener('focus', handleWindowActive)
    }
  }, [hasGitHubProject])

  useEffect(() => {
    if (preflightIssues.length === 0) {
      return
    }

    let cancelled = false
    // Why: some users complete `gh auth login` without ever leaving the Sol
    // window. Poll only while a warning is visible so the banner self-clears.
    const intervalId = window.setInterval(() => {
      void window.api.preflight.check({ force: true }).then((status) => {
        if (cancelled) {
          return
        }
        setPreflightIssues(
          getLandingPreflightIssues(status, { hasGitHubBackedProject: hasGitHubProject })
        )
      })
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [hasGitHubProject, preflightIssues.length])

  const createWorktreeShortcut = useShortcutKeyDetails('workspace.create')
  const previousWorktreeShortcut = useShortcutKeyDetails('worktree.navigateUp')
  const nextWorktreeShortcut = useShortcutKeyDetails('worktree.navigateDown')
  const shortcuts = useMemo<ShortcutItem[]>(() => {
    return [
      {
        id: 'create',
        shortcut: createWorktreeShortcut,
        action: `Create ${createTargetLabel.toLowerCase()}`
      },
      { id: 'up', shortcut: previousWorktreeShortcut, action: 'Move up workspace' },
      { id: 'down', shortcut: nextWorktreeShortcut, action: 'Move down workspace' }
    ]
  }, [createTargetLabel, createWorktreeShortcut, nextWorktreeShortcut, previousWorktreeShortcut])

  const createLabel = `${translate('auto.components.Landing.76a95f7f47', 'Create')} ${createTargetLabel.toLowerCase()}`

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      {/* Why: empty canvas should read as a quiet document, not a marketing hero. */}
      <div className="w-full max-w-sm px-6">
        <div className="flex flex-col items-center gap-8 py-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className={cn(
                'flex size-16 items-center justify-center rounded-xl',
                // Why: mark asset is white-fill; tile uses foreground so contrast
                // holds in light/dark without a hard-coded hex plate.
                'bg-foreground'
              )}
            >
              <img
                src={logo}
                alt={translate('auto.components.Landing.520304a067', 'Sol logo')}
                className="size-9 dark:invert"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-foreground">
                {translate('auto.components.Landing.6ca6ff404e', 'ORCA')}
              </h1>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {canCreateWorktree
                  ? translate(
                      'auto.components.Landing.9c00bd4adf',
                      'Select a workspace from the sidebar to begin.'
                    )
                  : translate(
                      'auto.components.Landing.cd21242762',
                      'Add a project to get started.'
                    )}
              </p>
            </div>
          </div>

          {preflightIssues.length > 0 ? (
            <PreflightBanner issues={preflightIssues} repos={repos} />
          ) : null}

          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              variant="default"
              size="lg"
              className="h-9 w-full gap-1.5 text-[13px]"
              onClick={() => openModal('add-repo')}
            >
              <FolderPlus className="size-3.5" />
              {translate('auto.components.Landing.f9eaa9e12d', 'Add Project')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-9 w-full gap-1.5 text-[13px]"
              disabled={!canCreateWorktree}
              title={
                !canCreateWorktree
                  ? translate('auto.components.Landing.f05d237049', 'Add a project first')
                  : undefined
              }
              onClick={() => openModal('new-workspace-composer', { telemetrySource: 'unknown' })}
            >
              <GitBranchPlus className="size-3.5" />
              {createLabel}
            </Button>
          </div>

          <LandingShortcuts items={shortcuts} />
        </div>
      </div>
    </div>
  )
}
