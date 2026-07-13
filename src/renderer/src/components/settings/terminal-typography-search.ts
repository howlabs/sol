import { translate } from '@/i18n/i18n'
import { translateSearchKeyword } from './settings-search-keywords'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'

export const getTerminalTypographySearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.5930244899', 'Font Size'),
    description: translate(
      'auto.components.settings.terminal.search.0fe0073f0c',
      'Default terminal font size for new panes and live updates.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      ...translateSearchKeyword(
        'auto.components.settings.terminal.search.103cdb862f',
        'typography'
      ),
      ...translateSearchKeyword('auto.components.settings.terminal.search.33031c1465', 'text size')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.e989914ad6', 'Font Family'),
    description: translate(
      'auto.components.settings.terminal.search.0acdc17891',
      'Default terminal font family for new panes and live updates.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      ...translateSearchKeyword(
        'auto.components.settings.terminal.search.103cdb862f',
        'typography'
      ),
      ...translateSearchKeyword('auto.components.settings.terminal.search.b0bb76ae6b', 'font')
    ]
  }
])

export const getTerminalRenderingSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.13a2502dfc', 'GPU Acceleration'),
    description: translate(
      'auto.components.settings.terminal.search.8f9f953de7',
      'Controls whether the terminal uses xterm.js WebGL rendering. Auto tries WebGL when the renderer is supported, with conservative fallback for software or unknown GPU renderers.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.db82cb13b0', 'gpu'),
      ...translateSearchKeyword(
        'auto.components.settings.terminal.search.4b4e80d850',
        'acceleration'
      ),
      ...translateSearchKeyword('auto.components.settings.terminal.search.6cddc858ba', 'webgl'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.fffa9ab980', 'renderer'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.bc7ae1f7c0', 'rendering'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.7d924d870d', 'graphics'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.1abcf4d7de', 'linux')
    ]
  }
])

export const getTerminalCursorSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.97bcfff662', 'Cursor Shape'),
    description: translate(
      'auto.components.settings.terminal.search.275a9d6395',
      'Default cursor appearance for Orca terminal panes.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.6eaf7ee0e4', 'cursor'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.a6e9dcc829', 'bar'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.015c82349f', 'block'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.eefd1d8332', 'underline')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.b03d01fd49', 'Blinking Cursor'),
    description: translate(
      'auto.components.settings.terminal.search.a27f6edf52',
      'Uses the blinking variant of the selected cursor shape.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.6eaf7ee0e4', 'cursor'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.25f606d9e5', 'blink')
    ]
  }
])
