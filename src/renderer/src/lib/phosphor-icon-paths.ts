/**
 * Path-prefix fingerprints for Phosphor icons used in tests.
 * Each prefix is the first ~30 chars of the `d` attribute from the
 * "regular" weight — enough to uniquely identify the glyph.
 */
export const PHOSPHOR_ICON_PATH_PREFIX: Record<string, string> = {
  ArrowUp: 'M205.66,117.66a8,8,0,0,1-11.32',
  ArrowsDownUp: 'M117.66,170.34a8,8,0,0,1,0,11.',
  CloudArrowUp: 'M178.34,165.66,160,147.31V208a',
  Plus: 'M224,128a8,8,0,0,1-8,8H136v80a',
  Check: 'M229.66,77.66l-128,128a8,8,0,0',
  Sparkle: 'M197.58,129.06,146,110l-19-51.',
  CaretDown: 'M213.66,101.66l-80,80a8,8,0,0,',
  DotsThree: 'M140,128a12,12,0,1,1-12-12A12,',
  ArrowSquareOut: 'M224,104a8,8,0,0,1-16,0V59.32l',
  Sidebar: 'M216,40H40A16,16,0,0,0,24,56V2',
  ChatTeardropText: 'M172,112a8,8,0,0,1-8,8H96a8,8,',
  Square: 'M208,32H48A16,16,0,0,0,32,48V2',
  ArrowsClockwise: 'M224,48V96a8,8,0,0,1-8,8H168a8'
}

/** Assert that markup contains the specific Phosphor glyph by path prefix. */
export function hasPhosphorIcon(
  markup: string,
  iconName: keyof typeof PHOSPHOR_ICON_PATH_PREFIX
): boolean {
  return markup.includes(PHOSPHOR_ICON_PATH_PREFIX[iconName])
}
