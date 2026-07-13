import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AiVaultScanIssue } from '../../shared/ai-vault-types'
import { discoverFiles } from './session-scanner-discovery'
import type { AiVaultScanOptions, SessionFileDiscovery } from './session-scanner-types'

const DROID_SESSIONS_DIR = join(homedir(), '.factory', 'sessions')

export function droidDiscoveries(
  options: AiVaultScanOptions,
  wslHomeDirs: readonly string[],
  limit: number,
  issues: AiVaultScanIssue[]
): Promise<SessionFileDiscovery>[] {
  return [
    ...sessionRootDirs(options.droidSessionsDir ?? DROID_SESSIONS_DIR, wslHomeDirs, [
      '.factory',
      'sessions'
    ]),
    ...sessionRootDirs(
      options.droidProjectsDir ?? join(homedir(), '.factory', 'projects'),
      wslHomeDirs,
      ['.factory', 'projects']
    )
  ].map((rootDir) =>
    discoverFiles({ rootDir, limit, agent: 'droid', issues, extensions: ['.jsonl'] })
  )
}

function sessionRootDirs(
  hostRootDir: string,
  wslHomeDirs: readonly string[],
  segments: readonly string[]
): string[] {
  return [hostRootDir, ...wslHomeDirs.map((homeDir) => join(homeDir, ...segments))]
}
