import { describe, expect, it } from 'vitest'

import { buildAiVaultResumeCommand } from './ai-vault-types'

describe('buildAiVaultResumeCommand', () => {
  it('wraps Windows cwd changes in cmd so PowerShell and cmd launch the same resume command', () => {
    expect(
      buildAiVaultResumeCommand({
        agent: 'codex',
        sessionId: 'session-1',
        cwd: 'C:\\Users\\Ada Lovelace\\repo',
        platform: 'win32'
      })
    ).toBe('cmd /d /s /c "cd /d ""C:\\Users\\Ada Lovelace\\repo"" && codex resume ""session-1"""')
  })

  it('carries non-default Codex homes in copied resume commands', () => {
    expect(
      buildAiVaultResumeCommand({
        agent: 'codex',
        sessionId: 'session-1',
        cwd: '/repo/app',
        platform: 'darwin',
        codexHome: '/Users/ada/Library/Application Support/Sol/codex-runtime-home/home'
      })
    ).toBe(
      "cd '/repo/app' && CODEX_HOME='/Users/ada/Library/Application Support/Sol/codex-runtime-home/home' codex resume 'session-1'"
    )

    expect(
      buildAiVaultResumeCommand({
        agent: 'codex',
        sessionId: 'session-1',
        cwd: 'C:\\Users\\Ada Lovelace\\repo',
        platform: 'win32',
        codexHome: 'C:\\Users\\Ada\\AppData\\Roaming\\Sol\\codex-runtime-home\\home'
      })
    ).toBe(
      'cmd /d /s /c "cd /d ""C:\\Users\\Ada Lovelace\\repo"" && set ""CODEX_HOME=C:\\Users\\Ada\\AppData\\Roaming\\Sol\\codex-runtime-home\\home"" && codex resume ""session-1"""'
    )
  })

  it('resumes Pi by session id', () => {
    expect(
      buildAiVaultResumeCommand({
        agent: 'pi',
        sessionId: '019f27cd-4268-7000-96e7-62f42a55c144',
        cwd: '/Users/ada/repo',
        platform: 'darwin'
      })
    ).toBe("cd '/Users/ada/repo' && pi --session '019f27cd-4268-7000-96e7-62f42a55c144'")
  })
})
