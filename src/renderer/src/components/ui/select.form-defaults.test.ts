import { describe, expect, it } from 'vitest'
import { SELECT_CONTENT_DEFAULT_ALIGN_ITEM_WITH_TRIGGER } from './select'

describe('SelectContent form positioning default', () => {
  it('disables item-with-trigger overlap so side/align apply to form selects', () => {
    // Why: Base UI's library default is true; product form SelectContent must
    // default false or full-width triggers open with broken overlap positioning.
    expect(SELECT_CONTENT_DEFAULT_ALIGN_ITEM_WITH_TRIGGER).toBe(false)
  })
})
