import { translate } from '@/i18n/i18n'
import { translateSearchKeyword } from './settings-search-keywords'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'

export const getManageSessionsSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.6f5d486a68', 'Manage Sessions'),
    description: translate(
      'auto.components.settings.terminal.search.f72abc493c',
      'Recover from frozen terminals by killing sessions, clearing saved scrollback, or restarting the daemon.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.f35400f7e8', 'daemon'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.9f2dda133c', 'pty'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.d802a578bf', 'sessions'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.a8d2784214', 'manage'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.a3e5297c10', 'kill'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.920573d65b', 'kill all'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.456da64d4d', 'clear'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.3982d88725', 'history'),
      ...translateSearchKeyword(
        'auto.components.settings.terminal.search.cde233f5da',
        'scrollback'
      ),
      ...translateSearchKeyword('auto.components.settings.terminal.search.6892fb1019', 'restart'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.0a05629060', 'recover'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.88561b3499', 'frozen'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.d4daf4f612', 'unfreeze')
    ]
  }
])

export const getTerminalWindowSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.b36fd2416d', 'Background Opacity'),
    description: translate(
      'auto.components.settings.terminal.search.4c643695aa',
      'Controls the transparency of the terminal background.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.46d99ef4bb', 'opacity'),
      ...translateSearchKeyword(
        'auto.components.settings.terminal.search.4f7f8f28ca',
        'transparency'
      ),
      ...translateSearchKeyword(
        'auto.components.settings.terminal.search.f6dd9ff606',
        'background'
      ),
      ...translateSearchKeyword('auto.components.settings.terminal.search.7db59c4738', 'alpha')
    ]
  }
])

export const getTerminalSetupScriptSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate(
      'auto.components.settings.terminal.search.5be2d67678',
      'Setup Script Location'
    ),
    description: translate(
      'auto.components.settings.terminal.search.2610ee3b56',
      "Where the repository setup script runs when a new workspace is created: a vertical split (default), a horizontal split, or a background tab titled 'Setup'."
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.terminal.search.4529806908', 'setup'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.6b659fff2a', 'script'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.7a48c7715b', 'workspace'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.de7bc1d5f5', 'split'),
      ...translateSearchKeyword(
        'auto.components.settings.terminal.search.54a9b3725b',
        'horizontal'
      ),
      ...translateSearchKeyword('auto.components.settings.terminal.search.18ce996647', 'vertical'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.f44643328e', 'tab'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.fd6c24313d', 'new'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.b872de3926', 'location'),
      ...translateSearchKeyword('auto.components.settings.terminal.search.c047f398cc', 'launch')
    ]
  }
])
