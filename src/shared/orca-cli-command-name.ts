/** Public shell command name for the Sol CLI on each platform. */
export function getOrcaCliCommandNameForPlatform(platform: NodeJS.Platform): string {
  if (platform === 'linux') {
    return 'sol-ide'
  }
  if (platform === 'win32') {
    return 'sol.cmd'
  }
  return 'sol'
}
