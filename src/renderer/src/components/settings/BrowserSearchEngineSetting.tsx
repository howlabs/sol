import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SEARCH_ENGINE_LABELS, type SearchEngine } from '../../../../shared/browser-url'
import { SearchableSetting } from './SearchableSetting'
import { SettingsRow } from './SettingsFormControls'
import { KagiSessionLinkForm } from './KagiSessionLinkForm'
import { translate } from '@/i18n/i18n'

type BrowserSearchEngineSettingProps = {
  selectedSearchEngine: SearchEngine
  onSearchEngineChange: (engine: SearchEngine) => void
}

export function BrowserSearchEngineSetting({
  selectedSearchEngine,
  onSearchEngineChange
}: BrowserSearchEngineSettingProps): React.JSX.Element {
  const title = translate(
    'auto.components.settings.BrowserPane.0d9c987f21',
    'Default Search Engine'
  )
  const description = translate(
    'auto.components.settings.BrowserPane.7b225c78f5',
    'Search engine used when typing non-URL text in the address bar.'
  )

  return (
    <SearchableSetting
      title={title}
      description={description}
      keywords={[
        'browser',
        'search',
        'engine',
        'google',
        'duckduckgo',
        'bing',
        'kagi',
        'session',
        'private',
        'token',
        'omnibox'
      ]}
    >
      <SettingsRow
        label={title}
        description={translate(
          'auto.components.settings.BrowserPane.3e46903ad4',
          'Used when typing non-URL text in the address bar.'
        )}
        alignTop={selectedSearchEngine === 'kagi'}
        control={
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Select
              value={selectedSearchEngine}
              onValueChange={(value) => onSearchEngineChange(value as SearchEngine)}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SEARCH_ENGINE_LABELS) as SearchEngine[]).map((engine) => (
                  <SelectItem key={engine} value={engine}>
                    {SEARCH_ENGINE_LABELS[engine]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSearchEngine === 'kagi' ? <KagiSessionLinkForm /> : null}
          </div>
        }
      />
    </SearchableSetting>
  )
}
