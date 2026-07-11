import { readShellStartupEnvVar } from '../main/pty/shell-startup-env'
import type { PiAgentKind } from '../shared/pi-agent-kind'

function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  return values.find((value) => typeof value === 'string' && value.length > 0)
}

function readStartupEnv(
  name: string,
  env: Record<string, string>,
  shell: string | undefined
): string | undefined {
  return readShellStartupEnvVar(name, env.HOME ?? process.env.HOME, shell ?? env.SHELL)
}

export function resolveOpenCodeSourceConfigDir(
  env: Record<string, string>,
  shell: string | undefined
): string | undefined {
  return firstNonEmpty(
    env.ORCA_OPENCODE_SOURCE_CONFIG_DIR,
    readStartupEnv('OPENCODE_CONFIG_DIR', env, shell),
    env.OPENCODE_CONFIG_DIR
  )
}

export function resolvePiSourceAgentDir(
  env: Record<string, string>,
  shell: string | undefined,
  _kind: PiAgentKind = 'pi'
): string | undefined {
  const sourceDir = firstNonEmpty(env.ORCA_PI_SOURCE_AGENT_DIR)
  if (sourceDir) {
    return sourceDir
  }

  const startupDir = readStartupEnv('PI_CODING_AGENT_DIR', env, shell)
  if (startupDir) {
    return startupDir
  }

  // Why: skip remirroring when PI_CODING_AGENT_DIR is another PTY's overlay
  // shadow; default to Pi's own home instead.
  if (
    env.PI_CODING_AGENT_DIR &&
    env.PI_CODING_AGENT_DIR !== env.ORCA_PI_CODING_AGENT_DIR &&
    env.PI_CODING_AGENT_DIR !== env.ORCA_OMP_CODING_AGENT_DIR
  ) {
    return env.PI_CODING_AGENT_DIR
  }
  return undefined
}
