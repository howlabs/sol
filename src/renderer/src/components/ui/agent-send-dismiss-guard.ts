import type { RadixPreventableEvent } from './radix-popup-compat'

/**
 * Prevents dropdown/menu dismissal when the user clicks inside an agent-send
 * target zone (eligible / disabled / sending). Used by BrowserPane and
 * NotesSendMenu which share the same outside-click guard.
 */
export function preventAgentSendTargetOutsideDismiss(event: RadixPreventableEvent): void {
  const target = event.target
  if (!(target instanceof Element)) {
    return
  }
  if (
    target.closest(
      '[data-agent-send-target="eligible"], [data-agent-send-target="disabled"], [data-agent-send-target="sending"]'
    )
  ) {
    event.preventDefault()
  }
}
