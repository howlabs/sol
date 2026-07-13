import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync
} from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { app } from 'electron'

const MANAGED_GROK_HOME_MARKER = '.orca-managed-grok-home'

export function getGrokManagedAccountsRoot(): string {
  return join(app.getPath('userData'), 'grok-accounts')
}

export function getManagedGrokHomePath(accountId: string): string {
  return join(getGrokManagedAccountsRoot(), accountId)
}

export function createManagedGrokHome(accountId: string): string {
  const homePath = getManagedGrokHomePath(accountId)
  mkdirSync(homePath, { recursive: true })
  const markerPath = join(homePath, MANAGED_GROK_HOME_MARKER)
  if (!existsSync(markerPath)) {
    writeFileSync(markerPath, `${accountId}\n`, { encoding: 'utf-8', mode: 0o600, flag: 'wx' })
  }
  return homePath
}

export function resolveOwnedManagedGrokHome(
  accountId: string,
  candidatePath: string
): string | null {
  const rootPath = getGrokManagedAccountsRoot()
  const resolvedCandidate = resolve(candidatePath)
  if (!existsSync(resolvedCandidate) || !existsSync(rootPath)) {
    return null
  }
  try {
    if (lstatSync(resolvedCandidate).isSymbolicLink()) {
      return null
    }
    const canonicalCandidate = realpathSync(resolvedCandidate)
    const canonicalRoot = realpathSync(rootPath)
    if (
      canonicalCandidate === canonicalRoot ||
      !canonicalCandidate.startsWith(canonicalRoot + sep)
    ) {
      return null
    }
    const relativePath = relative(canonicalRoot, canonicalCandidate)
    const escaped = relativePath.startsWith('..') || relativePath.includes(`..${sep}`)
    if (escaped || relativePath !== accountId) {
      return null
    }
    const markerPath = join(canonicalCandidate, MANAGED_GROK_HOME_MARKER)
    if (!isManagedGrokHomeMarkerValid(markerPath, accountId)) {
      return null
    }
    return canonicalCandidate
  } catch {
    return null
  }
}

function isManagedGrokHomeMarkerValid(markerPath: string, accountId: string): boolean {
  try {
    if (
      !existsSync(markerPath) ||
      lstatSync(markerPath).isSymbolicLink() ||
      !lstatSync(markerPath).isFile()
    ) {
      return false
    }
    return readFileSync(markerPath, 'utf-8').trim() === accountId
  } catch {
    return false
  }
}
