import { describe, expect, it } from 'vitest'
import {
  settingsSelectItems,
  settingsSelectItemsFromRecord,
  settingsSelectItemsFromValues
} from './settings-select-items'

describe('settingsSelectItems helpers', () => {
  it('builds value/label pairs for Base UI Select items', () => {
    expect(settingsSelectItems([{ value: 'mru', label: 'Most recent' }])).toEqual([
      { value: 'mru', label: 'Most recent' }
    ])
  })

  it('maps records and plain value lists', () => {
    expect(settingsSelectItemsFromRecord({ google: 'Google', kagi: 'Kagi' })).toEqual([
      { value: 'google', label: 'Google' },
      { value: 'kagi', label: 'Kagi' }
    ])
    expect(settingsSelectItemsFromValues(['Ubuntu', 'Debian'])).toEqual([
      { value: 'Ubuntu', label: 'Ubuntu' },
      { value: 'Debian', label: 'Debian' }
    ])
  })
})
