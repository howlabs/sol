import { translate } from '@/i18n/i18n'
import { getLocalExecutionHostLabel } from '../../../../shared/execution-host'
import type { GlobalSettings } from '../../../../shared/types'

export type ProviderAccountScope = {
  label: string
  description: string
}

export type ProviderRateLimitScope = {
  label: string
  description: string
}

export function getProviderAccountScope(
  settings: Pick<GlobalSettings, 'activeRuntimeEnvironmentId'> | null | undefined
): ProviderAccountScope {
  const runtimeId = settings?.activeRuntimeEnvironmentId?.trim()
  if (runtimeId) {
    return {
      label: translate(
        'auto.components.settings.providerAccountScope.remoteServer',
        'Remote server: {{value0}}',
        { value0: runtimeId }
      ),
      description: translate(
        'auto.components.settings.providerAccountScope.remoteServerCredentials',
        'Sign-in for this provider is stored on this remote server. Change the default runtime in Settings → Remote Orca Servers → Advanced.'
      )
    }
  }
  return {
    label: getLocalExecutionHostLabel(),
    description: translate(
      'auto.components.settings.providerAccountScope.localCredentials',
      'Sign-in for this provider is stored on this computer. Manage remote-server credentials in Settings → Remote Orca Servers → Advanced.'
    )
  }
}

export function getProviderRateLimitScope(
  settings: Pick<GlobalSettings, 'activeRuntimeEnvironmentId'> | null | undefined,
  providerLabel: string
): ProviderRateLimitScope {
  const runtimeId = settings?.activeRuntimeEnvironmentId?.trim()
  if (runtimeId) {
    return {
      label: translate(
        'auto.components.settings.providerAccountScope.remoteServer',
        'Remote server: {{value0}}',
        { value0: runtimeId }
      ),
      description: translate(
        'auto.components.settings.providerAccountScope.remoteServerRateLimit',
        '{{value0}} rate limits come from the CLI on this remote server. Pick another runtime in Settings → Remote Orca Servers → Advanced.',
        { value0: providerLabel }
      )
    }
  }
  return {
    label: getLocalExecutionHostLabel(),
    description: translate(
      'auto.components.settings.providerAccountScope.localRateLimit',
      '{{value0}} rate limits come from the CLI on this computer. View server budgets in Settings → Remote Orca Servers → Advanced.',
      { value0: providerLabel }
    )
  }
}
