import { describe, expect, it, vi } from 'vitest'
import type { SFTPWrapper } from 'ssh2'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/orca-user-data'
  }
}))

import { CodexHookService } from '../codex/hook-service'
import { DroidHookService } from '../droid/hook-service'
import { AntigravityHookService } from '../antigravity/hook-service'
import { AmpHookService } from '../amp/hook-service'
import { ClaudeHookService } from '../claude/hook-service'
import { GrokHookService } from '../grok/hook-service'
import { CopilotHookService } from '../copilot/hook-service'
import { HermesHookService } from '../hermes/hook-service'
import { DevinHookService } from '../devin/hook-service'
import { ampHookService } from '../amp/hook-service'
import { antigravityHookService } from '../antigravity/hook-service'
import { claudeHookService } from '../claude/hook-service'
import { codexHookService } from '../codex/hook-service'
import { copilotHookService } from '../copilot/hook-service'
import { droidHookService } from '../droid/hook-service'
import { devinHookService } from '../devin/hook-service'
import { grokHookService } from '../grok/hook-service'
import { hermesHookService } from '../hermes/hook-service'
import { MANAGED_AGENT_HOOK_INSTALLERS } from './managed-agent-hook-controls'
import {
  installRemoteManagedAgentHooks,
  REMOTE_MANAGED_HOOK_INSTALLER_AGENTS
} from './remote-managed-hook-installers'

type FakeFs = {
  files: Map<string, string>
  dirs: Set<string>
  modes: Map<string, number>
  failRenameTo: Set<string>
}

function createFakeSftp(initialFiles: Record<string, string> = {}): {
  sftp: SFTPWrapper
  fs: FakeFs
} {
  const fs: FakeFs = {
    files: new Map(Object.entries(initialFiles)),
    dirs: new Set(['/']),
    modes: new Map(),
    failRenameTo: new Set()
  }
  const noEntryError = (path: string): { code: number; message: string } => ({
    code: 2,
    message: `ENOENT ${path}`
  })
  const fakeStats = (mode: number): { mode: number } => ({ mode })

  const sftp = {
    readFile: (path: string, _enc: string, cb: (err: unknown, data?: string) => void): void => {
      const v = fs.files.get(path)
      if (v === undefined) {
        cb(noEntryError(path))
        return
      }
      cb(null, v)
    },
    writeFile: (
      path: string,
      content: string,
      options: string | { mode?: number },
      cb: (err: unknown) => void
    ): void => {
      fs.files.set(path, content)
      if (typeof options !== 'string' && options.mode !== undefined) {
        fs.modes.set(path, options.mode)
      }
      cb(null)
    },
    rename: (src: string, dst: string, cb: (err: unknown) => void): void => {
      if (fs.failRenameTo.has(dst)) {
        cb({ code: 4, message: `rename failed ${dst}` })
        return
      }
      const v = fs.files.get(src)
      if (v === undefined) {
        cb(noEntryError(src))
        return
      }
      fs.files.set(dst, v)
      fs.files.delete(src)
      const mode = fs.modes.get(src)
      if (mode !== undefined) {
        fs.modes.set(dst, mode)
        fs.modes.delete(src)
      }
      cb(null)
    },
    unlink: (path: string, cb: (err: unknown) => void): void => {
      fs.files.delete(path)
      fs.modes.delete(path)
      cb(null)
    },
    chmod: (path: string, mode: number, cb: (err: unknown) => void): void => {
      fs.modes.set(path, mode)
      cb(null)
    },
    stat: (path: string, cb: (err: unknown, stats?: { mode: number }) => void): void => {
      if (!fs.files.has(path)) {
        cb(noEntryError(path))
        return
      }
      cb(null, fakeStats(fs.modes.get(path) ?? 0o100644))
    },
    readdir: (path: string, cb: (err: unknown, list?: { filename: string }[]) => void): void => {
      if (fs.dirs.has(path)) {
        cb(null, [])
        return
      }
      cb(noEntryError(path))
    },
    mkdir: (path: string, cb: (err: unknown) => void): void => {
      fs.dirs.add(path)
      cb(null)
    }
  } as unknown as SFTPWrapper
  return { sftp, fs }
}

describe('remote hook service installers', () => {
  it('always writes POSIX scripts for SSH remotes even from a Windows host', async () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')
    Object.defineProperty(process, 'platform', { value: 'win32' })
    try {
      const installers = [
        {
          path: '/home/dev/.orca/agent-hooks/claude-hook.sh',
          install: (sftp: SFTPWrapper) => new ClaudeHookService().installRemote(sftp, '/home/dev')
        },
        {
          path: '/home/dev/.orca/agent-hooks/codex-hook.sh',
          install: (sftp: SFTPWrapper) => new CodexHookService().installRemote(sftp, '/home/dev')
        },
        {
          path: '/home/dev/.orca/agent-hooks/antigravity-hook.sh',
          install: (sftp: SFTPWrapper) =>
            new AntigravityHookService().installRemote(sftp, '/home/dev')
        },
        {
          path: '/home/dev/.config/amp/plugins/orca-agent-status.ts',
          install: (sftp: SFTPWrapper) => new AmpHookService().installRemote(sftp, '/home/dev')
        },
        {
          path: '/home/dev/.orca/agent-hooks/grok-hook.sh',
          install: (sftp: SFTPWrapper) => new GrokHookService().installRemote(sftp, '/home/dev')
        },
        {
          path: '/home/dev/.orca/agent-hooks/copilot-hook.sh',
          install: (sftp: SFTPWrapper) => new CopilotHookService().installRemote(sftp, '/home/dev')
        },
        {
          path: '/home/dev/.orca/agent-hooks/devin-hook.sh',
          install: (sftp: SFTPWrapper) => new DevinHookService().installRemote(sftp, '/home/dev')
        },
        {
          path: '/home/dev/.orca/agent-hooks/droid-hook.sh',
          install: (sftp: SFTPWrapper) => new DroidHookService().installRemote(sftp, '/home/dev')
        }
      ]

      for (const { install, path } of installers) {
        const { sftp, fs } = createFakeSftp()
        const status = await install(sftp)
        expect(status.state).toBe('installed')
        const script = fs.files.get(path)
        if (path.includes('/.config/amp/plugins/')) {
          expect(script).toContain('/hook/amp')
          expect(script).toContain("amp.on('agent.start'")
        } else {
          expect(script).toMatch(/^#!\/bin\/sh\n/)
        }
        expect(script).not.toContain('@echo off')
        expect(script).not.toContain('powershell -NoProfile')
      }
    } finally {
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    }
  })

  it('installs remote Codex hooks with matching trust entries', async () => {
    const { sftp, fs } = createFakeSftp({
      '/home/dev/.codex/hooks.json': `${JSON.stringify({
        hooks: {},
        _managed: {
          'external-manager': {
            Stop: [0]
          }
        }
      })}\n`
    })

    const status = await new CodexHookService().installRemote(sftp, '/home/dev/')

    expect(status.state).toBe('installed')
    expect(status.configPath).toBe('/home/dev/.codex/hooks.json')
    const hooks = JSON.parse(fs.files.get('/home/dev/.codex/hooks.json')!) as {
      hooks: Record<string, { hooks: { command: string }[] }[]>
      _managed?: unknown
    }
    expect(hooks._managed).toEqual({ 'external-manager': { Stop: [0] } })
    for (const eventName of [
      'SessionStart',
      'UserPromptSubmit',
      'PreToolUse',
      'PermissionRequest',
      'PostToolUse',
      'Stop'
    ]) {
      const command = hooks.hooks[eventName]?.[0]?.hooks?.[0]?.command
      expect(command).toContain('/home/dev/.orca/agent-hooks/codex-hook.sh')
      expect(command).toMatch(/^if \[ -x /)
    }
    expect(fs.files.get('/home/dev/.orca/agent-hooks/codex-hook.sh')).toContain('#!/bin/sh')
    expect(fs.modes.get('/home/dev/.orca/agent-hooks/codex-hook.sh')).toBe(0o755)
    const toml = fs.files.get('/home/dev/.codex/config.toml')
    expect(toml).toContain('/home/dev/.codex/hooks.json:permission_request:0:0')
    expect(toml).toContain('trusted_hash = "sha256:')
  })

  it('reports Codex trust-write failures without rolling back installed hooks', async () => {
    const { sftp, fs } = createFakeSftp()
    fs.failRenameTo.add('/home/dev/.codex/config.toml')

    const status = await new CodexHookService().installRemote(sftp, '/home/dev')

    expect(status.state).toBe('error')
    expect(status.managedHooksPresent).toBe(true)
    expect(status.detail).toContain('trust entries could not be written')
    expect(fs.files.get('/home/dev/.codex/hooks.json')).toContain('codex-hook.sh')
    expect(fs.files.get('/home/dev/.orca/agent-hooks/codex-hook.sh')).toContain('#!/bin/sh')
  })

  it('does not overwrite malformed remote Devin JSONC', async () => {
    const original = '{"hooks": }'
    const { sftp, fs } = createFakeSftp({
      '/home/dev/.config/devin/config.json': original
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const status = await new DevinHookService().installRemote(sftp, '/home/dev')

      expect(status).toMatchObject({
        agent: 'devin',
        state: 'error',
        configPath: '/home/dev/.config/devin/config.json',
        managedHooksPresent: false,
        detail: 'Could not parse remote Devin config.json'
      })
      expect(fs.files.get('/home/dev/.config/devin/config.json')).toBe(original)
      expect(fs.files.get('/home/dev/.orca/agent-hooks/devin-hook.sh')).toBeUndefined()
    } finally {
      warn.mockRestore()
    }
  })

  it('removes stale remote Antigravity PreToolUse hooks while installing SSH hooks', async () => {
    const { sftp, fs } = createFakeSftp()
    fs.files.set(
      '/home/dev/.gemini/config/hooks.json',
      `${JSON.stringify(
        {
          'orca-status': {
            PreToolUse: [
              {
                matcher: '*',
                hooks: [
                  {
                    type: 'command',
                    command: '/tmp/old/agent-hooks/antigravity-hook.sh'
                  }
                ]
              }
            ],
            PostToolUse: [
              {
                matcher: '*',
                hooks: [
                  {
                    type: 'command',
                    command: 'echo user-authored'
                  }
                ]
              }
            ]
          }
        },
        null,
        2
      )}\n`
    )

    await new AntigravityHookService().installRemote(sftp, '/home/dev')

    const config = JSON.parse(fs.files.get('/home/dev/.gemini/config/hooks.json')!) as {
      'orca-status': Record<string, { hooks?: { command: string }[] }[]>
    }
    expect(config['orca-status'].PreToolUse).toBeUndefined()
    const postToolCommands = config['orca-status'].PostToolUse.flatMap((definition) =>
      (definition.hooks ?? []).map((hook) => hook.command)
    )
    expect(postToolCommands).toContain('echo user-authored')
    expect(postToolCommands.some((command) => command.includes('antigravity-hook.sh'))).toBe(true)
  })

  it('installs remote Copilot hooks under the user-level hooks directory', async () => {
    const { sftp, fs } = createFakeSftp()
    fs.dirs.add('/home/dev/.copilot')
    fs.dirs.add('/home/dev/.copilot/hooks')
    fs.files.set(
      '/home/dev/.copilot/hooks/orca.json',
      JSON.stringify({
        version: 99,
        disableAllHooks: true,
        hooks: {}
      })
    )

    const status = await new CopilotHookService().installRemote(sftp, '/home/dev/')

    expect(status.state).toBe('installed')
    expect(status.configPath).toBe('/home/dev/.copilot/hooks/orca.json')
    const config = JSON.parse(fs.files.get('/home/dev/.copilot/hooks/orca.json')!) as {
      version: number
      disableAllHooks?: boolean
      hooks: Record<string, { bash?: string; timeoutSec?: number }[]>
    }
    expect(config.version).toBe(1)
    for (const eventName of [
      'SessionStart',
      'SessionEnd',
      'UserPromptSubmit',
      'PreToolUse',
      'PostToolUse',
      'PostToolUseFailure',
      'subagentStart',
      'SubagentStop',
      'PreCompact',
      'Stop',
      'ErrorOccurred',
      'PermissionRequest',
      'Notification'
    ]) {
      const definition = config.hooks[eventName]?.[0]
      expect(definition?.bash).toContain('/home/dev/.orca/agent-hooks/copilot-hook.sh')
      expect(definition?.bash).toContain(`ORCA_COPILOT_HOOK_EVENT='${eventName}'`)
      expect(definition?.timeoutSec).toBe(5)
    }
    expect(config.disableAllHooks).toBeUndefined()
    expect(fs.files.get('/home/dev/.orca/agent-hooks/copilot-hook.sh')).toContain('#!/bin/sh')
    expect(fs.modes.get('/home/dev/.orca/agent-hooks/copilot-hook.sh')).toBe(0o755)
  })

  // Why: Droid (and Copilot) each shipped a working installRemote but were never
  // registered in REMOTE_MANAGED_HOOK_INSTALLERS, so their status silently never
  // appeared over SSH (issue #7253). Guard the whole bug class, not one agent:
  // every locally-managed hook service that implements installRemote MUST be
  // wired into the remote installer.
  it('registers every managed agent that implements installRemote in the remote installer (issue #7253)', () => {
    const servicesByAgent = new Map<string, { installRemote?: unknown }>([
      ['claude', claudeHookService],
      ['codex', codexHookService],
      ['antigravity', antigravityHookService],
      ['amp', ampHookService],
      ['droid', droidHookService],
      ['grok', grokHookService],
      ['copilot', copilotHookService],
      ['hermes', hermesHookService],
      ['devin', devinHookService]
    ])

    // Guard against a service silently missing from the map above as new agents land.
    for (const [agent] of MANAGED_AGENT_HOOK_INSTALLERS) {
      expect(servicesByAgent.has(agent)).toBe(true)
    }

    const registered = new Set<string>(REMOTE_MANAGED_HOOK_INSTALLER_AGENTS)
    const missing: string[] = []
    for (const [agent, service] of servicesByAgent) {
      if (typeof service.installRemote === 'function' && !registered.has(agent)) {
        missing.push(agent)
      }
    }
    expect(missing).toEqual([])
  })

  it('installs Droid and Copilot when running the aggregate remote installer (issue #7253)', async () => {
    const { sftp } = createFakeSftp()
    const results = await installRemoteManagedAgentHooks(sftp, '/home/dev')
    const byAgent = new Map(results.map((r) => [r.agent, r.state]))
    expect(byAgent.get('droid')).toBe('installed')
    expect(byAgent.get('copilot')).toBe('installed')
  })

  it('installs remote Droid hooks into Factory settings.json (issue #7253)', async () => {
    const { sftp, fs } = createFakeSftp()

    const status = await new DroidHookService().installRemote(sftp, '/home/dev')

    expect(status.state).toBe('installed')
    expect(status.configPath).toBe('/home/dev/.factory/settings.json')
    const config = JSON.parse(fs.files.get('/home/dev/.factory/settings.json')!) as {
      hooks: Record<string, { matcher?: string; hooks?: { command: string }[] }[]>
    }
    for (const eventName of [
      'SessionStart',
      'UserPromptSubmit',
      'Stop',
      'SubagentStop',
      'PreToolUse',
      'PostToolUse',
      'PermissionRequest',
      'Notification'
    ]) {
      const definition = config.hooks[eventName]?.[0]
      const command = definition?.hooks?.[0]?.command
      expect(command).toContain('/home/dev/.orca/agent-hooks/droid-hook.sh')
      expect(command).toMatch(/^if \[ -x /)
    }
    // Tool/permission events carry a `*` matcher; lifecycle events do not.
    expect(config.hooks.PreToolUse?.[0]?.matcher).toBe('*')
    expect(config.hooks.PostToolUse?.[0]?.matcher).toBe('*')
    expect(config.hooks.PermissionRequest?.[0]?.matcher).toBe('*')
    expect(config.hooks.Stop?.[0]?.matcher).toBeUndefined()
    const script = fs.files.get('/home/dev/.orca/agent-hooks/droid-hook.sh')
    expect(script).toContain('#!/bin/sh')
    expect(script).toContain('/hook/droid')
    expect(fs.modes.get('/home/dev/.orca/agent-hooks/droid-hook.sh')).toBe(0o755)
  })

  it('does not overwrite a malformed remote Factory settings.json', async () => {
    const original = '{"hooks": }'
    const { sftp, fs } = createFakeSftp({
      '/home/dev/.factory/settings.json': original
    })

    const status = await new DroidHookService().installRemote(sftp, '/home/dev')

    expect(status).toMatchObject({
      agent: 'droid',
      state: 'error',
      configPath: '/home/dev/.factory/settings.json',
      managedHooksPresent: false,
      detail: 'Could not parse remote Factory settings.json'
    })
    expect(fs.files.get('/home/dev/.factory/settings.json')).toBe(original)
    expect(fs.files.get('/home/dev/.orca/agent-hooks/droid-hook.sh')).toBeUndefined()
  })

  it('installs remote Hermes plugin files and enables the plugin', async () => {
    const { sftp, fs } = createFakeSftp()

    const status = await new HermesHookService().installRemote(sftp, '/home/dev')

    expect(status.state).toBe('installed')
    expect(status.configPath).toBe('/home/dev/.hermes/config.yaml')
    expect(fs.files.get('/home/dev/.hermes/plugins/orca-status/plugin.yaml')).toContain(
      'pre_llm_call'
    )
    expect(fs.files.get('/home/dev/.hermes/plugins/orca-status/__init__.py')).toContain(
      '/hook/hermes'
    )
    expect(fs.files.get('/home/dev/.hermes/config.yaml')).toContain('orca-status')
  })

  it('does not overwrite a remote user-authored Amp plugin file', async () => {
    const { sftp, fs } = createFakeSftp({
      '/home/dev/.config/amp/plugins/orca-agent-status.ts':
        'export default function userPlugin() {}\n'
    })

    const status = await new AmpHookService().installRemote(sftp, '/home/dev/')

    expect(status).toMatchObject({
      agent: 'amp',
      state: 'partial',
      managedHooksPresent: false
    })
    expect(fs.files.get('/home/dev/.config/amp/plugins/orca-agent-status.ts')).toBe(
      'export default function userPlugin() {}\n'
    )
  })
})
