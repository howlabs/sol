import { ExternalLink, GitPullRequestArrow } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { IntegrationCardShell } from './integration-card-shell'
import { OpenRemoteServersButton } from './ProviderHostScopeControl'
import { usePreflightCardStatuses } from './source-control-preflight-card-status'
import { translate } from '@/i18n/i18n'

function tokenStatusLabel(status: string, options?: { configuredLabel?: string }): string {
  if (status === 'connected') {
    return translate(
      'auto.components.settings.token.source.control.integration.cards.statusConnected',
      'Connected'
    )
  }
  if (status === 'configured') {
    return (
      options?.configuredLabel ??
      translate(
        'auto.components.settings.token.source.control.integration.cards.statusConfigured',
        'Configured'
      )
    )
  }
  if (status === 'unavailable') {
    return translate(
      'auto.components.settings.token.source.control.integration.cards.statusUnavailable',
      'Unavailable'
    )
  }
  if (status === 'not-configured') {
    return translate(
      'auto.components.settings.token.source.control.integration.cards.statusNotConfigured',
      'Not configured'
    )
  }
  if (status === 'optional') {
    return translate(
      'auto.components.settings.token.source.control.integration.cards.statusOptionalSetup',
      'Optional setup'
    )
  }
  return translate(
    'auto.components.settings.token.source.control.integration.cards.statusAuthFailed',
    'Auth failed'
  )
}

export function BitbucketIntegrationCard(): React.JSX.Element {
  const { statuses, unavailable, refresh } = usePreflightCardStatuses('bitbucket')
  const status = unavailable ? 'unavailable' : statuses.bitbucketStatus
  const connected = status === 'connected'

  return (
    <IntegrationCardShell
      icon={<GitPullRequestArrow />}
      name="Bitbucket"
      checking={status === 'checking'}
      statusTone={connected ? 'connected' : 'attention'}
      statusLabel={tokenStatusLabel(status)}
      actions={
        <>
          {!connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.api.shell.openUrl(
                  'https://support.atlassian.com/bitbucket-cloud/docs/using-api-tokens/'
                )
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.token.source.control.integration.cards.1a9475dace',
                'Learn more'
              )}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={refresh}>
            {translate(
              'auto.components.settings.token.source.control.integration.cards.793a06e899',
              'Check again'
            )}
          </Button>
          <OpenRemoteServersButton />
        </>
      }
    />
  )
}

export function AzureDevOpsIntegrationCard(): React.JSX.Element {
  const { statuses, unavailable, refresh } = usePreflightCardStatuses('azureDevOps')
  const status = unavailable ? 'unavailable' : statuses.azureDevOpsStatus
  const configured = status === 'configured'

  return (
    <IntegrationCardShell
      icon={<GitPullRequestArrow />}
      name="Azure DevOps"
      checking={status === 'checking'}
      statusTone={configured ? 'connected' : 'attention'}
      statusLabel={tokenStatusLabel(
        statuses.azureDevOpsAccount && status === 'configured' ? 'connected' : status
      )}
      actions={
        <>
          {!configured ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.api.shell.openUrl(
                  status === 'not-configured'
                    ? 'https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate'
                    : 'https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-requests/get-pull-requests'
                )
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.token.source.control.integration.cards.1a9475dace',
                'Learn more'
              )}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={refresh}>
            {translate(
              'auto.components.settings.token.source.control.integration.cards.793a06e899',
              'Check again'
            )}
          </Button>
          <OpenRemoteServersButton />
        </>
      }
    />
  )
}

export function GiteaIntegrationCard(): React.JSX.Element {
  const { statuses, unavailable, refresh } = usePreflightCardStatuses('gitea')
  const status = unavailable ? 'unavailable' : statuses.giteaStatus
  const configured = status === 'configured'

  return (
    <IntegrationCardShell
      icon={<GitPullRequestArrow />}
      name="Gitea"
      checking={status === 'checking'}
      statusTone={configured ? 'connected' : 'attention'}
      statusLabel={tokenStatusLabel(
        configured
          ? statuses.giteaAccount
            ? 'connected'
            : 'configured'
          : status === 'not-configured'
            ? 'optional'
            : status
      )}
      actions={
        <>
          {!configured ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.api.shell.openUrl('https://docs.gitea.com/next/development/api-usage')
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.token.source.control.integration.cards.1a9475dace',
                'Learn more'
              )}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={refresh}>
            {translate(
              'auto.components.settings.token.source.control.integration.cards.793a06e899',
              'Check again'
            )}
          </Button>
          <OpenRemoteServersButton />
        </>
      }
    />
  )
}
