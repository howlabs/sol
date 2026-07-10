import { ExternalLink, Github, Gitlab } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IntegrationCardShell } from './integration-card-shell'
import { OpenRemoteServersButton } from './ProviderHostScopeControl'
import { usePreflightCardStatuses } from './source-control-preflight-card-status'
import { translate } from '@/i18n/i18n'

function cliStatusLabel(status: string): string {
  if (status === 'connected') {
    return translate(
      'auto.components.settings.cli.source.control.integration.cards.statusConnected',
      'Connected'
    )
  }
  if (status === 'unavailable') {
    return translate(
      'auto.components.settings.cli.source.control.integration.cards.statusUnavailable',
      'Unavailable'
    )
  }
  if (status === 'not-installed') {
    return translate(
      'auto.components.settings.cli.source.control.integration.cards.statusCliMissing',
      'CLI missing'
    )
  }
  return translate(
    'auto.components.settings.cli.source.control.integration.cards.statusSignInRequired',
    'Sign in required'
  )
}

export function GitHubIntegrationCard(): React.JSX.Element {
  const { statuses, unavailable, refresh } = usePreflightCardStatuses('gh')
  const status = unavailable ? 'unavailable' : statuses.ghStatus
  const connected = status === 'connected'

  return (
    <IntegrationCardShell
      icon={<Github className="size-5" />}
      name="GitHub"
      checking={status === 'checking'}
      statusTone={connected ? 'connected' : 'attention'}
      statusLabel={cliStatusLabel(status)}
      actions={
        <>
          {status === 'not-installed' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.api.shell.openUrl('https://cli.github.com')}
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.cli.source.control.integration.cards.7755c28af5',
                'Install GitHub CLI'
              )}
            </Button>
          ) : null}
          {!connected && status === 'not-authenticated' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.api.shell.openUrl('https://cli.github.com/manual/gh_auth_login')
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.cli.source.control.integration.cards.8cbc39f862',
                'Learn more'
              )}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={refresh}>
            {translate(
              'auto.components.settings.cli.source.control.integration.cards.d5b3be8ecd',
              'Check again'
            )}
          </Button>
          <OpenRemoteServersButton />
        </>
      }
    />
  )
}

// GitLab uses the same minimal row pattern as GitHub.
export function GitLabIntegrationCard(): React.JSX.Element {
  const { statuses, unavailable, refresh } = usePreflightCardStatuses('glab')
  const status = unavailable ? 'unavailable' : statuses.glabStatus
  const connected = status === 'connected'

  return (
    <IntegrationCardShell
      icon={<Gitlab className="size-5" />}
      name="GitLab"
      checking={status === 'checking'}
      statusTone={connected ? 'connected' : 'attention'}
      statusLabel={cliStatusLabel(status)}
      actions={
        <>
          {status === 'not-installed' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.api.shell.openUrl('https://gitlab.com/gitlab-org/cli#installation')
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.cli.source.control.integration.cards.54a640af7a',
                'Install GitLab CLI'
              )}
            </Button>
          ) : null}
          {!connected && status === 'not-authenticated' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.api.shell.openUrl(
                  'https://gitlab.com/gitlab-org/cli/-/blob/main/docs/source/auth/login.md'
                )
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" />
              {translate(
                'auto.components.settings.cli.source.control.integration.cards.8cbc39f862',
                'Learn more'
              )}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={refresh}>
            {translate(
              'auto.components.settings.cli.source.control.integration.cards.d5b3be8ecd',
              'Check again'
            )}
          </Button>
          <OpenRemoteServersButton />
        </>
      }
    />
  )
}
