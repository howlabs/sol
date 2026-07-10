import {
  AzureDevOpsIntegrationCard,
  BitbucketIntegrationCard,
  GiteaIntegrationCard,
  GitHubIntegrationCard,
  GitLabIntegrationCard
} from './source-control-integration-cards'
import { JiraIntegrationCard, LinearIntegrationCard } from './task-tracker-integration-cards'
import { IntegrationCardGroup } from './integration-card-presentation'
import { useIntegrationProviderStatusRefresh } from './use-integration-provider-status-refresh'
import { translate } from '@/i18n/i18n'
export { getIntegrationsPaneSearchEntries } from './integrations-search'

export function IntegrationsPane(): React.JSX.Element {
  useIntegrationProviderStatusRefresh()

  // ponytail: one blurb covers hosts + trackers; card names carry the rest
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {translate(
          'auto.components.settings.IntegrationsPane.blurb',
          'Connect code hosts and issue trackers for PRs, checks, and Tasks.'
        )}
      </p>
      <IntegrationCardGroup>
        <GitHubIntegrationCard />
        <GitLabIntegrationCard />
        <BitbucketIntegrationCard />
        <AzureDevOpsIntegrationCard />
        <GiteaIntegrationCard />
        <LinearIntegrationCard />
        <JiraIntegrationCard />
      </IntegrationCardGroup>
    </div>
  )
}
