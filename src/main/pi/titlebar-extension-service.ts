import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { app } from 'electron'
import { createHash } from 'node:crypto'
import {
  ORCA_PI_AGENT_STATUS_EXTENSION_FILE,
  getPiAgentStatusExtensionSource
} from './agent-status-extension-source'
import {
  ORCA_PI_PREFILL_EXTENSION_FILE,
  getPiPrefillExtensionSource
} from './prefill-extension-source'
export { ORCA_PI_PREFILL_ENV_VAR } from './prefill-extension-source'
import { ORCA_PI_EXTENSION_FILE, getPiTitlebarExtensionSource } from './titlebar-extension-source'
import {
  isSafeDescendCandidate as sharedIsSafeDescendCandidate,
  safeRemoveOverlay
} from '../pty/overlay-mirror'
import type { PiAgentKind } from '../../shared/pi-agent-kind'

// Why: the Pi test suite imports `isSafeDescendCandidate` from this module's
// public surface to lock in the Windows-junction ordering invariant against
// future refactors. Re-export the shared implementation so the test contract
// keeps holding after the helper moved to src/main/pty/overlay-mirror.ts.
export const isSafeDescendCandidate = sharedIsSafeDescendCandidate

const PI_AGENT_SUBDIR = 'agent'
const ORCA_MANAGED_EXTENSION_MARKER = '@orca-managed-pi-extension'
// Why: keep the legacy OMP overlay root name so upgrade cleanup can still
// remove stale PTY-scoped dirs after OMP was dropped from the catalog.
const LEGACY_OMP_OVERLAY_ROOT_DIR_NAME = 'omp-agent-overlays'

type ManagedExtensionWriteResult = 'written' | 'skipped-user-owned' | 'failed'

type PiManagedExtensionEnv = {
  extensionDir?: string
  sourceAgentDir: string
  statusExtensionPath?: string
}

const OVERLAY_ROOT_DIR_NAME: Record<PiAgentKind, string> = {
  pi: 'pi-agent-overlays'
}

const AGENT_HOME_DIR_NAME: Record<PiAgentKind, string> = {
  pi: '.pi'
}

function getDefaultPiAgentDir(kind: PiAgentKind): string {
  return join(homedir(), AGENT_HOME_DIR_NAME[kind], PI_AGENT_SUBDIR)
}

function toSafeOverlayDirName(ptyId: string): string {
  return createHash('sha256').update(ptyId).digest('hex').slice(0, 32)
}

function withOrcaManagedExtensionMarker(source: string): string {
  return source.includes(ORCA_MANAGED_EXTENSION_MARKER)
    ? source
    : `// ${ORCA_MANAGED_EXTENSION_MARKER}\n${source}`
}

export class PiTitlebarExtensionService {
  private getOverlayRoot(kind: PiAgentKind): string {
    return join(app.getPath('userData'), OVERLAY_ROOT_DIR_NAME[kind])
  }

  private getPtyOverlayDir(ptyId: string, kind: PiAgentKind): string {
    // Why: old Orca versions used PTY-scoped hashed overlays. Keep resolving
    // that path so new spawns/teardowns can clean stale pre-migration dirs.
    return join(this.getOverlayRoot(kind), toSafeOverlayDirName(ptyId))
  }

  private getLegacyOverlayDir(ptyId: string, kind: PiAgentKind): string {
    return join(this.getOverlayRoot(kind), ptyId)
  }

  private getLegacyOmpOverlayRoot(): string {
    return join(app.getPath('userData'), LEGACY_OMP_OVERLAY_ROOT_DIR_NAME)
  }

  // Why: overlay teardown must use the shared safeRemoveOverlay so the
  // Windows-junction guard from issue #1083 stays in lock-step across all
  // overlay consumers (Pi here, OpenCode in src/main/opencode/hook-service.ts).
  private safeRemoveOverlay(overlayDir: string, overlayRoot: string): void {
    safeRemoveOverlay(overlayDir, overlayRoot)
  }

  private canOverwriteManagedExtension(path: string): boolean {
    try {
      return readFileSync(path, 'utf8').includes(ORCA_MANAGED_EXTENSION_MARKER)
    } catch {
      return true
    }
  }

  private writeManagedExtension(path: string, source: string): ManagedExtensionWriteResult {
    if (existsSync(path) && !this.canOverwriteManagedExtension(path)) {
      return 'skipped-user-owned'
    }

    try {
      writeFileSync(path, source)
      return 'written'
    } catch {
      return 'failed'
    }
  }

  private installManagedExtensions(
    sourceAgentDir: string,
    kind: PiAgentKind
  ): PiManagedExtensionEnv {
    const extensionsDir = join(sourceAgentDir, 'extensions')
    try {
      mkdirSync(extensionsDir, { recursive: true })
    } catch {
      return { sourceAgentDir }
    }

    this.writeManagedExtension(
      join(extensionsDir, ORCA_PI_EXTENSION_FILE),
      withOrcaManagedExtensionMarker(getPiTitlebarExtensionSource())
    )
    this.writeManagedExtension(
      join(extensionsDir, ORCA_PI_PREFILL_EXTENSION_FILE),
      withOrcaManagedExtensionMarker(getPiPrefillExtensionSource(kind))
    )
    const statusExtensionPath = join(extensionsDir, ORCA_PI_AGENT_STATUS_EXTENSION_FILE)
    const statusSource = withOrcaManagedExtensionMarker(getPiAgentStatusExtensionSource(kind))
    const statusResult = this.writeManagedExtension(statusExtensionPath, statusSource)

    return {
      extensionDir: extensionsDir,
      sourceAgentDir,
      statusExtensionPath: statusResult === 'written' ? statusExtensionPath : undefined
    }
  }

  buildPtyEnv(
    ptyId: string,
    existingAgentDir: string | undefined,
    kind: PiAgentKind = 'pi'
  ): Record<string, string> {
    const sourceAgentDir = existingAgentDir || getDefaultPiAgentDir(kind)
    try {
      this.safeRemoveOverlay(this.getPtyOverlayDir(ptyId, kind), this.getOverlayRoot(kind))
      this.safeRemoveOverlay(this.getLegacyOverlayDir(ptyId, kind), this.getOverlayRoot(kind))
    } catch {
      // Why: old per-PTY overlay cleanup is best-effort; a locked stale
      // directory should not prevent the terminal from starting.
    }

    const installed = this.installManagedExtensions(sourceAgentDir, kind)
    const env: Record<string, string> = {}
    env.ORCA_PI_SOURCE_AGENT_DIR = installed.sourceAgentDir
    return env
  }

  clearPty(ptyId: string): void {
    // Why: teardown sweeps Pi + legacy OMP overlay roots; source-scoped
    // overlays stay so upgrades never delete user runtime state.
    for (const kind of Object.keys(OVERLAY_ROOT_DIR_NAME) as PiAgentKind[]) {
      try {
        this.safeRemoveOverlay(this.getPtyOverlayDir(ptyId, kind), this.getOverlayRoot(kind))
        this.safeRemoveOverlay(this.getLegacyOverlayDir(ptyId, kind), this.getOverlayRoot(kind))
      } catch {
        // Why: on Windows the overlay dir can be locked (EPERM/EBUSY) by
        // antivirus or indexers. Overlay cleanup is best-effort - a stale
        // old PTY-scoped directory in userData is harmless and will be
        // retried on the next PTY spawn/teardown.
      }
    }
    try {
      const ompRoot = this.getLegacyOmpOverlayRoot()
      this.safeRemoveOverlay(join(ompRoot, toSafeOverlayDirName(ptyId)), ompRoot)
      this.safeRemoveOverlay(join(ompRoot, ptyId), ompRoot)
    } catch {
      // Best-effort legacy OMP overlay cleanup.
    }
  }
}

export const piTitlebarExtensionService = new PiTitlebarExtensionService()
