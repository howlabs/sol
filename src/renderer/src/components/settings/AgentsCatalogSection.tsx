import { RefreshCw } from '@/lib/icons'
import type { TuiAgent } from '../../../../shared/types'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { SettingsSubsectionHeader } from './SettingsFormControls'
import { AgentCatalogRow, type AgentCatalogRowProps } from './AgentCatalogRow'

type CatalogAgent = {
  id: TuiAgent
  label: string
  homepageUrl: string
  cmd: string
}

type AgentsCatalogSectionProps = {
  installed: readonly CatalogAgent[]
  available: readonly CatalogAgent[]
  buildRowProps: (agent: CatalogAgent, isDetected: boolean) => AgentCatalogRowProps
  isRefreshing?: boolean
  onRefresh?: () => void
}

/**
 * Flat document list — enable agents on PATH; installers sit below a quiet divider.
 */
export function AgentsCatalogSection({
  installed,
  available,
  buildRowProps,
  isRefreshing,
  onRefresh
}: AgentsCatalogSectionProps): React.JSX.Element | null {
  if (installed.length === 0 && available.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between gap-3">
        <SettingsSubsectionHeader
          className="min-w-0 flex-1"
          title={translate('auto.components.settings.AgentsPane.catalogTitle', 'On this machine')}
          description={translate(
            'auto.components.settings.AgentsPane.catalogDescriptionShort',
            'Turn agents on or off. Use + to set command, args, or environment.'
          )}
        />
        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-7 shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={cn('size-3.5', isRefreshing && 'animate-spin motion-reduce:animate-none')}
            />
            {isRefreshing
              ? translate('auto.components.settings.AgentsPane.c9b33eb5c0', 'Refreshing…')
              : translate('auto.components.settings.AgentsPane.0d9e293a02', 'Refresh')}
          </Button>
        ) : null}
      </header>

      <div className="border-t border-border/50">
        {installed.map((agent) => (
          <AgentCatalogRow key={agent.id} {...buildRowProps(agent, true)} />
        ))}
      </div>

      {available.length > 0 ? (
        <div className="space-y-0 pt-2">
          <p className="pb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {translate('auto.components.settings.AgentsPane.e8da2af684', 'Available to install')}
          </p>
          <div className="border-t border-border/50">
            {available.map((agent) => (
              <AgentCatalogRow key={agent.id} {...buildRowProps(agent, false)} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
