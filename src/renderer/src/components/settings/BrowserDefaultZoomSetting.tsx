import { useMemo } from 'react'
import {
  BROWSER_PAGE_ZOOM_LEVELS,
  browserPageZoomLevelToPercent,
  normalizeBrowserPageZoomLevel
} from '../../../../shared/browser-page-zoom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SearchableSetting } from './SearchableSetting'
import { SettingsRow } from './SettingsFormControls'
import { settingsSelectItems } from './settings-select-items'
import { translate } from '@/i18n/i18n'

type BrowserDefaultZoomSettingProps = {
  value: number
  onChange: (value: number) => void
}

export function BrowserDefaultZoomSetting({
  value,
  onChange
}: BrowserDefaultZoomSettingProps): React.JSX.Element {
  const selectedZoomLevel = normalizeBrowserPageZoomLevel(value)
  const title = translate(
    'auto.components.settings.BrowserDefaultZoomSetting.265597101f',
    'Default Zoom'
  )
  const description = translate(
    'auto.components.settings.BrowserDefaultZoomSetting.2622126877',
    'Zoom level applied to newly opened browser tabs.'
  )
  const items = useMemo(
    () =>
      settingsSelectItems(
        BROWSER_PAGE_ZOOM_LEVELS.map((level) => ({
          value: String(level),
          label: `${browserPageZoomLevelToPercent(level)}%`
        }))
      ),
    []
  )

  return (
    <SearchableSetting
      title={title}
      description={description}
      keywords={['browser', 'zoom', 'scale', 'default', 'page zoom', 'new tab', 'percentage']}
    >
      <SettingsRow
        label={title}
        description={translate(
          'auto.components.settings.BrowserDefaultZoomSetting.bbeec087d3',
          'Applied to newly opened browser tabs.'
        )}
        control={
          <Select
            value={String(selectedZoomLevel)}
            items={items}
            onValueChange={(next) => onChange(Number(next))}
          >
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </SearchableSetting>
  )
}
