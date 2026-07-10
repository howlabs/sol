import type { IntegrationCardStatusTone } from './integration-card-shell'

export function resolveAgentRowStatusTone(props: {
  isDetected: boolean
  isEnabled: boolean
  isDefault: boolean
}): IntegrationCardStatusTone {
  if (!props.isDetected) {
    return 'attention'
  }
  if (props.isDefault) {
    return 'connected'
  }
  return 'neutral'
}

export function resolveAgentRowStatusLabelKey(props: {
  isDetected: boolean
  isEnabled: boolean
  isDefault: boolean
}): 'install' | 'default' | 'disabled' | 'onPath' {
  if (!props.isDetected) {
    return 'install'
  }
  if (props.isDefault) {
    return 'default'
  }
  if (!props.isEnabled) {
    return 'disabled'
  }
  return 'onPath'
}
