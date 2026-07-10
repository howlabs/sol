import { useState } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle, Unlink } from 'lucide-react'
import { JiraConnectDialog } from '@/components/jira-connect-dialog'
import { JiraIcon } from '@/components/icons/JiraIcon'
import { Button } from '@/components/ui/button'
import { useMountedRef } from '@/hooks/useMountedRef'
import { getProviderRuntimeContextKey } from '@/lib/provider-runtime-context'
import { useAppStore } from '@/store'
import { IntegrationCardDetails, IntegrationCardShell } from './integration-card-shell'
import { useIntegrationSubordinateRowClass } from './integration-card-presentation'
import { OpenRemoteServersButton } from './ProviderHostScopeControl'
import { translate } from '@/i18n/i18n'

type VerificationResult = { state: 'ok' | 'error'; error?: string }

export function JiraIntegrationCard(): React.JSX.Element {
  const jiraStatus = useAppStore((s) => s.jiraStatus)
  const jiraStatusChecked = useAppStore((s) => s.jiraStatusChecked)
  const jiraStatusContextKey = useAppStore((s) => s.jiraStatusContextKey)
  const checkJiraConnection = useAppStore((s) => s.checkJiraConnection)
  const disconnectJira = useAppStore((s) => s.disconnectJira)
  const testJiraConnection = useAppStore((s) => s.testJiraConnection)
  const settings = useAppStore((s) => s.settings)
  const mountedRef = useMountedRef()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [testingSiteId, setTestingSiteId] = useState<string | null>(null)
  const [testResultBySite, setTestResultBySite] = useState<Record<string, VerificationResult>>({})

  const contextMatches = jiraStatusContextKey === getProviderRuntimeContextKey(settings)
  const checking = !contextMatches || !jiraStatusChecked
  const connected = contextMatches && jiraStatus.connected
  const sites = jiraStatus.sites ?? []
  const subordinateRowClass = useIntegrationSubordinateRowClass('flex items-center gap-3')

  const handleDisconnect = async (siteId?: string): Promise<void> => {
    await disconnectJira(siteId)
    if (mountedRef.current) {
      setTestResultBySite({})
    }
  }

  const handleTest = async (siteId: string): Promise<void> => {
    setTestingSiteId(siteId)
    setTestResultBySite((prev) => {
      const next = { ...prev }
      delete next[siteId]
      return next
    })
    const result = await testJiraConnection(siteId)
    if (!mountedRef.current) {
      return
    }
    setTestResultBySite((prev) => ({
      ...prev,
      [siteId]: result.ok ? { state: 'ok' } : { state: 'error', error: result.error }
    }))
    setTestingSiteId(null)
  }

  return (
    <IntegrationCardShell
      icon={<JiraIcon className="size-5" />}
      name="Jira"
      checking={checking}
      statusTone={connected ? 'connected' : 'attention'}
      statusLabel={
        connected
          ? translate(
              'auto.components.settings.task.tracker.integration.cards.statusConnected',
              'Connected'
            )
          : translate(
              'auto.components.settings.task.tracker.integration.cards.statusNotConnected',
              'Not connected'
            )
      }
      actions={
        !checking ? (
          <>
            <Button
              variant={connected ? 'outline' : 'default'}
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              {connected
                ? translate(
                    'auto.components.settings.task.tracker.integration.cards.60996beda6',
                    'Add site'
                  )
                : translate(
                    'auto.components.settings.task.tracker.integration.cards.e2ff968276',
                    'Connect Jira'
                  )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void checkJiraConnection()}>
              {translate(
                'auto.components.settings.task.tracker.integration.cards.c90f2ef419',
                'Check again'
              )}
            </Button>
            {connected && sites.length === 0 ? (
              <Button variant="ghost" size="sm" onClick={() => void handleDisconnect()}>
                {translate(
                  'auto.components.settings.task.tracker.integration.cards.disconnect_all',
                  'Disconnect'
                )}
              </Button>
            ) : null}
            <OpenRemoteServersButton />
          </>
        ) : (
          <OpenRemoteServersButton />
        )
      }
    >
      {connected && sites.length > 0 ? (
        <IntegrationCardDetails>
          {sites.map((site) => {
            const testResult = testResultBySite[site.id]
            const testing = testingSiteId === site.id
            return (
              <div key={site.id} className={subordinateRowClass}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{site.displayName}</p>
                </div>
                {testResult?.state === 'ok' ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-status-success">
                    <CheckCircle2 className="size-3.5" />
                    {translate(
                      'auto.components.settings.task.tracker.integration.cards.a2c0015fb8',
                      'Verified'
                    )}
                  </span>
                ) : null}
                {testResult?.state === 'error' ? (
                  <span className="flex min-w-0 max-w-[220px] shrink items-center gap-1 truncate text-xs text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span className="truncate">{testResult.error}</span>
                  </span>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleTest(site.id)}
                  disabled={testing}
                >
                  {testing ? (
                    <>
                      <LoaderCircle className="size-3.5 mr-1.5 animate-spin" />
                      {translate(
                        'auto.components.settings.task.tracker.integration.cards.3e7c10d286',
                        'Testing...'
                      )}
                    </>
                  ) : (
                    translate(
                      'auto.components.settings.task.tracker.integration.cards.c24e56c532',
                      'Test'
                    )
                  )}
                </Button>
                <button
                  onClick={() => void handleDisconnect(site.id)}
                  aria-label={translate(
                    'auto.components.settings.task.tracker.integration.cards.dd3529015d',
                    'Disconnect {{value0}}',
                    { value0: site.displayName }
                  )}
                  className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
                >
                  <Unlink className="size-3.5" />
                </button>
              </div>
            )
          })}
        </IntegrationCardDetails>
      ) : null}

      <JiraConnectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnected={() => setTestResultBySite({})}
        overlayClassName="z-[110]"
        contentClassName="z-[120]"
      />
    </IntegrationCardShell>
  )
}
