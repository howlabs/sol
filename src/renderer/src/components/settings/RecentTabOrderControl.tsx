import React, { useMemo } from 'react'
import type { CtrlTabOrderMode } from '../../../../shared/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SearchableSetting } from './SearchableSetting'
import { SettingsRow } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'

function isCtrlTabOrderMode(value: unknown): value is CtrlTabOrderMode {
  return value === 'mru' || value === 'sequential'
}

export function getCtrlTabOrderSelectItems(): readonly {
  value: CtrlTabOrderMode
  label: string
}[] {
  return [
    {
      value: 'mru',
      label: translate('auto.components.settings.RecentTabOrderControl.6e6a3fcc61', 'Most recent')
    },
    {
      value: 'sequential',
      label: translate(
        'auto.components.settings.RecentTabOrderControl.3b17c81ede',
        'Tab strip order'
      )
    }
  ]
}

export function RecentTabOrderControl({
  ctrlTabOrderMode,
  keywords,
  updateSettings
}: {
  ctrlTabOrderMode: CtrlTabOrderMode
  keywords?: string[]
  updateSettings: (updates: { ctrlTabOrderMode?: CtrlTabOrderMode }) => Promise<void> | void
}): React.JSX.Element {
  // Why: Base UI Select.Value shows raw values unless Root gets `items`
  // (value → label). Without this the trigger shows "mru" instead of "Most recent".
  const items = useMemo(() => getCtrlTabOrderSelectItems(), [])
  const value = isCtrlTabOrderMode(ctrlTabOrderMode) ? ctrlTabOrderMode : 'mru'

  return (
    <SearchableSetting
      title={translate('auto.components.settings.RecentTabOrderControl.7a546f2309', 'Tab Order')}
      description={translate(
        'auto.components.settings.RecentTabOrderControl.a867a0889f',
        'Recent or tab strip.'
      )}
      keywords={keywords}
      className="max-w-none"
    >
      <SettingsRow
        label={translate('auto.components.settings.RecentTabOrderControl.7a546f2309', 'Tab Order')}
        description={translate(
          'auto.components.settings.RecentTabOrderControl.a867a0889f',
          'Recent or tab strip.'
        )}
        control={
          <Select
            value={value}
            items={items}
            onValueChange={(next) => {
              if (!isCtrlTabOrderMode(next)) {
                return
              }
              void updateSettings({ ctrlTabOrderMode: next })
            }}
          >
            <SelectTrigger size="sm" className="w-[180px]">
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
