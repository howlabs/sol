import { getTerminalClipboardSearchEntries } from './terminal-clipboard-search'
import { translate } from '@/i18n/i18n'
import { translateSearchKeyword } from './settings-search-keywords'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'

export const getTerminalPaneAppearanceSearchEntries = createLocalizedCatalog((): [] => [])

export const getTerminalPaneInteractionSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate(
      'auto.components.settings.terminal.search.ask_before_closing_running_terminals_title',
      'Ask Before Closing Running Terminals'
    ),
    description: translate(
      'auto.components.settings.terminal.search.ask_before_closing_running_terminals_description',
      'Show a confirmation before closing a terminal that has a running command or agent.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.10f9fb6fea', 'settings'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.a0c44061ee', 'confirm'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.close_terminal', 'close'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.39ea7c0d28', 'terminal'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.running', 'running'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.command', 'command'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.agent', 'agent'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.process', 'process'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.prompt', 'prompt'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.stop', 'stop')
    ]
  },
  ...getTerminalClipboardSearchEntries()
])
