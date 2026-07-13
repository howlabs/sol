import type { GlobalSettings } from './types'

type TerminalCursorStyleSettings = Pick<GlobalSettings, 'terminalCursorStyle'>

export function normalizeTerminalCursorStyleDefault(
  settings: Partial<TerminalCursorStyleSettings> | undefined,
  _options: { preserveExplicitValue?: boolean } = {}
): TerminalCursorStyleSettings {
  return {
    // Why: prior builds persisted the old bar default into profiles; migrate
    // those inherited values once while preserving later explicit choices.
    terminalCursorStyle: settings?.terminalCursorStyle ?? 'block'
  }
}
