import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Loader2, Plus, RefreshCw, ShieldCheck } from '@/lib/icons'
import { AgentIcon } from '@/lib/agent-catalog'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { useAppStore } from '../../store'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import type { GrokAccountStatus } from '../../../../shared/rate-limit-types'
import type { GrokRateLimitAccountsState, GrokDeviceCodeInfo } from '../../../../shared/types'
import {
  ProviderAccountEmptyState,
  ProviderAccountList,
  ProviderSectionHeader
} from './provider-account-list'
import { SearchableSetting } from './SearchableSetting'
import { GrokAccountRow } from './grok-account-row'
const GROK_CLI_DOCS_URL = 'https://docs.x.ai/build/overview'

type GrokAction = 'idle' | 'adding' | 'removing' | 'selecting' | 'reauthenticating'

export function GrokAccountsSection(): React.JSX.Element {
  const refreshGrokRateLimits = useAppStore((s) => s.refreshGrokRateLimits)
  const grokUsage = useAppStore((s) => s.rateLimits.grok)
  const [status, setStatus] = useState<GrokAccountStatus | null>(null)
  const [accountsState, setAccountsState] = useState<GrokRateLimitAccountsState | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [action, setAction] = useState<GrokAction>('idle')
  const [deviceCode, setDeviceCode] = useState<GrokDeviceCodeInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async (): Promise<void> => {
    try {
      const next = await window.api.grokAccounts.getStatus()
      setStatus(next)
    } catch (err) {
      console.error('Failed to load Grok account status:', err)
      setStatus({
        signedIn: false,
        email: null,
        teamId: null,
        tokenFresh: false,
        error: err instanceof Error ? err.message : 'Unable to read Grok sign-in'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAccounts = useCallback(async (): Promise<void> => {
    try {
      const next = await window.api.grokAccounts.list()
      setAccountsState(next)
    } catch (err) {
      console.error('Failed to load Grok accounts:', err)
    }
  }, [])

  // Why: load once on mount. Action handlers reload explicitly after mutations
  // to avoid duplicate fetches when grokUsage.updatedAt changes from background
  // rate-limit polling.
  useEffect(() => {
    void loadStatus()
    void loadAccounts()
  }, [loadStatus, loadAccounts])

  // Why: device-code events arrive mid-login via IPC; show URL+code to the user.
  useEffect(() => {
    const cleanup = window.api.grokAccounts.onDeviceCode((info) => {
      setDeviceCode(info)
    })
    return cleanup
  }, [])

  const handleRefreshUsage = async (): Promise<void> => {
    setRefreshing(true)
    try {
      await refreshGrokRateLimits()
      await loadStatus()
      await loadAccounts()
    } finally {
      setRefreshing(false)
    }
  }

  const handleAddAccount = async (): Promise<void> => {
    setAction('adding')
    setDeviceCode(null)
    setError(null)
    try {
      const next = await window.api.grokAccounts.add()
      setAccountsState(next)
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeviceCode(null)
      setAction('idle')
    }
  }

  const handleRemoveAccount = async (accountId: string): Promise<void> => {
    setAction('removing')
    setError(null)
    try {
      const next = await window.api.grokAccounts.remove({ accountId })
      setAccountsState(next)
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAction('idle')
    }
  }

  const handleSelectAccount = async (accountId: string | null): Promise<void> => {
    setAction('selecting')
    setError(null)
    try {
      const next = await window.api.grokAccounts.select({ accountId })
      setAccountsState(next)
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAction('idle')
    }
  }

  const handleReauthenticate = async (accountId: string): Promise<void> => {
    setAction('reauthenticating')
    setDeviceCode(null)
    setError(null)
    try {
      const next = await window.api.grokAccounts.reauthenticate({
        accountId
      })
      setAccountsState(next)
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeviceCode(null)
      setAction('idle')
    }
  }

  const handleCancelLogin = async (): Promise<void> => {
    await window.api.grokAccounts.cancelPendingLogin()
    setDeviceCode(null)
    setAction('idle')
  }

  const signedIn = status?.signedIn === true
  const tokenFresh = status?.tokenFresh === true
  const accounts = accountsState?.accounts ?? []
  const activeAccountId = accountsState?.activeAccountId ?? null
  const hasManagedAccounts = accounts.length > 0

  return (
    <SearchableSetting
      id="accounts-grok"
      title={translate('auto.components.settings.GrokAccountsSection.a1b2c3d4e5', 'Grok (xAI)')}
      description={translate(
        'auto.components.settings.GrokAccountsSection.f6e5d4c3b2',
        'Manage Grok CLI sign-in accounts. Each account uses an isolated GROK_HOME for credentials.'
      )}
      keywords={['grok', 'xai', 'usage', 'credits', 'oauth', 'account', 'signin', 'login']}
      className="space-y-1.5"
    >
      <ProviderSectionHeader
        icon={<AgentIcon agent="grok" size={14} />}
        title={translate('auto.components.settings.GrokAccountsSection.a1b2c3d4e5', 'Grok')}
        description={translate(
          'auto.components.settings.GrokAccountsSection.f6e5d4c3b2',
          'Manage Grok CLI sign-in accounts. Each account uses an isolated GROK_HOME for credentials.'
        )}
        action={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              asChild
              className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <a href={GROK_CLI_DOCS_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3" />
                {translate('auto.components.settings.GrokAccountsSection.0d8e77bc40', 'Docs')}
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAddAccount()}
              disabled={action !== 'idle'}
              className="gap-1.5"
            >
              {action === 'adding' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              {translate('auto.components.settings.GrokAccountsSection.addBtn', 'Add')}
            </Button>
            {action === 'adding' ? (
              <Button variant="ghost" size="sm" onClick={() => void handleCancelLogin()}>
                {translate('auto.components.settings.GrokAccountsSection.cancelBtn', 'Cancel')}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleRefreshUsage()}
              disabled={refreshing || action !== 'idle'}
              className="gap-1.5"
            >
              {refreshing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {translate('auto.components.settings.GrokAccountsSection.3325d996cb', 'Refresh')}
            </Button>
          </div>
        }
      />

      {deviceCode ? (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
          <p className="text-xs font-medium">
            {translate(
              'auto.components.settings.GrokAccountsSection.deviceCodeTitle',
              'Complete sign-in in your browser'
            )}
          </p>
          <a
            href={deviceCode.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {deviceCode.url}
            <ExternalLink className="size-3" />
          </a>
          <p className="text-xs text-muted-foreground">
            {translate(
              'auto.components.settings.GrokAccountsSection.deviceCodeLabel',
              'Enter this code: '
            )}
            <code className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold">
              {deviceCode.userCode}
            </code>
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <ProviderAccountList>
        {hasManagedAccounts ? (
          accounts.map((account) => (
            <GrokAccountRow
              key={account.id}
              account={account}
              active={account.id === activeAccountId}
              disabled={action !== 'idle'}
              onSelect={() => void handleSelectAccount(account.id)}
              onRemove={() => void handleRemoveAccount(account.id)}
              onReauthenticate={() => void handleReauthenticate(account.id)}
            />
          ))
        ) : (
          <ProviderAccountEmptyState>
            <div className="flex items-start gap-3">
              <ShieldCheck
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  signedIn && tokenFresh ? 'text-foreground' : 'text-muted-foreground'
                )}
              />
              <div className="min-w-0 flex-1 space-y-1">
                {loading ? (
                  <p className="text-xs text-muted-foreground">
                    {translate(
                      'auto.components.settings.GrokAccountsSection.ad47a33f72',
                      'Loading…'
                    )}
                  </p>
                ) : signedIn ? (
                  <>
                    <p className="truncate text-xs font-medium">
                      {status?.email ??
                        translate(
                          'auto.components.settings.GrokAccountsSection.b2c3d4e5f6',
                          'Signed in'
                        )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tokenFresh
                        ? translate(
                            'auto.components.settings.GrokAccountsSection.c3d4e5f6a7',
                            'Signed in via default ~/.grok. Add an account above to manage multiple sign-ins.'
                          )
                        : translate(
                            'auto.components.settings.GrokAccountsSection.d4e5f6a7b8',
                            'Session expired — run grok login in a terminal to refresh.'
                          )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium">
                      {translate(
                        'auto.components.settings.GrokAccountsSection.e5f6a7b8c9',
                        'Not signed in to Grok CLI'
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {translate(
                        'auto.components.settings.GrokAccountsSection.f6a7b8c9d0',
                        'Click "Add" to sign in via device code, or run grok login in a terminal.'
                      )}
                    </p>
                  </>
                )}
                {status?.error ? <p className="text-xs text-destructive">{status.error}</p> : null}
              </div>
            </div>
          </ProviderAccountEmptyState>
        )}
      </ProviderAccountList>

      {grokUsage?.weekly ? (
        <SearchableSetting
          title={translate(
            'auto.components.settings.GrokAccountsSection.a8f3e2c1b4',
            'Weekly credits'
          )}
          description={translate(
            'auto.components.settings.GrokAccountsSection.b7e2d9f0a3',
            'Same weekly credit % as the grok /usage screen in the terminal.'
          )}
          keywords={['grok', 'xai', 'usage', 'credits', 'oauth']}
        >
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="tabular-nums">
              {Math.round(grokUsage.weekly.usedPercent)}%
            </Badge>
            {grokUsage.weekly.resetDescription ? (
              <span className="text-muted-foreground">
                {translate(
                  'auto.components.settings.GrokAccountsSection.c6d1a8f4e2',
                  'Resets {{when}}',
                  { when: grokUsage.weekly.resetDescription }
                )}
              </span>
            ) : null}
            {grokUsage.usageMetadata?.authProvenance ? (
              <span className="truncate text-muted-foreground">
                {grokUsage.usageMetadata.authProvenance}
              </span>
            ) : null}
          </div>
        </SearchableSetting>
      ) : null}
    </SearchableSetting>
  )
}
