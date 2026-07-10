export function resolveAgentOverridesAccordionDefaultOpen(props: {
  cmdOverride: string | undefined
  argsOverride: string
  defaultArgs: string
  envSummary: string
  defaultEnvSummary: string
  hasSessionHome: boolean
}): string[] {
  const open: string[] = []
  if (props.cmdOverride) {
    open.push('command')
  }
  if (props.argsOverride !== props.defaultArgs) {
    open.push('args')
  }
  if (props.envSummary !== props.defaultEnvSummary) {
    open.push('env')
  }
  if (props.hasSessionHome) {
    open.push('session-home')
  }
  if (open.length === 0) {
    open.push('command')
  }
  return open
}
