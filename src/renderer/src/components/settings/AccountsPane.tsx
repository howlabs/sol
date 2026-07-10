/* eslint-disable max-lines -- Why: AccountsPane owns all per-provider account UI
   (Claude, Codex, Gemini, OpenCode Go, and future providers). Each provider's
   add/select/reauth/remove flow is tightly coupled to the provider-specific
   error handling and restart prompts below; splitting them into separate files
   would scatter those flows without a meaningful abstraction boundary. */
import { useEffect, useRef, useState } from 'react'
import type {
  ClaudeRateLimitAccountsState,
  CodexRateLimitAccountsState,
  GlobalSettings
} from '../../../../shared/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ExternalLink, HelpCircle, Loader2, Plus, RefreshCw, Trash2 } from '@/lib/icons'
import { useAppStore } from '../../store'
import {
  ClaudeIcon,
  GeminiIcon,
  MiniMaxIcon,
  OpenAIIcon,
  OpenCodeGoIcon
} from '../status-bar/icons'
import { toast } from 'sonner'
import {
  getAccountsClaudeSearchEntries,
  getAccountsCodexSearchEntries,
  getAccountsGeminiSearchEntries,
  getAccountsLocationSearchEntries,
  getAccountsMiniMaxSearchEntries,
  getAccountsOpencodeSearchEntries,
  getAccountsPaneSearchEntries
} from './accounts-search'
import { SearchableSetting } from './SearchableSetting'
import { SettingsRow, SettingsSegmentedControl, SettingsSwitch } from './SettingsFormControls'
import { matchesSettingsSearch } from './settings-search'
import { markLiveCodexSessionsForRestart } from '@/lib/codex-session-restart'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { getCodexAccountAuthWarning } from './codex-account-auth-warning'
import {
  ProviderAccountList,
  ProviderAccountRow,
  ProviderAccountStatusBadge,
  ProviderSectionHeader
} from './provider-account-list'
import { translate } from '@/i18n/i18n'

export { getAccountsPaneSearchEntries }

const EMPTY_WSL_DISTROS: string[] = []
const MINIMAX_CONSOLE_URL = 'https://platform.minimax.io/console/usage'

function MiniMaxCookieHelpPopover(): React.JSX.Element {
  const steps = [
    translate(
      'auto.components.settings.AccountsPane.f5d8d2a6a1',
      'Open platform.minimax.io/console/usage in your browser and sign in.'
    ),
    translate('auto.components.settings.AccountsPane.24560fe830', 'Open DevTools.'),
    translate(
      'auto.components.settings.AccountsPane.4cab0fa42d',
      'Go to the Network tab and enable Preserve log.'
    ),
    translate('auto.components.settings.AccountsPane.bee4e63e1c', 'Reload the page.'),
    translate(
      'auto.components.settings.AccountsPane.87f814af6f',
      'Filter for remains and select the coding_plan/remains request.'
    ),
    translate(
      'auto.components.settings.AccountsPane.435df0ee51',
      'Under Request Headers, copy the Cookie value.'
    ),
    translate('auto.components.settings.AccountsPane.7492fb3bba', 'Paste it here and click Save.')
  ]
  return (
    <div className="space-y-3 p-3 text-xs">
      <div className="space-y-1">
        <p className="font-medium">
          {translate('auto.components.settings.AccountsPane.9fec52de4b', 'How to copy the cookie')}
        </p>
        <p className="text-muted-foreground">
          {translate(
            'auto.components.settings.AccountsPane.4e32e030b2',
            'Stored locally. Orca sends it only to platform.minimax.io for usage refreshes.'
          )}
        </p>
      </div>
      <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}

type AccountsPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  wslSupportedPlatform?: boolean
  wslAvailable?: boolean
  wslDistros?: string[]
  wslCapabilitiesLoading?: boolean
}

function getHostRuntimeLabel(): string {
  return navigator.userAgent.includes('Windows')
    ? 'Windows'
    : translate('auto.components.settings.AccountsPane.9baf45d071', 'This device')
}

function getCodexAccountLabel(
  state: CodexRateLimitAccountsState,
  accountId: string | null | undefined
): string {
  if (accountId == null) {
    return 'System default'
  }
  return state.accounts.find((account) => account.id === accountId)?.email ?? 'Codex account'
}

function getActiveCodexAccountIdForRuntime(
  state: CodexRateLimitAccountsState,
  runtime: LocalAccountRuntime
): string | null {
  if (runtime.runtime === 'host') {
    return state.activeAccountIdsByRuntime?.host ?? state.activeAccountId
  }
  if (runtime.wslDistro) {
    return state.activeAccountIdsByRuntime?.wsl?.[runtime.wslDistro] ?? null
  }
  const defaultSelection = state.activeAccountIdsByRuntime?.wsl?.__default__
  if (defaultSelection) {
    return defaultSelection
  }
  const selectedIds = Array.from(
    new Set(Object.values(state.activeAccountIdsByRuntime?.wsl ?? {}).filter(Boolean))
  )
  return selectedIds.length === 1 ? selectedIds[0] : null
}

function getActiveClaudeAccountIdForRuntime(
  state: ClaudeRateLimitAccountsState,
  runtime: LocalAccountRuntime
): string | null {
  if (runtime.runtime === 'host') {
    return state.activeAccountIdsByRuntime?.host ?? state.activeAccountId
  }
  if (runtime.wslDistro) {
    return state.activeAccountIdsByRuntime?.wsl?.[runtime.wslDistro] ?? null
  }
  const defaultSelection = state.activeAccountIdsByRuntime?.wsl?.__default__
  if (defaultSelection) {
    return defaultSelection
  }
  const selectedIds = Array.from(
    new Set(Object.values(state.activeAccountIdsByRuntime?.wsl ?? {}).filter(Boolean))
  )
  return selectedIds.length === 1 ? selectedIds[0] : null
}

function getClaudeAccountLabel(
  state: ClaudeRateLimitAccountsState,
  accountId: string | null | undefined
): string {
  if (accountId == null) {
    return 'System default'
  }
  return state.accounts.find((account) => account.id === accountId)?.email ?? 'Claude account'
}

function getCodexAccountErrorDescription(error: unknown): string {
  const message = String((error as Error)?.message ?? error)
    .replace(/^Error occurred in handler for 'codexAccounts:[^']+':\s*/i, '')
    .replace(/^Error invoking remote method 'codexAccounts:[^']+':\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim()
  const normalizedMessage = message.toLowerCase()

  // Why: Codex account actions cross the Electron IPC boundary, and invoke()
  // failures often include transport-level wrapper text that is useful in
  // devtools but noisy in product UI. Normalize the handful of expected auth
  // failures here so users see actionable sign-in guidance instead of IPC
  // internals or raw upstream wording.
  if (normalizedMessage.includes('timed out waiting for codex login to finish')) {
    return 'Codex sign-in took too long to finish. Please try again.'
  }
  if (normalizedMessage.includes('codex sign-in took too long to finish')) {
    return 'Codex sign-in took too long to finish. Please try again.'
  }
  if (
    normalizedMessage.includes('auth error 502') ||
    normalizedMessage.includes('gateway') ||
    normalizedMessage.includes('bad gateway')
  ) {
    return 'Codex sign-in is temporarily unavailable. Please try again in a minute.'
  }
  if (normalizedMessage.startsWith('codex login failed:')) {
    const loginMessage = message.slice('Codex login failed:'.length).trim()
    return loginMessage || 'Codex sign-in failed. Please try again.'
  }

  return message || 'Codex sign-in failed. Please try again.'
}

function getClaudeAccountErrorDescription(error: unknown): string {
  return (
    String((error as Error)?.message ?? error)
      .replace(/^Error occurred in handler for 'claudeAccounts:[^']+':\s*/i, '')
      .replace(/^Error invoking remote method 'claudeAccounts:[^']+':\s*/i, '')
      .replace(/^Error:\s*/i, '')
      .trim() || 'Claude sign-in failed. Please try again.'
  )
}

function isClaudeAccountCancellation(error: unknown): boolean {
  return getClaudeAccountErrorDescription(error).toLowerCase() === 'claude sign-in was cancelled.'
}

type LocalAccountRuntime = {
  runtime: 'host' | 'wsl'
  wslDistro?: string | null
  label: string
}

function accountMatchesRuntime(
  account:
    | CodexRateLimitAccountsState['accounts'][number]
    | ClaudeRateLimitAccountsState['accounts'][number],
  runtime: LocalAccountRuntime
): boolean {
  const accountRuntime =
    'authMethod' in account
      ? (account.managedAuthRuntime ?? 'host')
      : (account.managedHomeRuntime ?? 'host')
  const accountDistro = account.wslDistro ?? null
  if (runtime.runtime === 'host') {
    return accountRuntime !== 'wsl'
  }
  if (accountRuntime !== 'wsl') {
    return false
  }
  return runtime.wslDistro ? accountDistro === runtime.wslDistro : true
}

function getSelectedAccountRuntime(
  settings: GlobalSettings,
  wslSupportedPlatform: boolean,
  wslAvailable: boolean,
  wslDistros: string[],
  wslCapabilitiesLoading: boolean
): LocalAccountRuntime {
  if (wslSupportedPlatform && settings.localAccountRuntime === 'wsl') {
    if (!wslAvailable && !wslCapabilitiesLoading) {
      return {
        runtime: 'wsl',
        label: translate('auto.components.settings.AccountsPane.8619f9afa9', 'WSL')
      }
    }
    const configuredDistro = settings.localAccountWslDistro?.trim() || null
    const selectedDistro =
      configuredDistro && (wslCapabilitiesLoading || wslDistros.includes(configuredDistro))
        ? configuredDistro
        : null
    return {
      runtime: 'wsl',
      wslDistro: selectedDistro,
      label: selectedDistro
        ? `WSL ${selectedDistro}`
        : translate('auto.components.settings.AccountsPane.2358ac71d2', 'WSL default')
    }
  }
  return { runtime: 'host', label: getHostRuntimeLabel() }
}

export function AccountsPane({
  settings,
  updateSettings,
  wslSupportedPlatform = false,
  wslAvailable = false,
  wslDistros = EMPTY_WSL_DISTROS,
  wslCapabilitiesLoading = false
}: AccountsPaneProps): React.JSX.Element {
  const searchQuery = useAppStore((s) => s.settingsSearchQuery)
  const codexRateLimits = useAppStore((s) => s.rateLimits.codex)
  const codexRateLimitTarget = useAppStore((s) => s.rateLimits.codexTarget)
  const recordFeatureInteraction = useAppStore((s) => s.recordFeatureInteraction)
  const fetchSettings = useAppStore((s) => s.fetchSettings)
  const recordedOpenCodeSettingEditsRef = useRef<Set<'cookie' | 'workspaceId'>>(new Set())
  const [miniMaxCookieDraft, setMiniMaxCookieDraft] = useState('')
  const [miniMaxGroupDraft, setMiniMaxGroupDraft] = useState('')
  const [miniMaxModelsDraft, setMiniMaxModelsDraft] = useState('')
  const [miniMaxConfigured, setMiniMaxConfigured] = useState(false)
  const [miniMaxCredentialBusy, setMiniMaxCredentialBusy] = useState(false)
  const [openCodeDialogOpen, setOpenCodeDialogOpen] = useState(false)
  const [miniMaxDialogOpen, setMiniMaxDialogOpen] = useState(false)
  const [openCodeCookieDraft, setOpenCodeCookieDraft] = useState('')
  const [openCodeWorkspaceDraft, setOpenCodeWorkspaceDraft] = useState('')
  const accountRuntime = getSelectedAccountRuntime(
    settings,
    wslSupportedPlatform,
    wslAvailable,
    wslDistros,
    wslCapabilitiesLoading
  )
  // Why: host runtime labels are standalone UI labels; interpolated prose needs sentence casing.
  const accountRuntimeSentenceLabel =
    accountRuntime.runtime === 'host' && !navigator.userAgent.includes('Windows')
      ? `${accountRuntime.label.charAt(0).toLocaleLowerCase()}${accountRuntime.label.slice(1)}`
      : accountRuntime.label

  const [codexAccounts, setCodexAccounts] = useState<CodexRateLimitAccountsState>({
    accounts: [],
    activeAccountId: null,
    activeAccountIdsByRuntime: { host: null, wsl: {} }
  })
  const [codexAccountsLoaded, setCodexAccountsLoaded] = useState(false)
  const [codexAction, setCodexAction] = useState<
    'idle' | 'adding' | `reauth:${string}` | `remove:${string}` | `select:${string | 'system'}`
  >('idle')
  const [claudeAccounts, setClaudeAccounts] = useState<ClaudeRateLimitAccountsState>({
    accounts: [],
    activeAccountId: null,
    activeAccountIdsByRuntime: { host: null, wsl: {} }
  })
  const [claudeAction, setClaudeAction] = useState<
    'idle' | 'adding' | `reauth:${string}` | `remove:${string}` | `select:${string | 'system'}`
  >('idle')
  const [removeAccountId, setRemoveAccountId] = useState<string | null>(null)
  const [removeClaudeAccountId, setRemoveClaudeAccountId] = useState<string | null>(null)
  const visibleClaudeAccounts = claudeAccounts.accounts.filter((account) =>
    accountMatchesRuntime(account, accountRuntime)
  )
  const visibleCodexAccounts = codexAccounts.accounts.filter((account) =>
    accountMatchesRuntime(account, accountRuntime)
  )
  const activeCodexAccountId = getActiveCodexAccountIdForRuntime(codexAccounts, accountRuntime)
  const activeClaudeAccountId = getActiveClaudeAccountIdForRuntime(claudeAccounts, accountRuntime)
  const activeCodexAuthWarning = codexAccountsLoaded
    ? getCodexAccountAuthWarning({
        limits: codexRateLimits,
        target: codexRateLimitTarget,
        runtime: accountRuntime,
        activeAccountId: activeCodexAccountId,
        accountId: activeCodexAccountId
      })
    : null
  const systemCodexNeedsReauthentication =
    activeCodexAccountId === null && Boolean(activeCodexAuthWarning)
  const accountRuntimeUnavailable =
    accountRuntime.runtime === 'wsl' && !wslAvailable && !wslCapabilitiesLoading

  const recordOpenCodeSettingEdit = (field: 'cookie' | 'workspaceId'): void => {
    if (recordedOpenCodeSettingEditsRef.current.has(field)) {
      return
    }
    recordedOpenCodeSettingEditsRef.current.add(field)
    recordFeatureInteraction('usage-tracking')
  }

  const refreshMiniMaxCredentialStatus = async (): Promise<void> => {
    try {
      const status = await window.api.minimaxCredentials.getStatus()
      setMiniMaxConfigured(status.configured)
    } catch (error) {
      console.error('Failed to load MiniMax credential status:', error)
    }
  }

  const saveMiniMaxCookie = async (): Promise<boolean> => {
    if (!miniMaxCookieDraft.trim()) {
      toast.error(
        translate('auto.components.settings.AccountsPane.2f24f244a4', 'MiniMax cookie is required.')
      )
      return false
    }
    setMiniMaxCredentialBusy(true)
    try {
      const status = await window.api.minimaxCredentials.saveCookie(miniMaxCookieDraft.trim())
      if (!status.configured) {
        throw new Error(
          translate(
            'auto.components.settings.AccountsPane.8e6f0cb1d8',
            'MiniMax cookie was not saved.'
          )
        )
      }
      setMiniMaxConfigured(status.configured)
      setMiniMaxCookieDraft('')
      recordFeatureInteraction('usage-tracking')
      toast.success(
        translate('auto.components.settings.AccountsPane.8d61637a77', 'MiniMax cookie saved.')
      )
      return true
    } catch (error) {
      toast.error(
        translate(
          'auto.components.settings.AccountsPane.b43e761fe5',
          'MiniMax cookie update failed.'
        ),
        { description: String((error as Error)?.message ?? error) }
      )
      return false
    } finally {
      setMiniMaxCredentialBusy(false)
    }
  }

  const openMiniMaxDialog = (): void => {
    setMiniMaxCookieDraft('')
    setMiniMaxGroupDraft(settings.minimaxGroupId)
    setMiniMaxModelsDraft(settings.minimaxUsageModels)
    setMiniMaxDialogOpen(true)
  }

  const saveMiniMaxDialog = async (): Promise<void> => {
    const cookie = miniMaxCookieDraft.trim()
    if (!miniMaxConfigured && !cookie) {
      toast.error(
        translate('auto.components.settings.AccountsPane.2f24f244a4', 'MiniMax cookie is required.')
      )
      return
    }
    updateSettings({
      minimaxGroupId: miniMaxGroupDraft.trim(),
      minimaxUsageModels: miniMaxModelsDraft.trim()
    })
    if (cookie) {
      const ok = await saveMiniMaxCookie()
      if (!ok) {
        return
      }
    } else {
      recordFeatureInteraction('usage-tracking')
      toast.success(
        translate(
          'auto.components.settings.AccountsPane.minimaxSettingsSaved',
          'MiniMax settings saved.'
        )
      )
    }
    setMiniMaxDialogOpen(false)
  }

  const clearMiniMaxCookie = async (): Promise<void> => {
    setMiniMaxCredentialBusy(true)
    try {
      const status = await window.api.minimaxCredentials.clearCookie()
      setMiniMaxConfigured(status.configured)
      setMiniMaxCookieDraft('')
      recordFeatureInteraction('usage-tracking')
    } catch (error) {
      toast.error(
        translate(
          'auto.components.settings.AccountsPane.b43e761fe5',
          'MiniMax cookie update failed.'
        ),
        { description: String((error as Error)?.message ?? error) }
      )
    } finally {
      setMiniMaxCredentialBusy(false)
    }
  }

  useEffect(() => {
    void refreshMiniMaxCredentialStatus()
  }, [])

  useEffect(() => {
    let stale = false

    const loadCodexAccounts = async (): Promise<void> => {
      try {
        const nextCodex = await window.api.codexAccounts.list()
        if (!stale) {
          setCodexAccounts(nextCodex)
          setCodexAccountsLoaded(true)
        }
      } catch (error) {
        if (!stale) {
          toast.error(
            translate(
              'auto.components.settings.AccountsPane.b8c2905c2b',
              'Could not load Codex accounts.'
            ),
            {
              description: String((error as Error)?.message ?? error)
            }
          )
        }
      }
    }

    const loadClaudeAccounts = async (): Promise<void> => {
      try {
        const nextClaude = await window.api.claudeAccounts.list()
        if (!stale) {
          setClaudeAccounts(nextClaude)
        }
      } catch (error) {
        if (!stale) {
          toast.error(
            translate(
              'auto.components.settings.AccountsPane.9107406589',
              'Could not load Claude accounts.'
            ),
            {
              description: String((error as Error)?.message ?? error)
            }
          )
        }
      }
    }

    void loadCodexAccounts()
    void loadClaudeAccounts()

    return () => {
      stale = true
    }
  }, [])

  const syncCodexAccounts = async (next: CodexRateLimitAccountsState): Promise<void> => {
    setCodexAccounts(next)
    setCodexAccountsLoaded(true)
    await fetchSettings()
  }

  const syncClaudeAccounts = async (next: ClaudeRateLimitAccountsState): Promise<void> => {
    setClaudeAccounts(next)
    await fetchSettings()
  }

  const accountRuntimeControls = wslSupportedPlatform ? (
    <SearchableSetting
      title={translate('auto.components.settings.AccountsPane.f54b4fbd71', 'Account Location')}
      description={translate(
        'auto.components.settings.AccountsPane.2cd197025c',
        'Choose whether provider accounts are inspected and added in {{value0}} or WSL.',
        { value0: getHostRuntimeLabel() }
      )}
      keywords={['account', 'location', 'windows', 'wsl', 'linux', 'provider', 'auth']}
    >
      <SettingsRow
        label={translate('auto.components.settings.AccountsPane.46cf7e7495', 'Account location')}
        alignTop
        description={
          accountRuntime.runtime === 'wsl' && !wslAvailable && !wslCapabilitiesLoading
            ? translate(
                'auto.components.settings.AccountsPane.0c67a2a1aa',
                'WSL is not available on this machine.'
              )
            : translate(
                'auto.components.settings.AccountsPane.0b4591ff93',
                'Choose which local environment to inspect and where new managed Claude and Codex accounts are added.'
              )
        }
        control={
          <div className="flex w-44 flex-col items-stretch gap-2">
            <SettingsSegmentedControl
              ariaLabel={translate(
                'auto.components.settings.AccountsPane.46cf7e7495',
                'Account location'
              )}
              value={accountRuntime.runtime}
              onChange={(value) => updateSettings({ localAccountRuntime: value })}
              equalWidth
              options={[
                { value: 'host', label: getHostRuntimeLabel() },
                ...(wslSupportedPlatform
                  ? [
                      {
                        value: 'wsl',
                        label: translate('auto.components.settings.AccountsPane.8619f9afa9', 'WSL'),
                        disabled: wslCapabilitiesLoading || !wslAvailable
                      } as const
                    ]
                  : [])
              ]}
            />
            {wslSupportedPlatform && accountRuntime.runtime === 'wsl' ? (
              <Select
                value={accountRuntime.wslDistro ?? '__default__'}
                items={[
                  {
                    value: '__default__',
                    label: translate(
                      'auto.components.settings.AccountsPane.2358ac71d2',
                      'WSL default'
                    )
                  },
                  ...wslDistros.map((distro) => ({ value: distro, label: distro }))
                ]}
                onValueChange={(value) =>
                  updateSettings({
                    localAccountRuntime: 'wsl',
                    localAccountWslDistro: value === '__default__' ? null : value
                  })
                }
                disabled={wslCapabilitiesLoading || !wslAvailable}
              >
                <SelectTrigger size="sm" className="w-full min-w-44">
                  <SelectValue
                    placeholder={
                      wslCapabilitiesLoading
                        ? translate(
                            'auto.components.settings.AccountsPane.ad47a33f72',
                            'Loading WSL'
                          )
                        : translate(
                            'auto.components.settings.AccountsPane.2358ac71d2',
                            'WSL default'
                          )
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">
                    {translate('auto.components.settings.AccountsPane.2358ac71d2', 'WSL default')}
                  </SelectItem>
                  {wslDistros.map((distro) => (
                    <SelectItem key={distro} value={distro}>
                      {distro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        }
      />
    </SearchableSetting>
  ) : null

  const runCodexAccountAction = async (
    action: typeof codexAction,
    operation: () => Promise<CodexRateLimitAccountsState>
  ): Promise<void> => {
    const previousActiveAccountId = getActiveCodexAccountIdForRuntime(codexAccounts, accountRuntime)
    setCodexAction(action)
    try {
      const next = await operation()
      await syncCodexAccounts(next)
      recordFeatureInteraction('codex-account-switching')
      const nextActiveAccountId = getActiveCodexAccountIdForRuntime(next, accountRuntime)
      const shouldPromptRestart =
        action === 'adding' ||
        (action.startsWith('select:') && previousActiveAccountId !== nextActiveAccountId) ||
        (action.startsWith('reauth:') &&
          nextActiveAccountId !== null &&
          action === `reauth:${nextActiveAccountId}`) ||
        (action.startsWith('remove:') && previousActiveAccountId !== nextActiveAccountId)
      if (shouldPromptRestart) {
        void markLiveCodexSessionsForRestart({
          previousAccountLabel: getCodexAccountLabel(codexAccounts, previousActiveAccountId),
          nextAccountLabel: getCodexAccountLabel(next, nextActiveAccountId)
        })
      }
    } catch (error) {
      toast.error(
        translate(
          'auto.components.settings.AccountsPane.5bf8764953',
          'Codex account update failed.'
        ),
        {
          description: getCodexAccountErrorDescription(error)
        }
      )
    } finally {
      setCodexAction('idle')
    }
  }

  const runClaudeAccountAction = async (
    action: typeof claudeAction,
    operation: () => Promise<ClaudeRateLimitAccountsState>
  ): Promise<void> => {
    const previousActiveAccountId = getActiveClaudeAccountIdForRuntime(
      claudeAccounts,
      accountRuntime
    )
    setClaudeAction(action)
    try {
      const next = await operation()
      await syncClaudeAccounts(next)
      recordFeatureInteraction('claude-account-switching')
      const nextActiveAccountId = getActiveClaudeAccountIdForRuntime(next, accountRuntime)
      const shouldPromptRestart =
        action === 'adding' ||
        previousActiveAccountId !== nextActiveAccountId ||
        (action.startsWith('reauth:') &&
          nextActiveAccountId !== null &&
          action === `reauth:${nextActiveAccountId}`)
      if (shouldPromptRestart) {
        toast.info(
          translate('auto.components.settings.AccountsPane.f921d32606', 'Claude account updated.'),
          {
            description: translate(
              'auto.components.settings.AccountsPane.b15ce90870',
              '{{value0}} -> {{value1}}. Restart live Claude terminals before continuing old sessions.',
              {
                value0: getClaudeAccountLabel(claudeAccounts, previousActiveAccountId),
                value1: getClaudeAccountLabel(next, nextActiveAccountId)
              }
            )
          }
        )
      }
    } catch (error) {
      if (isClaudeAccountCancellation(error)) {
        return
      }
      toast.error(
        translate(
          'auto.components.settings.AccountsPane.2743cdc0af',
          'Claude account update failed.'
        ),
        {
          description: getClaudeAccountErrorDescription(error)
        }
      )
    } finally {
      setClaudeAction('idle')
    }
  }

  const visibleSections = [
    wslSupportedPlatform &&
    matchesSettingsSearch(searchQuery, getAccountsLocationSearchEntries()) ? (
      <section key="account-runtime" id="accounts-runtime" className="scroll-mt-6">
        {accountRuntimeControls}
      </section>
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsClaudeSearchEntries()) ? (
      <section key="claude-accounts" id="accounts-claude" className="scroll-mt-6">
        <SearchableSetting
          title={translate('auto.components.settings.AccountsPane.8bbfd74556', 'Claude Accounts')}
          description={translate(
            'auto.components.settings.AccountsPane.79e484c3b2',
            'Optional account switcher for the shared Claude auth files.'
          )}
          keywords={['claude', 'account', 'rate limit', 'status bar', 'quota']}
          className="space-y-1.5"
        >
          <ProviderSectionHeader
            icon={<ClaudeIcon size={14} />}
            title={translate('auto.components.settings.AccountsPane.26ef4b55be', 'Claude')}
            action={
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void runClaudeAccountAction('adding', () =>
                      window.api.claudeAccounts.add({
                        runtime: accountRuntime.runtime,
                        wslDistro: accountRuntime.wslDistro
                      })
                    )
                  }
                  disabled={
                    claudeAction !== 'idle' || wslCapabilitiesLoading || accountRuntimeUnavailable
                  }
                  className="gap-1.5"
                >
                  {claudeAction === 'adding' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  {translate('auto.components.settings.AccountsPane.b0e948a4f9', 'Add')}
                </Button>
                {claudeAction === 'adding' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void window.api.claudeAccounts.cancelPendingLogin()}
                  >
                    {translate('auto.components.settings.AccountsPane.dbb9626ed1', 'Cancel')}
                  </Button>
                ) : null}
              </div>
            }
          />

          <ProviderAccountList>
            <ProviderAccountRow
              active={activeClaudeAccountId === null}
              disabled={claudeAction !== 'idle' || accountRuntimeUnavailable}
              onSelect={() =>
                void runClaudeAccountAction('select:system', () =>
                  window.api.claudeAccounts.select({
                    accountId: null,
                    runtime: accountRuntime.runtime,
                    wslDistro: accountRuntime.wslDistro
                  })
                )
              }
              title={translate(
                'auto.components.settings.AccountsPane.f2a265f8c7',
                'System default'
              )}
            />
            {visibleClaudeAccounts.map((account) => {
              const isActive = activeClaudeAccountId === account.id
              const isReauthing = claudeAction === `reauth:${account.id}`
              const isBusy = claudeAction !== 'idle' || accountRuntimeUnavailable

              return (
                <ProviderAccountRow
                  key={account.id}
                  active={isActive}
                  disabled={isBusy}
                  onSelect={() =>
                    void runClaudeAccountAction(`select:${account.id}`, () =>
                      window.api.claudeAccounts.select({
                        accountId: account.id,
                        runtime: account.managedAuthRuntime ?? 'host',
                        wslDistro: account.wslDistro ?? null
                      })
                    )
                  }
                  title={account.email}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={translate(
                          'auto.components.settings.AccountsPane.8a0f870153',
                          'Re-authenticate'
                        )}
                        aria-label={translate(
                          'auto.components.settings.AccountsPane.8a0f870153',
                          'Re-authenticate'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          void runClaudeAccountAction(`reauth:${account.id}`, () =>
                            window.api.claudeAccounts.reauthenticate({ accountId: account.id })
                          )
                        }}
                        disabled={isBusy}
                      >
                        {isReauthing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={translate(
                          'auto.components.settings.AccountsPane.db209ee572',
                          'Remove'
                        )}
                        aria-label={translate(
                          'auto.components.settings.AccountsPane.db209ee572',
                          'Remove'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          setRemoveClaudeAccountId(account.id)
                        }}
                        disabled={isBusy}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  }
                />
              )
            })}
          </ProviderAccountList>
        </SearchableSetting>
      </section>
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsCodexSearchEntries()) ? (
      <section key="codex-accounts" id="accounts-codex" className="scroll-mt-6">
        <SearchableSetting
          title={translate('auto.components.settings.AccountsPane.3180536c7a', 'Codex Accounts')}
          description={translate(
            'auto.components.settings.AccountsPane.d0d53b7eb0',
            'Manage which Codex account Orca uses for live rate limit fetching.'
          )}
          // Why: this single SearchableSetting backs the whole Codex section,
          // including the "Active Codex Account" sub-control (account picker
          // below). Roll every Codex search entry's title/description/keywords
          // into one haystack so a search for "Active Codex Account" doesn't
          // render the section header with no body underneath it.
          keywords={getAccountsCodexSearchEntries().flatMap((entry) => [
            entry.title,
            entry.description ?? '',
            ...(entry.keywords ?? [])
          ])}
          className="space-y-1.5"
        >
          <ProviderSectionHeader
            icon={<OpenAIIcon size={14} />}
            title={translate('auto.components.settings.AccountsPane.ef91cfa06b', 'Codex')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void runCodexAccountAction('adding', () =>
                    window.api.codexAccounts.add({
                      runtime: accountRuntime.runtime,
                      wslDistro: accountRuntime.wslDistro
                    })
                  )
                }
                disabled={
                  codexAction !== 'idle' || wslCapabilitiesLoading || accountRuntimeUnavailable
                }
                className="gap-1.5"
              >
                {codexAction === 'adding' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                {translate('auto.components.settings.AccountsPane.b0e948a4f9', 'Add')}
              </Button>
            }
          />

          <ProviderAccountList>
            <ProviderAccountRow
              active={activeCodexAccountId === null}
              danger={systemCodexNeedsReauthentication}
              disabled={codexAction !== 'idle' || accountRuntimeUnavailable}
              onSelect={() =>
                void runCodexAccountAction('select:system', () =>
                  window.api.codexAccounts.select({
                    accountId: null,
                    runtime: accountRuntime.runtime,
                    wslDistro: accountRuntime.wslDistro
                  })
                )
              }
              title={translate(
                'auto.components.settings.AccountsPane.f2a265f8c7',
                'System default'
              )}
              badges={
                systemCodexNeedsReauthentication ? (
                  <ProviderAccountStatusBadge kind="danger">
                    {translate('auto.components.settings.AccountsPane.93c47b333a', 'Needs sign-in')}
                  </ProviderAccountStatusBadge>
                ) : null
              }
            />
            {visibleCodexAccounts.map((account) => {
              const isActive = activeCodexAccountId === account.id
              const accountAuthWarning = getCodexAccountAuthWarning({
                limits: codexRateLimits,
                target: codexRateLimitTarget,
                runtime: accountRuntime,
                activeAccountId: activeCodexAccountId,
                accountId: account.id
              })
              const needsReauthentication = Boolean(accountAuthWarning)
              const isReauthing = codexAction === `reauth:${account.id}`
              const isRemoving = codexAction === `remove:${account.id}`
              const isBusy = codexAction !== 'idle' || accountRuntimeUnavailable

              return (
                <ProviderAccountRow
                  key={account.id}
                  active={isActive}
                  danger={needsReauthentication}
                  disabled={isBusy}
                  onSelect={() =>
                    void runCodexAccountAction(`select:${account.id}`, () =>
                      window.api.codexAccounts.select({
                        accountId: account.id,
                        runtime: account.managedHomeRuntime ?? 'host',
                        wslDistro: account.wslDistro ?? null
                      })
                    )
                  }
                  title={account.email}
                  badges={
                    needsReauthentication ? (
                      <ProviderAccountStatusBadge kind="danger">
                        {translate(
                          'auto.components.settings.AccountsPane.589eba1eee',
                          'Needs re-auth'
                        )}
                      </ProviderAccountStatusBadge>
                    ) : null
                  }
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={translate(
                          'auto.components.settings.AccountsPane.8a0f870153',
                          'Re-authenticate'
                        )}
                        aria-label={translate(
                          'auto.components.settings.AccountsPane.8a0f870153',
                          'Re-authenticate'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          void runCodexAccountAction(`reauth:${account.id}`, () =>
                            window.api.codexAccounts.reauthenticate({ accountId: account.id })
                          )
                        }}
                        disabled={isBusy}
                      >
                        {isReauthing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={translate(
                          'auto.components.settings.AccountsPane.db209ee572',
                          'Remove'
                        )}
                        aria-label={translate(
                          'auto.components.settings.AccountsPane.db209ee572',
                          'Remove'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          setRemoveAccountId(account.id)
                        }}
                        disabled={isBusy}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {isRemoving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </>
                  }
                />
              )
            })}
          </ProviderAccountList>
        </SearchableSetting>
      </section>
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsGeminiSearchEntries()) ? (
      <section key="gemini" id="accounts-gemini" className="scroll-mt-6">
        <SearchableSetting
          title={translate(
            'auto.components.settings.AccountsPane.0c7f915b01',
            'Use Gemini CLI credentials'
          )}
          description={translate(
            'auto.components.settings.AccountsPane.d676c41fc6',
            'Extracts OAuth credentials from your local Gemini CLI installation to authenticate with Google. This uses credentials issued to the Gemini CLI app, not Orca. May break if Google updates the CLI. Use at your own risk.'
          )}
          keywords={[
            'gemini',
            'cli',
            'oauth',
            'credentials',
            'experimental',
            'rate limit',
            'status bar'
          ]}
          className="space-y-1.5"
        >
          <ProviderSectionHeader
            icon={<GeminiIcon size={14} />}
            title={translate('auto.components.settings.AccountsPane.0c64dc2a64', 'Gemini')}
            action={
              <SettingsSwitch
                checked={settings.geminiCliOAuthEnabled}
                ariaLabel={translate(
                  'auto.components.settings.AccountsPane.96f3649526',
                  'Use Gemini CLI credentials (experimental)'
                )}
                onChange={() => {
                  recordFeatureInteraction('usage-tracking')
                  updateSettings({
                    geminiCliOAuthEnabled: !settings.geminiCliOAuthEnabled
                  })
                }}
              />
            }
          />
          {/* Keep runtime label in DOM for i18n interpolation tests / a11y context. */}
          <p className="sr-only">
            {translate(
              'auto.components.settings.AccountsPane.c2aee76420',
              'Extracts OAuth credentials from your local Gemini CLI installation to authenticate with Google for {{value0}}. This uses credentials issued to the Gemini CLI app, not Orca. May break if Google updates the CLI. Use at your own risk.',
              { value0: accountRuntimeSentenceLabel }
            )}
          </p>
        </SearchableSetting>
      </section>
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsOpencodeSearchEntries()) ? (
      <section key="opencode-go" id="accounts-opencode-go" className="scroll-mt-6">
        <SearchableSetting
          title={translate('auto.components.settings.AccountsPane.4ac10b4d08', 'OpenCode Go')}
          description={translate(
            'auto.components.settings.AccountsPane.b2b1aa936d',
            'Paste your opencode.ai session cookie for rate limit fetching.'
          )}
          keywords={[
            'opencode',
            'cookie',
            'session',
            'workspace',
            'rate limit',
            'status bar',
            ...getAccountsOpencodeSearchEntries().flatMap((e) => e.keywords ?? [])
          ]}
          className="space-y-1.5"
        >
          <ProviderSectionHeader
            icon={<OpenCodeGoIcon size={14} />}
            title={translate('auto.components.settings.AccountsPane.4ac10b4d08', 'OpenCode Go')}
            action={
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpenCodeCookieDraft(settings.opencodeSessionCookie)
                    setOpenCodeWorkspaceDraft(settings.opencodeWorkspaceId)
                    setOpenCodeDialogOpen(true)
                  }}
                >
                  {settings.opencodeSessionCookie
                    ? translate('auto.components.settings.AccountsPane.editCredentials', 'Edit')
                    : translate(
                        'auto.components.settings.AccountsPane.configureCredentials',
                        'Set up'
                      )}
                </Button>
                {settings.opencodeSessionCookie ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title={translate('auto.components.settings.AccountsPane.b398b834c9', 'Clear')}
                    aria-label={translate(
                      'auto.components.settings.AccountsPane.b398b834c9',
                      'Clear'
                    )}
                    onClick={() => {
                      recordFeatureInteraction('usage-tracking')
                      updateSettings({ opencodeSessionCookie: '', opencodeWorkspaceId: '' })
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            }
          />
        </SearchableSetting>
      </section>
    ) : null,
    matchesSettingsSearch(searchQuery, getAccountsMiniMaxSearchEntries()) ? (
      <section key="minimax" id="accounts-minimax" className="scroll-mt-6">
        <SearchableSetting
          title={translate('auto.components.settings.AccountsPane.5d63bbfbec', 'MiniMax')}
          description={translate(
            'auto.components.settings.AccountsPane.33bba5ad83',
            'Paste your MiniMax session cookie for local rate-limit fetching.'
          )}
          keywords={[
            'minimax',
            'cookie',
            'session',
            'rate limit',
            'status bar',
            'group',
            'model',
            ...getAccountsMiniMaxSearchEntries().flatMap((e) => e.keywords ?? [])
          ]}
          className="space-y-1.5"
        >
          <ProviderSectionHeader
            icon={<MiniMaxIcon size={14} />}
            title={translate('auto.components.settings.AccountsPane.5d63bbfbec', 'MiniMax')}
            action={
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={openMiniMaxDialog}>
                  {miniMaxConfigured
                    ? translate('auto.components.settings.AccountsPane.editCredentials', 'Edit')
                    : translate(
                        'auto.components.settings.AccountsPane.configureCredentials',
                        'Set up'
                      )}
                </Button>
                {miniMaxConfigured ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title={translate(
                      'auto.components.settings.AccountsPane.316ca4e610',
                      'Forget cookie'
                    )}
                    aria-label={translate(
                      'auto.components.settings.AccountsPane.316ca4e610',
                      'Forget cookie'
                    )}
                    disabled={miniMaxCredentialBusy}
                    onClick={() => void clearMiniMaxCookie()}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {miniMaxCredentialBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                ) : null}
              </div>
            }
          />
        </SearchableSetting>
      </section>
    ) : null
  ].filter(Boolean)

  return (
    <div className="flex flex-col">
      <Dialog
        open={removeAccountId !== null}
        onOpenChange={(open) => !open && setRemoveAccountId(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {translate(
                'auto.components.settings.AccountsPane.0d47394635',
                'Remove Codex Account?'
              )}
            </DialogTitle>
            <DialogDescription>
              {translate(
                'auto.components.settings.AccountsPane.99c8f9e498',
                'Orca will delete the managed Codex home for this saved account. If it is currently active, Orca falls back to the system default Codex login.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveAccountId(null)}>
              {translate('auto.components.settings.AccountsPane.dbb9626ed1', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const accountId = removeAccountId
                if (!accountId) {
                  return
                }
                setRemoveAccountId(null)
                void runCodexAccountAction(`remove:${accountId}`, () =>
                  window.api.codexAccounts.remove({ accountId })
                )
              }}
            >
              {translate('auto.components.settings.AccountsPane.c2d2751587', 'Remove Account')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={removeClaudeAccountId !== null}
        onOpenChange={(open) => !open && setRemoveClaudeAccountId(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {translate(
                'auto.components.settings.AccountsPane.63843e37e2',
                'Remove Claude Account?'
              )}
            </DialogTitle>
            <DialogDescription>
              {translate(
                'auto.components.settings.AccountsPane.854ebbcc45',
                'Orca will delete the managed Claude auth for this saved account. If it is currently active, Orca falls back to the system default Claude login.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveClaudeAccountId(null)}>
              {translate('auto.components.settings.AccountsPane.dbb9626ed1', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const accountId = removeClaudeAccountId
                if (!accountId) {
                  return
                }
                setRemoveClaudeAccountId(null)
                void runClaudeAccountAction(`remove:${accountId}`, () =>
                  window.api.claudeAccounts.remove({ accountId })
                )
              }}
            >
              {translate('auto.components.settings.AccountsPane.c2d2751587', 'Remove Account')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCodeDialogOpen} onOpenChange={setOpenCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {translate('auto.components.settings.AccountsPane.4ac10b4d08', 'OpenCode Go')}
            </DialogTitle>
            <DialogDescription>
              {translate(
                'auto.components.settings.AccountsPane.b2b1aa936d',
                'Paste your opencode.ai session cookie for rate limit fetching.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>
                {translate(
                  'auto.components.settings.AccountsPane.67e3c33670',
                  'OpenCode Go session cookie'
                )}
              </Label>
              <Input
                type="password"
                value={openCodeCookieDraft}
                onChange={(e) => setOpenCodeCookieDraft(e.target.value)}
                placeholder={translate(
                  'auto.components.settings.AccountsPane.a7e38affcd',
                  'Fe26.2**… token or auth=Fe26.2**… header'
                )}
                spellCheck={false}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {translate(
                  'auto.components.settings.AccountsPane.dbdb0b0bd8',
                  'Workspace ID override'
                )}
              </Label>
              <Input
                type="text"
                value={openCodeWorkspaceDraft}
                onChange={(e) => setOpenCodeWorkspaceDraft(e.target.value)}
                placeholder={translate(
                  'auto.components.settings.AccountsPane.a122332371',
                  'wrk_… (leave blank for automatic lookup)'
                )}
                spellCheck={false}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCodeDialogOpen(false)}>
              {translate('auto.components.settings.AccountsPane.dbb9626ed1', 'Cancel')}
            </Button>
            <Button
              onClick={() => {
                recordOpenCodeSettingEdit('cookie')
                recordOpenCodeSettingEdit('workspaceId')
                updateSettings({
                  opencodeSessionCookie: openCodeCookieDraft.trim(),
                  opencodeWorkspaceId: openCodeWorkspaceDraft.trim()
                })
                setOpenCodeDialogOpen(false)
                toast.success(
                  translate(
                    'auto.components.settings.AccountsPane.opencodeSaved',
                    'OpenCode Go settings saved.'
                  )
                )
              }}
            >
              {translate('auto.components.settings.AccountsPane.590a3130f9', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={miniMaxDialogOpen} onOpenChange={setMiniMaxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {translate('auto.components.settings.AccountsPane.5d63bbfbec', 'MiniMax')}
            </DialogTitle>
            <DialogDescription>
              {translate(
                'auto.components.settings.AccountsPane.33bba5ad83',
                'Paste your MiniMax session cookie for local rate-limit fetching.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>
                  {translate(
                    'auto.components.settings.AccountsPane.21d6eb141e',
                    'MiniMax Session Cookie'
                  )}
                </Label>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="xs" className="h-6 gap-1 px-2 text-xs" asChild>
                    <a href={MINIMAX_CONSOLE_URL} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3" />
                      {translate(
                        'auto.components.settings.AccountsPane.0d8e77bc40',
                        'Open console'
                      )}
                    </a>
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="xs" className="h-6 gap-1 px-2 text-xs">
                        <HelpCircle className="size-3" />
                        {translate(
                          'auto.components.settings.AccountsPane.43d7a45b97',
                          'How to copy'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" side="bottom" sideOffset={6} className="w-80 p-0">
                      <MiniMaxCookieHelpPopover />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Input
                type="password"
                value={miniMaxCookieDraft}
                onChange={(e) => setMiniMaxCookieDraft(e.target.value)}
                placeholder={
                  miniMaxConfigured
                    ? translate(
                        'auto.components.settings.AccountsPane.minimaxCookieLeaveBlank',
                        'Leave blank to keep current cookie'
                      )
                    : translate(
                        'auto.components.settings.AccountsPane.b8a4f21c3e',
                        'Paste the Cookie header from DevTools'
                      )
                }
                spellCheck={false}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {translate('auto.components.settings.AccountsPane.bf160bb6c0', 'Group ID override')}
              </Label>
              <Input
                type="text"
                value={miniMaxGroupDraft}
                onChange={(e) => setMiniMaxGroupDraft(e.target.value)}
                placeholder={translate(
                  'auto.components.settings.AccountsPane.0747d6391a',
                  'Use group ID from cookie'
                )}
                spellCheck={false}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {translate('auto.components.settings.AccountsPane.4ff2af7524', 'Usage model names')}
              </Label>
              <Input
                type="text"
                value={miniMaxModelsDraft}
                onChange={(e) => setMiniMaxModelsDraft(e.target.value)}
                placeholder={translate(
                  'auto.components.settings.AccountsPane.3c92b0d31c',
                  'general'
                )}
                spellCheck={false}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMiniMaxDialogOpen(false)}>
              {translate('auto.components.settings.AccountsPane.dbb9626ed1', 'Cancel')}
            </Button>
            <Button
              onClick={() => void saveMiniMaxDialog()}
              disabled={miniMaxCredentialBusy || (!miniMaxConfigured && !miniMaxCookieDraft.trim())}
            >
              {miniMaxCredentialBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {translate('auto.components.settings.AccountsPane.590a3130f9', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="divide-y divide-border/40">
        {visibleSections.map((section, index) => (
          <div key={index} className="py-2.5 first:pt-0 last:pb-0">
            {section}
          </div>
        ))}
      </div>
    </div>
  )
}
