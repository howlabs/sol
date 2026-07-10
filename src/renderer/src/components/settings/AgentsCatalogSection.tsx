import { RefreshCw } from '@/lib/icons'
import type { TuiAgent } from '../../../../shared/types'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
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
  variant: 'installed' | 'available'
  agents: readonly CatalogAgent[]
  buildRowProps: (agent: CatalogAgent, isDetected: boolean) => AgentCatalogRowProps
  detectedCount?: number
  isRefreshing?: boolean
  onRefresh?: () => void
}

export function AgentsCatalogSection({
  variant,
  agents,
  buildRowProps,
  detectedCount,
  isRefreshing,
  onRefresh
}: AgentsCatalogSectionProps): React.JSX.Element {
  const isInstalled = variant === 'installed'
  const isDetected = isInstalled

  return (
    <section className="space-y-1.5">
      <SettingsSubsectionHeader
        title={
          <span className={cn('flex items-center gap-2', !isInstalled && 'text-muted-foreground')}>
            {isInstalled
              ? translate('auto.components.settings.AgentsPane.02e0143be5', 'Installed')
              : translate('auto.components.settings.AgentsPane.e8da2af684', 'Available to install')}
            <SettingsBadge tone={isInstalled ? 'accent' : 'muted'}>
              {detectedCount ?? agents.length}{' '}
              {isInstalled
                ? translate('auto.components.settings.AgentsPane.ed3e110e61', 'detected')
                : translate('auto.components.settings.AgentsPane.024bd95089', 'agents')}
            </SettingsBadge>
          </span>
        }
        action={
          isInstalled && onRefresh ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
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
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                {translate(
                  'auto.components.settings.AgentsPane.13647f9f80',
                  'Re-read your shell PATH and re-detect installed agents'
                )}
              </TooltipContent>
            </Tooltip>
          ) : undefined
        }
      />
      <IntegrationCardGroup>
        {agents.map((agent) => (
          <AgentCatalogRow key={agent.id} {...buildRowProps(agent, isDetected)} />
        ))}
      </IntegrationCardGroup>
    </section>
  )
}
