// Why: mobile driver overlay removed; Restart chip may still focus when safe.

export function shouldFocusMobileDriverAction(
  activeElement: Element | null,
  body: HTMLElement,
  paneScope: Element | null
): boolean {
  if (!activeElement || activeElement === body) {
    return true
  }
  if (paneScope && paneScope.contains(activeElement)) {
    const tag = activeElement.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable) {
      return false
    }
  }
  return !activeElement.closest('input, textarea, [contenteditable="true"]')
}
