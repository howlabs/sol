import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import type {
  GrokManagedAccount,
  GrokManagedAccountSummary,
  GrokRateLimitAccountsState,
  GrokDeviceCodeInfo
} from '../../shared/types'
import type { Store } from '../persistence'
import type { RateLimitService } from '../rate-limits/service'
import { readGrokAuthSession } from '../rate-limits/grok-auth'
import { createManagedGrokHome, resolveOwnedManagedGrokHome } from './managed-grok-home'
import { runGrokLogin } from './grok-login-runner'

type CapturedGrokAuth = {
  email: string
  teamId: string | null
}

export class GrokAccountService {
  private mutationQueue: Promise<unknown> = Promise.resolve()
  private loginAbortController: AbortController | null = null

  constructor(
    private readonly store: Store,
    private readonly rateLimits: RateLimitService
  ) {}

  listAccounts(): GrokRateLimitAccountsState {
    return this.getSnapshot()
  }

  async addAccount(
    onDeviceCode?: (info: GrokDeviceCodeInfo) => void
  ): Promise<GrokRateLimitAccountsState> {
    return this.serializeMutation(() => this.doAddAccount(onDeviceCode))
  }

  async reauthenticateAccount(
    accountId: string,
    onDeviceCode?: (info: GrokDeviceCodeInfo) => void
  ): Promise<GrokRateLimitAccountsState> {
    return this.serializeMutation(() => this.doReauthenticateAccount(accountId, onDeviceCode))
  }

  async removeAccount(accountId: string): Promise<GrokRateLimitAccountsState> {
    return this.serializeMutation(() => this.doRemoveAccount(accountId))
  }

  async selectAccount(accountId: string | null): Promise<GrokRateLimitAccountsState> {
    return this.serializeMutation(() => this.doSelectAccount(accountId))
  }

  cancelPendingLogin(): boolean {
    if (this.loginAbortController && !this.loginAbortController.signal.aborted) {
      this.loginAbortController.abort()
      return true
    }
    return false
  }

  private serializeMutation<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.mutationQueue.then(fn, fn)
    this.mutationQueue = next.catch(() => {})
    return next
  }

  private async doAddAccount(
    onDeviceCode?: (info: GrokDeviceCodeInfo) => void
  ): Promise<GrokRateLimitAccountsState> {
    const accountId = randomUUID()
    const managedGrokHome = createManagedGrokHome(accountId)
    const previousSettings = this.store.getSettings()

    try {
      await this.executeGrokLogin(managedGrokHome, onDeviceCode)
      const captured = this.captureAuthFromGrokHome(managedGrokHome)
      if (!captured.email) {
        throw new Error('Grok login completed, but Orca could not resolve the account email.')
      }

      const now = Date.now()
      const account: GrokManagedAccount = {
        id: accountId,
        email: captured.email,
        managedGrokHomePath: managedGrokHome,
        teamId: captured.teamId,
        createdAt: now,
        updatedAt: now,
        lastAuthenticatedAt: now
      }

      this.store.updateSettings({
        grokManagedAccounts: [...previousSettings.grokManagedAccounts, account],
        activeGrokManagedAccountId: accountId
      })
      this.rateLimits.evictGrokCache()
      return this.getSnapshot()
    } catch (error) {
      this.restoreGrokSettings(previousSettings)
      await this.safeRemoveManagedGrokHome(accountId, managedGrokHome)
      throw error
    }
  }

  private async doReauthenticateAccount(
    accountId: string,
    onDeviceCode?: (info: GrokDeviceCodeInfo) => void
  ): Promise<GrokRateLimitAccountsState> {
    const settings = this.store.getSettings()
    const account = settings.grokManagedAccounts.find((entry) => entry.id === accountId)
    if (!account) {
      throw new Error('Grok account not found.')
    }
    const ownedPath = resolveOwnedManagedGrokHome(accountId, account.managedGrokHomePath)
    if (!ownedPath) {
      throw new Error('Managed Grok home directory is not owned by Orca.')
    }

    await this.executeGrokLogin(ownedPath, onDeviceCode)
    const captured = this.captureAuthFromGrokHome(ownedPath)
    if (!captured.email) {
      throw new Error('Grok login completed, but Orca could not resolve the account email.')
    }

    const now = Date.now()
    this.store.updateSettings({
      grokManagedAccounts: settings.grokManagedAccounts.map((entry) =>
        entry.id === accountId
          ? {
              ...entry,
              email: captured.email,
              teamId: captured.teamId,
              updatedAt: now,
              lastAuthenticatedAt: now
            }
          : entry
      )
    })
    this.rateLimits.evictGrokCache()
    return this.getSnapshot()
  }

  private async doRemoveAccount(accountId: string): Promise<GrokRateLimitAccountsState> {
    const settings = this.store.getSettings()
    const account = settings.grokManagedAccounts.find((entry) => entry.id === accountId)
    if (!account) {
      return this.getSnapshot()
    }

    await this.safeRemoveManagedGrokHome(accountId, account.managedGrokHomePath)

    this.store.updateSettings({
      grokManagedAccounts: settings.grokManagedAccounts.filter((entry) => entry.id !== accountId),
      activeGrokManagedAccountId:
        settings.activeGrokManagedAccountId === accountId
          ? null
          : settings.activeGrokManagedAccountId
    })
    this.rateLimits.evictGrokCache()
    return this.getSnapshot()
  }

  private async doSelectAccount(accountId: string | null): Promise<GrokRateLimitAccountsState> {
    const settings = this.store.getSettings()
    if (accountId !== null) {
      const exists = settings.grokManagedAccounts.some((entry) => entry.id === accountId)
      if (!exists) {
        throw new Error('Grok account not found.')
      }
    }
    this.store.updateSettings({ activeGrokManagedAccountId: accountId })
    this.rateLimits.evictGrokCache()
    return this.getSnapshot()
  }

  private async executeGrokLogin(
    grokHomePath: string,
    onDeviceCode?: (info: GrokDeviceCodeInfo) => void
  ): Promise<void> {
    const abortController = new AbortController()
    this.loginAbortController = abortController
    try {
      await runGrokLogin(grokHomePath, onDeviceCode, abortController.signal)
    } finally {
      this.loginAbortController = null
    }
  }

  private captureAuthFromGrokHome(grokHomePath: string): CapturedGrokAuth {
    const readResult = readGrokAuthSession({ GROK_HOME: grokHomePath })
    if (readResult.status === 'ok') {
      return {
        email: readResult.session.email ?? '',
        teamId: readResult.session.teamId
      }
    }
    if (readResult.status === 'error') {
      throw new Error(readResult.error)
    }
    throw new Error('Grok login completed, but no auth.json was written.')
  }

  private getSnapshot(): GrokRateLimitAccountsState {
    const settings = this.store.getSettings()
    return {
      accounts: settings.grokManagedAccounts.map(toSummary),
      activeAccountId: settings.activeGrokManagedAccountId ?? null
    }
  }

  private restoreGrokSettings(previous: ReturnType<Store['getSettings']>): void {
    this.store.updateSettings({
      grokManagedAccounts: previous.grokManagedAccounts,
      activeGrokManagedAccountId: previous.activeGrokManagedAccountId
    })
  }

  private async safeRemoveManagedGrokHome(accountId: string, grokHomePath: string): Promise<void> {
    const ownedPath = resolveOwnedManagedGrokHome(accountId, grokHomePath)
    if (!ownedPath) {
      return
    }
    try {
      rmSync(ownedPath, { recursive: true, force: true })
    } catch (error) {
      console.warn('[grok-accounts] Failed to remove managed Grok home:', error)
    }
  }

  getActiveGrokHomePath(): string | null {
    const settings = this.store.getSettings()
    const activeId = settings.activeGrokManagedAccountId
    if (!activeId) {
      return null
    }
    const account = settings.grokManagedAccounts.find((entry) => entry.id === activeId)
    if (!account) {
      return null
    }
    return resolveOwnedManagedGrokHome(activeId, account.managedGrokHomePath)
  }
}

function toSummary(account: GrokManagedAccount): GrokManagedAccountSummary {
  return {
    id: account.id,
    email: account.email,
    teamId: account.teamId,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    lastAuthenticatedAt: account.lastAuthenticatedAt
  }
}
