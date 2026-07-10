import { Github, Gitlab } from '@/lib/icons'
import type { GlobalSettings, TaskProvider } from '../../../../shared/types'
import {
  TASK_PROVIDERS,
  normalizeVisibleTaskProviders,
  resolveVisibleTaskProvider
} from '../../../../shared/task-providers'
import { cn } from '@/lib/utils'
import { JiraIcon } from '@/components/icons/JiraIcon'
import { LinearIcon } from '@/components/icons/LinearIcon'
import { SearchableSetting } from './SearchableSetting'
import { SettingsSwitch } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'

type TasksPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

type TaskProviderOption = {
  id: TaskProvider
  label: string
  description: string
  Icon: (props: { className?: string }) => React.JSX.Element
}

const TASK_PROVIDER_OPTIONS: readonly TaskProviderOption[] = [
  {
    id: 'github',
    get label() {
      return translate('auto.components.settings.TasksPane.e14063e727', 'GitHub')
    },
    get description() {
      return translate(
        'auto.components.settings.TasksPane.githubDescriptionShort',
        'Issues and pull requests in Tasks and sidebar shortcuts.'
      )
    },
    Icon: ({ className }) => <Github className={className} />
  },
  {
    id: 'gitlab',
    get label() {
      return translate('auto.components.settings.TasksPane.7c5d7fdc20', 'GitLab')
    },
    get description() {
      return translate(
        'auto.components.settings.TasksPane.gitlabDescriptionShort',
        'Issues and merge requests in Tasks and sidebar shortcuts.'
      )
    },
    Icon: ({ className }) => <Gitlab className={className} />
  },
  {
    id: 'linear',
    get label() {
      return translate('auto.components.settings.TasksPane.09ae2d7c51', 'Linear')
    },
    get description() {
      return translate(
        'auto.components.settings.TasksPane.linearDescriptionShort',
        'Linear issues in Tasks and sidebar shortcuts.'
      )
    },
    Icon: ({ className }) => <LinearIcon className={className} />
  },
  {
    id: 'jira',
    get label() {
      return translate('auto.components.settings.TasksPane.6b23a34f6d', 'Jira')
    },
    get description() {
      return translate(
        'auto.components.settings.TasksPane.jiraDescriptionShort',
        'Jira issues in Tasks and sidebar shortcuts.'
      )
    },
    Icon: ({ className }) => <JiraIcon className={className} />
  }
]

/** Pure toggle — keep last visible provider on. */
export function nextVisibleTaskProviders(
  visibleProviders: readonly TaskProvider[],
  provider: TaskProvider
): readonly TaskProvider[] | null {
  const isVisible = visibleProviders.includes(provider)
  if (isVisible && visibleProviders.length === 1) {
    return null
  }
  if (isVisible) {
    return visibleProviders.filter((entry) => entry !== provider)
  }
  return TASK_PROVIDERS.filter((entry) => entry === provider || visibleProviders.includes(entry))
}

/** Settings patch for a provider toggle, including defaultTaskSource recompute. */
export function buildTaskProviderVisibilityUpdate(args: {
  visibleProviders: readonly TaskProvider[]
  provider: TaskProvider
  defaultTaskSource: GlobalSettings['defaultTaskSource']
}): Partial<GlobalSettings> | null {
  const nextProviders = nextVisibleTaskProviders(args.visibleProviders, args.provider)
  if (nextProviders === null) {
    return null
  }
  return {
    visibleTaskProviders: [...nextProviders],
    defaultTaskSource: resolveVisibleTaskProvider(args.defaultTaskSource, nextProviders)
  }
}

/**
 * Task Sources settings — document list of providers. Section chrome lives in
 * Settings; this pane is only the control surface.
 */
export function TasksPane({ settings, updateSettings }: TasksPaneProps): React.JSX.Element {
  const visibleProviders = normalizeVisibleTaskProviders(settings.visibleTaskProviders)

  const toggleProvider = (provider: TaskProvider): void => {
    const update = buildTaskProviderVisibilityUpdate({
      visibleProviders,
      provider,
      defaultTaskSource: settings.defaultTaskSource
    })
    if (update) {
      updateSettings(update)
    }
  }

  return (
    // Why: collection template — provider cards, not form-list space-y-1 rows.
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="max-w-prose text-[11px] leading-snug text-muted-foreground">
        {translate(
          'auto.components.settings.TasksPane.intro',
          'Turn providers on for the Tasks page and sidebar. Keep at least one on.'
        )}
      </p>

      <SearchableSetting
        title={translate('auto.components.settings.TasksPane.f71d8a9dd3', 'Task Providers')}
        description={translate(
          'auto.components.settings.TasksPane.3a72b9745e',
          'Choose which task providers appear in the Tasks page and sidebar shortcuts.'
        )}
        keywords={[
          'tasks',
          'provider',
          'source',
          'github',
          'gitlab',
          'linear',
          'jira',
          'atlassian',
          'display',
          'hide'
        ]}
        className="max-w-none space-y-0 py-0"
      >
        <div className="border-t border-border/50">
          {TASK_PROVIDER_OPTIONS.map((option) => {
            const enabled = visibleProviders.includes(option.id)
            const isLastEnabled = enabled && visibleProviders.length === 1
            const Icon = option.Icon
            const switchId = `task-source-${option.id}`
            const lastHintId = `task-source-${option.id}-last-hint`

            return (
              <div
                key={option.id}
                className={cn(
                  'flex items-center gap-3 border-b border-border/50 py-3.5 last:border-b-0',
                  isLastEnabled && 'opacity-90'
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground [&_svg]:size-4">
                  <Icon />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p id={switchId} className="text-[13px] font-medium leading-none text-foreground">
                    {option.label}
                  </p>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                  {isLastEnabled ? (
                    <p
                      id={lastHintId}
                      className="text-[11px] leading-snug text-muted-foreground/90"
                    >
                      {translate(
                        'auto.components.settings.TasksPane.lastProviderHint',
                        'At least one provider must stay on.'
                      )}
                    </p>
                  ) : null}
                </div>
                <SettingsSwitch
                  checked={enabled}
                  disabled={isLastEnabled}
                  ariaLabelledBy={switchId}
                  ariaDescribedBy={isLastEnabled ? lastHintId : undefined}
                  onChange={() => toggleProvider(option.id)}
                />
              </div>
            )
          })}
        </div>
      </SearchableSetting>
    </div>
  )
}
