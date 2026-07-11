import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import type * as osModule from 'node:os'
import { join } from 'node:path'

// The service calls app.getPath('userData') for its overlay root. Point that
// at a real tmp dir so we can exercise the filesystem behavior end-to-end.
const userDataDir = mkdtempSync(join(tmpdir(), 'orca-pi-test-userdata-'))

// Why: getDefaultPiAgentDir() inside titlebar-extension-service reads
// homedir() from 'os'. Route the lookup through a mutable holder so tests
// can point it at a controlled tmp dir.
const homedirOverride = vi.hoisted(() => ({ current: '' as string }))

vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof osModule>()
  return {
    ...actual,
    homedir: () => homedirOverride.current || actual.homedir()
  }
})

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => {
      if (name === 'userData') {
        return userDataDir
      }
      throw new Error(`unexpected app.getPath(${name})`)
    }
  }
}))

import { PiTitlebarExtensionService, isSafeDescendCandidate } from './titlebar-extension-service'

function legacyOverlayPath(ptyId: string): string {
  return join(userDataDir, 'pi-agent-overlays', ptyId)
}

describe('PiTitlebarExtensionService', () => {
  let piHome: string

  beforeEach(() => {
    piHome = mkdtempSync(join(tmpdir(), 'orca-pi-test-pihome-'))
    // Seed a realistic Pi agent dir with skills, extensions, auth, sessions.
    mkdirSync(join(piHome, 'skills', 'my-skill', 'nested'), { recursive: true })
    writeFileSync(join(piHome, 'skills', 'my-skill', 'SKILL.md'), 'critical user skill')
    writeFileSync(join(piHome, 'skills', 'my-skill', 'nested', 'data.txt'), 'nested data')
    mkdirSync(join(piHome, 'extensions', 'user-ext'), { recursive: true })
    writeFileSync(join(piHome, 'extensions', 'user-ext', 'ext.ts'), 'user extension')
    mkdirSync(join(piHome, 'sessions'), { recursive: true })
    writeFileSync(join(piHome, 'sessions', 'session-1.json'), '{}')
    writeFileSync(join(piHome, 'auth.json'), 'secret token')
    writeFileSync(
      join(piHome, 'settings.json'),
      JSON.stringify({
        defaultProvider: 'amazon-bedrock',
        hideThinkingBlock: false,
        packages: ['npm:pi-web-access'],
        terminal: {
          showImages: false,
          clearOnShrink: false
        }
      })
    )
  })

  afterEach(() => {
    rmSync(piHome, { recursive: true, force: true })
    rmSync(join(userDataDir, 'pi-agent-overlays'), { recursive: true, force: true })
    rmSync(join(userDataDir, 'omp-agent-overlays'), { recursive: true, force: true })
  })

  function expectPiHomeIntact(): void {
    expect(readFileSync(join(piHome, 'auth.json'), 'utf-8')).toBe('secret token')
    expect(readFileSync(join(piHome, 'skills', 'my-skill', 'SKILL.md'), 'utf-8')).toBe(
      'critical user skill'
    )
    expect(readFileSync(join(piHome, 'skills', 'my-skill', 'nested', 'data.txt'), 'utf-8')).toBe(
      'nested data'
    )
    expect(readFileSync(join(piHome, 'extensions', 'user-ext', 'ext.ts'), 'utf-8')).toBe(
      'user extension'
    )
    expect(readFileSync(join(piHome, 'sessions', 'session-1.json'), 'utf-8')).toBe('{}')
    expect(JSON.parse(readFileSync(join(piHome, 'settings.json'), 'utf-8'))).toEqual({
      defaultProvider: 'amazon-bedrock',
      hideThinkingBlock: false,
      packages: ['npm:pi-web-access'],
      terminal: {
        showImages: false,
        clearOnShrink: false
      }
    })
  }

  it('buildPtyEnv installs Orca extensions into the user agent dir without redirecting the home', () => {
    const svc = new PiTitlebarExtensionService()
    const env = svc.buildPtyEnv('pty-1', piHome, 'pi')

    expect(env.PI_CODING_AGENT_DIR).toBeUndefined()
    expect(env.ORCA_PI_SOURCE_AGENT_DIR).toBe(piHome)
    const extensions = readdirSync(join(piHome, 'extensions')).sort()
    expect(extensions).toEqual([
      'orca-agent-status.ts',
      'orca-prefill.ts',
      'orca-titlebar-spinner.ts',
      'user-ext'
    ])
    const statusExtensionSource = readFileSync(
      join(piHome, 'extensions', 'orca-agent-status.ts'),
      'utf-8'
    )
    const titlebarExtensionSource = readFileSync(
      join(piHome, 'extensions', 'orca-titlebar-spinner.ts'),
      'utf-8'
    )
    const prefillExtensionSource = readFileSync(
      join(piHome, 'extensions', 'orca-prefill.ts'),
      'utf-8'
    )
    expect(statusExtensionSource).toContain('@orca-managed-pi-extension')
    expect(statusExtensionSource).toContain('/hook/pi')
    expect(titlebarExtensionSource).toContain('@orca-managed-pi-extension')
    expect(titlebarExtensionSource).toContain('process.env.ORCA_PANE_KEY')
    expect(prefillExtensionSource).toContain('@orca-managed-pi-extension')
    expect(prefillExtensionSource).toContain('process.env.ORCA_PANE_KEY')
    expectPiHomeIntact()
  })

  it('clearPty leaves the real Pi dir and managed extensions intact', () => {
    const svc = new PiTitlebarExtensionService()
    svc.buildPtyEnv('pty-2', piHome, 'pi')
    svc.clearPty('pty-2')

    expect(existsSync(join(piHome, 'extensions', 'orca-agent-status.ts'))).toBe(true)
    expectPiHomeIntact()
  })

  it('uses the same source dir for multiple PTYs with the same Pi dir', () => {
    const svc = new PiTitlebarExtensionService()
    const firstEnv = svc.buildPtyEnv('pty-shared-1', piHome, 'pi')
    const secondEnv = svc.buildPtyEnv('pty-shared-2', piHome, 'pi')

    expect(firstEnv.PI_CODING_AGENT_DIR).toBeUndefined()
    expect(secondEnv.PI_CODING_AGENT_DIR).toBeUndefined()
    expect(secondEnv.ORCA_PI_SOURCE_AGENT_DIR).toBe(firstEnv.ORCA_PI_SOURCE_AGENT_DIR)
    expect(readFileSync(join(piHome, 'extensions', 'user-ext', 'ext.ts'), 'utf-8')).toBe(
      'user extension'
    )
    expectPiHomeIntact()
  })

  it('rebuilding managed extensions for the same ptyId does not corrupt the user Pi dir', () => {
    const svc = new PiTitlebarExtensionService()
    svc.buildPtyEnv('pty-3', piHome, 'pi')
    svc.buildPtyEnv('pty-3', piHome, 'pi')
    svc.buildPtyEnv('pty-3', piHome, 'pi')
    expectPiHomeIntact()
  })

  it('rebuilding updates Orca-owned extensions while preserving user files', () => {
    const svc = new PiTitlebarExtensionService()
    svc.buildPtyEnv('pty-refresh-1', piHome, 'pi')
    writeFileSync(
      join(piHome, 'extensions', 'orca-agent-status.ts'),
      '// @orca-managed-pi-extension\nstale'
    )

    rmSync(join(piHome, 'extensions', 'user-ext'), { recursive: true, force: true })
    mkdirSync(join(piHome, 'extensions', 'new-ext'), { recursive: true })
    writeFileSync(join(piHome, 'extensions', 'new-ext', 'ext.ts'), 'new user extension')
    writeFileSync(join(piHome, 'auth.json'), 'rotated token')

    const secondEnv = svc.buildPtyEnv('pty-refresh-2', piHome, 'pi')

    expect(secondEnv.PI_CODING_AGENT_DIR).toBeUndefined()
    expect(readFileSync(join(piHome, 'extensions', 'orca-agent-status.ts'), 'utf-8')).toContain(
      '/hook/pi'
    )
    expect(readFileSync(join(piHome, 'auth.json'), 'utf-8')).toBe('rotated token')
    expect(readFileSync(join(piHome, 'extensions', 'new-ext', 'ext.ts'), 'utf-8')).toBe(
      'new user extension'
    )
  })

  it("does not overwrite a user's same-named Orca extension file", () => {
    const userStatusExtension = 'user-owned status extension'
    writeFileSync(join(piHome, 'extensions', 'orca-agent-status.ts'), userStatusExtension, 'utf-8')

    const svc = new PiTitlebarExtensionService()
    const env = svc.buildPtyEnv('pty-same-name-extension', piHome, 'pi')

    expect(env.PI_CODING_AGENT_DIR).toBeUndefined()
    expect(readFileSync(join(piHome, 'extensions', 'orca-agent-status.ts'), 'utf-8')).toBe(
      userStatusExtension
    )
    expectPiHomeIntact()
  })

  it.skipIf(process.platform === 'win32')(
    'writes bundled extensions through a symlinked user extensions dir',
    () => {
      const realExtensionsDir = mkdtempSync(join(tmpdir(), 'orca-real-pi-extensions-'))
      try {
        writeFileSync(join(realExtensionsDir, 'real-user-ext.ts'), 'real user extension')
        rmSync(join(piHome, 'extensions'), { recursive: true, force: true })
        symlinkSync(realExtensionsDir, join(piHome, 'extensions'), 'dir')

        const svc = new PiTitlebarExtensionService()
        const env = svc.buildPtyEnv('pty-symlinked-extensions', piHome, 'pi')

        expect(env.PI_CODING_AGENT_DIR).toBeUndefined()
        expect(existsSync(join(realExtensionsDir, 'orca-agent-status.ts'))).toBe(true)
        expect(existsSync(join(realExtensionsDir, 'orca-prefill.ts'))).toBe(true)
        expect(existsSync(join(realExtensionsDir, 'orca-titlebar-spinner.ts'))).toBe(true)
        expect(readFileSync(join(realExtensionsDir, 'orca-agent-status.ts'), 'utf-8')).toContain(
          '/hook/pi'
        )
      } finally {
        rmSync(realExtensionsDir, { recursive: true, force: true })
      }
    }
  )

  it.skipIf(process.platform === 'win32')(
    'safely handles a pre-existing stale overlay with dangling symlinks',
    () => {
      const legacyOverlayDir = legacyOverlayPath('pty-4')
      mkdirSync(legacyOverlayDir, { recursive: true })
      symlinkSync('/nonexistent-pi-target/skills', join(legacyOverlayDir, 'skills'), 'dir')
      symlinkSync('/nonexistent-pi-target/auth.json', join(legacyOverlayDir, 'auth.json'), 'file')

      const svc = new PiTitlebarExtensionService()
      const env = svc.buildPtyEnv('pty-4', piHome, 'pi')

      expect(env.PI_CODING_AGENT_DIR).toBeUndefined()
      expect(env.ORCA_PI_SOURCE_AGENT_DIR).toBe(piHome)
      expect(existsSync(legacyOverlayDir)).toBe(false)
      expectPiHomeIntact()
    }
  )

  it('defaults to ~/.pi/agent when no existing agent dir is provided', () => {
    const fakeHome = mkdtempSync(join(tmpdir(), 'orca-pi-homedir-'))
    try {
      homedirOverride.current = fakeHome
      const svc = new PiTitlebarExtensionService()
      const env = svc.buildPtyEnv('pty-default-pi', undefined, 'pi')
      const expected = join(fakeHome, '.pi', 'agent')
      expect(env.ORCA_PI_SOURCE_AGENT_DIR).toBe(expected)
      expect(existsSync(join(expected, 'extensions', 'orca-agent-status.ts'))).toBe(true)
    } finally {
      homedirOverride.current = ''
      rmSync(fakeHome, { recursive: true, force: true })
    }
  })

  describe('isSafeDescendCandidate (Windows junction regression guard)', () => {
    it('rejects a Windows directory junction (symlink + directory both true)', () => {
      const junctionLike = {
        isSymbolicLink: () => true,
        isDirectory: () => true
      }
      expect(isSafeDescendCandidate(junctionLike)).toBe(false)
    })

    it('rejects a plain symlink', () => {
      expect(isSafeDescendCandidate({ isSymbolicLink: () => true, isDirectory: () => false })).toBe(
        false
      )
    })

    it('rejects a regular file', () => {
      expect(
        isSafeDescendCandidate({ isSymbolicLink: () => false, isDirectory: () => false })
      ).toBe(false)
    })

    it('accepts a true directory (non-symlink)', () => {
      expect(isSafeDescendCandidate({ isSymbolicLink: () => false, isDirectory: () => true })).toBe(
        true
      )
    })
  })

  it('refuses to remove anything outside the overlay root', () => {
    // Why: hard guard against a misresolved overlay path (regression defense).
    const svc = new PiTitlebarExtensionService() as unknown as {
      safeRemoveOverlay: (p: string, overlayRoot: string) => void
    }
    const piRoot = join(userDataDir, 'pi-agent-overlays')
    const ompRoot = join(userDataDir, 'omp-agent-overlays')
    svc.safeRemoveOverlay(piHome, piRoot)
    svc.safeRemoveOverlay(piHome, ompRoot)
    svc.safeRemoveOverlay('/', piRoot)
    svc.safeRemoveOverlay(piRoot, piRoot)
    svc.safeRemoveOverlay(ompRoot, ompRoot)
    expectPiHomeIntact()
  })
})
