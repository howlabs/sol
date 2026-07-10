import type { GlobalSettings } from '../../../../shared/types'

export function resolveDefaultAgentToggleValue(
  defaultAgent: GlobalSettings['defaultTuiAgent'],
  isAutoDefault: boolean,
  isBlankDefault: boolean
): string {
  if (isBlankDefault) {
    return 'blank'
  }
  if (isAutoDefault) {
    return 'auto'
  }
  if (defaultAgent && defaultAgent !== 'blank') {
    return defaultAgent
  }
  return 'auto'
}
