import { useState } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle, Unlink } from '@/lib/icons'
import { LinearIcon } from '@/components/icons/LinearIcon'
import { LinearApiKeyDialog } from '@/components/linear-api-key-dialog'
import { Button } from '@/components/ui/button'
import { useMountedRef } from '@/hooks/useMountedRef'
import { getProviderRuntimeContextKey } from '@/lib/provider-runtime-context'
import { useAppStore } from '@/store'
import { IntegrationCardDetails, IntegrationCardShell } from './integration-card-shell'
import { useIntegrationSubordinateRowClass } from './integration-card-presentation'
import { OpenRemoteServersButton } from './ProviderHostScopeControl'
import { translate } from '@/i18n/i18n'

type VerificationResult = { state: 'ok' | 'error'; error?: string }

export function LinearIntegrationCard(): React.JSX.Element {
  const linearStatus = useAppStore((s) => s.linearStatus)
  const linearStatusChecked = useAppStore((s) => s.linearStatusChecked)
  const linearStatusContextKey = useAppStore((s) => s.linearStatusContextKey)
  const disconnectLinearWorkspace = useAppStore((s) => s.disconnectLinearWorkspace)
  const checkLinearConnection = useAppStore((s) => s.checkLinearConnection)
  const testLinearConnection = useAppStore((s) => s.testLinearConnection)
  const settings = useAppStore((s) => s.settings)
  const mountedRef = useMountedRef()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [testingWorkspaceId, setTestingWorkspaceId] = useState<string | null>(null)
  const [testResultByWorkspace, setTestResultByWorkspace] = useState<
    Record<string, VerificationResult>
  >({})

  const contextMatches = linearStatusContextKey === getProviderRuntimeContextKey(settings)
  const checking = !contextMatches || !linearStatusChecked
  const connected = contextMatches && linearStatus.connected
  const workspaces = linearStatus.workspaces ?? []
  const subordinateRowClass = useIntegrationSubordinateRowClass('flex items-center gap-3')

  const handleDisconnect = async (workspaceId: string): Promise<void> => {
    await disconnectLinearWorkspace(workspaceId)
    if (mountedRef.current) {
      setTestResultByWorkspace({})
    }
  }

  // Why: explicit user-triggered verification. This is the only settings path
  // that decrypts a stored Linear key, avoiding surprise keychain prompts.
  const handleTest = async (workspaceId: string): Promise<void> => {
    setTestingWorkspaceId(workspaceId)
    setTestResultByWorkspace((prev) => {
      const next = { ...prev }
      delete next[workspaceId]
      return next
    })
    const result = await testLinearConnection(workspaceId)
    if (!mountedRef.current) {
      return
    }
    setTestResultByWorkspace((prev) => ({
      ...prev,
      [workspaceId]: result.ok ? { state: 'ok' } : { state: 'error', error: result.error }
    }))
    setTestingWorkspaceId(null)
  }

  return (
    <IntegrationCardShell
      icon={<LinearIcon />}
      name="Linear"
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
                    'auto.components.settings.task.tracker.integration.cards.622c224082',
                    'Add workspace'
                  )
                : translate(
                    'auto.components.settings.task.tracker.integration.cards.1a12e33fe5',
                    'Connect Linear'
                  )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void checkLinearConnection(true)}>
              {translate(
                'auto.components.settings.task.tracker.integration.cards.c90f2ef419',
                'Check again'
              )}
            </Button>
            <OpenRemoteServersButton />
          </>
        ) : (
          <OpenRemoteServersButton />
        )
      }
    >
      {connected && workspaces.length > 0 ? (
        <IntegrationCardDetails>
          {workspaces.map((workspace) => {
            const testResult = testResultByWorkspace[workspace.id]
            const testing = testingWorkspaceId === workspace.id
            return (
              <div key={workspace.id} className={subordinateRowClass}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {workspace.organizationName}
                  </p>
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
                  onClick={() => void handleTest(workspace.id)}
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
                  onClick={() => void handleDisconnect(workspace.id)}
                  aria-label={translate(
                    'auto.components.settings.task.tracker.integration.cards.dd3529015d',
                    'Disconnect {{value0}}',
                    { value0: workspace.organizationName }
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

      <LinearApiKeyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        connectLabel="Connect Linear"
        onConnected={() => setTestResultByWorkspace({})}
        overlayClassName="z-[110]"
        contentClassName="z-[120]"
      />
    </IntegrationCardShell>
  )
}

export { JiraIntegrationCard } from './jira-integration-card'
