import { RefreshCw } from '@/lib/icons'
import type { TuiAgent } from '../../../../shared/types'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { SettingsBadge, SettingsSubsectionHeader } from './SettingsFormControls'
import { IntegrationCardGroup } from './integration-card-presentation'
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
 * One Agents list (Integrations-style): installed first, then available-to-install.
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
    <section className="space-y-2">
      <SettingsSubsectionHeader
        title={
          <span className="flex items-center gap-2">
            {translate('auto.components.settings.AgentsPane.catalogTitle', 'Agents')}
            {installed.length > 0 ? (
              <SettingsBadge tone="accent">
                {installed.length}{' '}
                {translate('auto.components.settings.AgentsPane.ed3e110e61', 'detected')}
              </SettingsBadge>
            ) : null}
          </span>
        }
        description={translate(
          'auto.components.settings.AgentsPane.catalogDescription',
          'Enable agents on PATH, install missing ones, and configure launch command, args, or environment.'
        )}
        action={
          onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-7 gap-1.5"
            >
              <RefreshCw
                className={cn(
                  'size-3.5',
                  isRefreshing && 'animate-spin motion-reduce:animate-none'
                )}
              />
              {isRefreshing
                ? translate('auto.components.settings.AgentsPane.c9b33eb5c0', 'Refreshing…')
                : translate('auto.components.settings.AgentsPane.0d9e293a02', 'Refresh')}
            </Button>
          ) : undefined
        }
      />

      {installed.length > 0 ? (
        <IntegrationCardGroup>
          {installed.map((agent) => (
            <AgentCatalogRow key={agent.id} {...buildRowProps(agent, true)} />
          ))}
        </IntegrationCardGroup>
      ) : null}

      {available.length > 0 ? (
        <div className="space-y-1.5">
          <p className="px-0.5 text-[11px] font-medium tracking-tight text-muted-foreground">
            {translate('auto.components.settings.AgentsPane.e8da2af684', 'Available to install')}
          </p>
          <IntegrationCardGroup>
            {available.map((agent) => (
              <AgentCatalogRow key={agent.id} {...buildRowProps(agent, false)} />
            ))}
          </IntegrationCardGroup>
        </div>
      ) : null}
    </section>
  )
}
