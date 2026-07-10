import { useEffect } from 'react'

// Base UI uses data-open; keep data-state=open for any residual Radix-era markup.
const ACTIVE_MODAL_SELECTOR = [
  '[data-slot="dialog-content"][data-open]',
  '[data-slot="dialog-content"][data-state="open"]',
  '[data-slot="dialog-overlay"][data-open]',
  '[data-slot="dialog-overlay"][data-state="open"]',
  '[data-slot="sheet-content"][data-open]',
  '[data-slot="sheet-content"][data-state="open"]',
  '[data-slot="sheet-overlay"][data-open]',
  '[data-slot="sheet-overlay"][data-state="open"]'
].join(',')

function hasActiveModal(): boolean {
  return document.querySelector(ACTIVE_MODAL_SELECTOR) !== null
}

function clearStaleBodyPointerEvents(): void {
  if (document.body.style.pointerEvents !== 'none' || hasActiveModal()) {
    return
  }
  document.body.style.pointerEvents = ''
}

export function useRadixBodyPointerEventsRecovery(): void {
  useEffect(() => {
    let frameId: number | null = null

    const scheduleRecovery = (): void => {
      if (frameId !== null) {
        return
      }
      frameId = requestAnimationFrame(() => {
        frameId = null
        clearStaleBodyPointerEvents()
      })
    }

    scheduleRecovery()

    const observer = new MutationObserver(scheduleRecovery)
    // Why: dialog/sheet portals can leave body pointer-events locked after unmount.
    // Watch both body style and portal removal so the app recovers immediately.
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [])
}
