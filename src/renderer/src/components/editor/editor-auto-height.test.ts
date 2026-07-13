import { describe, expect, it } from 'vitest'
import {
  clampAutoHeight,
  getAutoHeightForContent,
  isAutoHeightCapped,
  EDITOR_AUTO_HEIGHT_MAX_LINES
} from './editor-auto-height'

describe('editor-auto-height', () => {
  it('sizes content by line count with a floor', () => {
    const height = getAutoHeightForContent('a\nb\nc\n', 14)
    expect(height).toBeGreaterThanOrEqual(80)
    expect(clampAutoHeight(10, 14)).toBe(80)
  })

  it('caps very large documents', () => {
    const many = Array.from({ length: EDITOR_AUTO_HEIGHT_MAX_LINES + 50 }, () => 'x').join('\n')
    const height = getAutoHeightForContent(many, 14)
    expect(isAutoHeightCapped(height, 14)).toBe(true)
  })
})
