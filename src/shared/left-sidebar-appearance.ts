import type { LeftSidebarAppearanceMode } from './types'

export const LEFT_SIDEBAR_APPEARANCE_MODES = ['default', 'match-terminal'] as const

export function normalizeLeftSidebarAppearanceMode(value: unknown): LeftSidebarAppearanceMode {
  return LEFT_SIDEBAR_APPEARANCE_MODES.includes(value as LeftSidebarAppearanceMode)
    ? (value as LeftSidebarAppearanceMode)
    : 'default'
}
