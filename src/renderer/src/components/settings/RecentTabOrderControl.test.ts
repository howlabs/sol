import { describe, expect, it } from 'vitest'
import { getCtrlTabOrderSelectItems } from './RecentTabOrderControl'

describe('RecentTabOrderControl select items', () => {
  it('maps Base UI select values to human labels (not raw mru/sequential)', () => {
    const items = getCtrlTabOrderSelectItems()
    const byValue = Object.fromEntries(items.map((item) => [item.value, item.label]))

    expect(byValue.mru).toBe('Most recent')
    expect(byValue.sequential).toBe('Tab strip order')
    // Why: trigger used to render the raw enum value when `items` was missing.
    expect(byValue.mru).not.toBe('mru')
    expect(byValue.sequential).not.toBe('sequential')
  })
})
