import { describe, expect, it } from 'vitest'
import {
  getMissedRunGraceSelectItems,
  getPrecheckTimeoutSelectItems,
  getScheduleDaySelectItems,
  getSchedulePresetSelectItems,
  resolveSelectItemLabel
} from './automation-select-items'

describe('automation select value→label path', () => {
  it('maps grace minutes to human labels (not raw values)', () => {
    const items = getMissedRunGraceSelectItems()
    expect(resolveSelectItemLabel(items, '720')).toBe('12 hours')
    expect(resolveSelectItemLabel(items, '720')).not.toBe('720')
    expect(resolveSelectItemLabel(items, '0')).toBe('No grace')
  })

  it('maps precheck timeout seconds to human labels', () => {
    const items = getPrecheckTimeoutSelectItems()
    expect(resolveSelectItemLabel(items, '300')).toBe('5 min')
    expect(resolveSelectItemLabel(items, '300')).not.toBe('300')
  })

  it('maps schedule day index to weekday names', () => {
    const items = getScheduleDaySelectItems()
    expect(resolveSelectItemLabel(items, '1')).toBe('Monday')
    expect(resolveSelectItemLabel(items, '1')).not.toBe('1')
  })

  it('maps schedule presets to cadence labels', () => {
    const items = getSchedulePresetSelectItems()
    expect(resolveSelectItemLabel(items, 'weekdays')).toBe('Weekdays')
    expect(resolveSelectItemLabel(items, 'custom')).toBe('Custom cron')
  })

  it('returns null for unknown values', () => {
    expect(resolveSelectItemLabel(getMissedRunGraceSelectItems(), '99999')).toBeNull()
    expect(resolveSelectItemLabel(getMissedRunGraceSelectItems(), null)).toBeNull()
  })
})
