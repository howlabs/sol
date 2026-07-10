import { describe, expect, it } from 'vitest'
import { getExecutionHostLabel } from '../../../../shared/execution-host'
import { getProviderAccountScope, getProviderRateLimitScope } from './provider-account-scope'

const LOCAL_HOST_LABEL = getExecutionHostLabel('local')

describe('getProviderAccountScope', () => {
  it('describes provider accounts as client-owned without an active runtime', () => {
    expect(getProviderAccountScope({ activeRuntimeEnvironmentId: null })).toEqual({
      label: LOCAL_HOST_LABEL,
      description:
        'Sign-in for this provider is stored on this computer. Manage remote-server credentials in Settings → Remote Orca Servers → Advanced.'
    })
  })

  it('describes provider accounts as remote-server-owned with an active runtime', () => {
    expect(getProviderAccountScope({ activeRuntimeEnvironmentId: ' env-1 ' })).toEqual({
      label: 'Remote server: env-1',
      description:
        'Sign-in for this provider is stored on this remote server. Change the default runtime in Settings → Remote Orca Servers → Advanced.'
    })
  })

  it('describes provider API budgets as host-scoped', () => {
    expect(getProviderRateLimitScope({ activeRuntimeEnvironmentId: null }, 'GitHub')).toEqual({
      label: LOCAL_HOST_LABEL,
      description:
        'GitHub rate limits come from the CLI on this computer. View server budgets in Settings → Remote Orca Servers → Advanced.'
    })
    expect(getProviderRateLimitScope({ activeRuntimeEnvironmentId: ' env-1 ' }, 'GitLab')).toEqual({
      label: 'Remote server: env-1',
      description:
        'GitLab rate limits come from the CLI on this remote server. Pick another runtime in Settings → Remote Orca Servers → Advanced.'
    })
  })
})
