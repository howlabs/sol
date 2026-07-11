import { spawn } from 'node:child_process'
import type { GrokDeviceCodeInfo } from '../../shared/types'
import { resolveCliCommand } from '../codex-cli/command'

const LOGIN_TIMEOUT_MS = 300_000
const MAX_COMMAND_OUTPUT_CHARS = 8_000

/**
 * Runs `grok login --device-auth` with GROK_HOME pointed at the managed dir.
 * Resolves on exit code 0, rejects on error/timeout/cancel. Streams device-code
 * URL + user code to `onDeviceCode` as soon as they appear in stdout/stderr.
 */
export function runGrokLogin(
  grokHomePath: string,
  onDeviceCode?: (info: GrokDeviceCodeInfo) => void,
  cancelSignal?: AbortSignal
): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const command = resolveCliCommand('grok')
    const child = spawn(command, ['login', '--device-auth'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        GROK_HOME: grokHomePath
      },
      detached: process.platform !== 'win32'
    })

    const stdout = child.stdout
    const stderr = child.stderr
    if (!stdout || !stderr) {
      child.kill()
      rejectPromise(new Error('Grok login failed to open output streams.'))
      return
    }

    let settled = false
    let output = ''
    let deviceCodeSent = false

    const appendOutput = (chunk: Buffer): void => {
      output = `${output}${chunk.toString()}`
      if (output.length > MAX_COMMAND_OUTPUT_CHARS) {
        output = output.slice(-MAX_COMMAND_OUTPUT_CHARS)
      }
      if (!deviceCodeSent && onDeviceCode) {
        const info = extractDeviceCodeInfo(output)
        if (info) {
          deviceCodeSent = true
          onDeviceCode(info)
        }
      }
    }

    let timeout: ReturnType<typeof setTimeout> | null = null
    const cleanupListeners = (): void => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      stdout.off('data', appendOutput)
      stderr.off('data', appendOutput)
      child.off('error', onError)
      child.off('close', onClose)
      cancelSignal?.removeEventListener('abort', onAbort)
    }
    const settle = (callback: () => void): void => {
      if (settled) {
        return
      }
      settled = true
      cleanupListeners()
      callback()
    }
    const killChild = (): void => {
      if (process.platform === 'win32' && child.pid) {
        const taskkill = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
          stdio: 'ignore',
          windowsHide: true
        })
        taskkill.on('error', () => {})
        taskkill.unref()
        return
      }
      if (process.platform !== 'win32' && child.pid) {
        try {
          process.kill(-child.pid)
          return
        } catch {
          // Fall back to direct child kill if the process group is unavailable.
        }
      }
      child.kill()
    }
    timeout = setTimeout(() => {
      killChild()
      settle(() => rejectPromise(new Error('Grok sign-in took too long to finish.')))
    }, LOGIN_TIMEOUT_MS)

    const onAbort = (): void => {
      killChild()
      settle(() => rejectPromise(new Error('Grok sign-in was cancelled.')))
    }
    const onError = (error: Error): void => {
      settle(() => rejectPromise(error))
    }
    const onClose = (code: number | null): void => {
      settle(() => {
        if (code === 0) {
          resolvePromise()
          return
        }
        const trimmedOutput = output.trim()
        rejectPromise(
          new Error(
            trimmedOutput
              ? `Grok login failed: ${trimmedOutput}`
              : `Grok login exited with code ${code ?? 'unknown'}.`
          )
        )
      })
    }

    stdout.on('data', appendOutput)
    stderr.on('data', appendOutput)
    child.on('error', onError)
    child.on('close', onClose)
    if (cancelSignal?.aborted) {
      onAbort()
    } else {
      cancelSignal?.addEventListener('abort', onAbort, { once: true })
    }
  })
}

function extractDeviceCodeInfo(output: string): GrokDeviceCodeInfo | null {
  const urlMatch = output.match(/https?:\/\/[^\s]+\/oauth2\/device\?user_code=[^\s]+/)
  const codeMatch = output.match(/^[ \t]*([A-Z0-9]{4}-[A-Z0-9]{4})[ \t]*$/m)
  if (urlMatch && codeMatch) {
    return { url: urlMatch[0], userCode: codeMatch[1] }
  }
  return null
}
