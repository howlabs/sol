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
import { SearchableSetting } from './SearchableSetting'
import { SettingsSubsectionHeader } from './SettingsFormControls'
import { getIntegrationsPaneSearchEntries } from './integrations-search'
import { translate } from '@/i18n/i18n'
export { getIntegrationsPaneSearchEntries } from './integrations-search'

function IntegrationSearchWrap(props: {
  title: string
  children: React.ReactNode
}): React.JSX.Element | null {
  const entry = getIntegrationsPaneSearchEntries().find((item) => item.title === props.title)
  return (
    <SearchableSetting
      title={entry?.title ?? props.title}
      description={entry?.description}
      keywords={entry?.keywords}
      className="max-w-none"
    >
      {props.children}
    </SearchableSetting>
  )
}

export function IntegrationsPane(): React.JSX.Element {
  useIntegrationProviderStatusRefresh()

  // Why: section header already states purpose; list is two house groups with
  // per-provider search, matching General/Notifications filtering grammar.
  return (
    <div className="space-y-1">
      <section className="space-y-1.5">
        <SettingsSubsectionHeader
          title={translate('auto.components.settings.IntegrationsPane.codeHosts', 'Code hosts')}
          description={translate(
            'auto.components.settings.IntegrationsPane.codeHostsDescription',
            'CLI or token auth for pull requests and checks.'
          )}
        />
        <IntegrationCardGroup>
          <IntegrationSearchWrap title="GitHub Integration">
            <GitHubIntegrationCard />
          </IntegrationSearchWrap>
          <IntegrationSearchWrap title="GitLab Integration">
            <GitLabIntegrationCard />
          </IntegrationSearchWrap>
          <IntegrationSearchWrap title="Bitbucket Integration">
            <BitbucketIntegrationCard />
          </IntegrationSearchWrap>
          <IntegrationSearchWrap title="Azure DevOps Integration">
            <AzureDevOpsIntegrationCard />
          </IntegrationSearchWrap>
          <IntegrationSearchWrap title="Gitea Integration">
            <GiteaIntegrationCard />
          </IntegrationSearchWrap>
        </IntegrationCardGroup>
      </section>

      {/* Why: hairline section break matches Stats — not a second card frame. */}
      <section className="space-y-1.5 border-t border-border/40 pt-3">
        <SettingsSubsectionHeader
          title={translate(
            'auto.components.settings.IntegrationsPane.issueTrackers',
            'Issue trackers'
          )}
          description={translate(
            'auto.components.settings.IntegrationsPane.issueTrackersDescription',
            'Link work items from Linear and Jira.'
          )}
        />
        <IntegrationCardGroup>
          <IntegrationSearchWrap title="Linear Integration">
            <LinearIntegrationCard />
          </IntegrationSearchWrap>
          <IntegrationSearchWrap title="Jira Integration">
            <JiraIntegrationCard />
          </IntegrationSearchWrap>
        </IntegrationCardGroup>
      </section>
    </div>
  )
}
