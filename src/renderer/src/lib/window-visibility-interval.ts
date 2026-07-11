export type WindowVisibilityIntervalTimer = ReturnType<typeof setInterval>

export function isWindowVisible(): boolean {
  return (
    typeof document === 'undefined' ||
    typeof document.visibilityState === 'undefined' ||
    document.visibilityState === 'visible'
  )
}

export function installWindowVisibilityInterval(args: {
  run: () => void
  /** One-shot callback when the window becomes visible again (not on first mount). */
  runOnVisible?: () => void
  intervalMs: number
  setIntervalFn?: (callback: () => void, intervalMs: number) => WindowVisibilityIntervalTimer
  clearIntervalFn?: (handle: WindowVisibilityIntervalTimer) => void
}): () => void {
  const setIntervalFn =
    args.setIntervalFn ??
    ((callback: () => void, intervalMs: number): WindowVisibilityIntervalTimer =>
      setInterval(callback, intervalMs))
  const clearIntervalFn =
    args.clearIntervalFn ?? ((handle: WindowVisibilityIntervalTimer): void => clearInterval(handle))
  let intervalId: WindowVisibilityIntervalTimer | null = null
  let wasVisible = isWindowVisible()

  const stop = (): void => {
    if (!intervalId) {
      return
    }
    clearIntervalFn(intervalId)
    intervalId = null
  }
  const start = (options?: { runImmediately?: boolean }): void => {
    if (intervalId || !isWindowVisible()) {
      return
    }
    // Why: first mount uses the caller's interval via `run`; a later
    // hidden→visible transition can run a different one-shot (e.g. force scan)
    // without restarting the steady cadence twice.
    if (options?.runImmediately !== false) {
      args.run()
    }
    // Why: many callers shell out or cross IPC. Keep their interval alive only
    // while Orca can present the refreshed data, but still refresh a visible
    // unfocused window so status UI does not go stale on a second display.
    intervalId = setIntervalFn(args.run, args.intervalMs)
  }
  const reconcile = (): void => {
    const visible = isWindowVisible()
    if (visible) {
      if (!wasVisible && args.runOnVisible) {
        // Why: only fire runOnVisible on a real hidden→visible edge, not on the
        // initial mount path (start() already ran once below).
        args.runOnVisible()
        start({ runImmediately: false })
      } else {
        start()
      }
    } else {
      stop()
    }
    wasVisible = visible
  }

  start()
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', reconcile)
  }
  return () => {
    stop()
    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', reconcile)
    }
  }
}
