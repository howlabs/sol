import { translate } from '@/i18n/i18n'
import type { AutomationSchedulePreset } from '../../../../shared/automations-types'

export type SelectItemOption = { value: string; label: string }

/** Pure lookup used by Select `items` and tests (value → human label). */
export function resolveSelectItemLabel(
  items: readonly SelectItemOption[],
  value: string | null | undefined
): string | null {
  if (value == null) {
    return null
  }
  return items.find((item) => item.value === value)?.label ?? null
}

export function getMissedRunGraceSelectItems(): SelectItemOption[] {
  return [
    {
      value: '0',
      label: translate(
        'auto.components.automations.AutomationMissedRunGraceField.529dc6c0b7',
        'No grace'
      )
    },
    {
      value: '30',
      label: translate(
        'auto.components.automations.AutomationMissedRunGraceField.e5ad263ae5',
        '30 minutes'
      )
    },
    {
      value: '60',
      label: translate(
        'auto.components.automations.AutomationMissedRunGraceField.521f77cd58',
        '1 hour'
      )
    },
    {
      value: '180',
      label: translate(
        'auto.components.automations.AutomationMissedRunGraceField.2dc9ee84d0',
        '3 hours'
      )
    },
    {
      value: '720',
      label: translate(
        'auto.components.automations.AutomationMissedRunGraceField.ba50e2a230',
        '12 hours'
      )
    },
    {
      value: '1440',
      label: translate(
        'auto.components.automations.AutomationMissedRunGraceField.adbab51feb',
        '24 hours'
      )
    },
    {
      value: '2880',
      label: translate(
        'auto.components.automations.AutomationMissedRunGraceField.0f4459e91d',
        '48 hours'
      )
    }
  ]
}

export function getPrecheckTimeoutSelectItems(): SelectItemOption[] {
  return [
    {
      value: '30',
      label: translate('auto.components.automations.AutomationPrecheckFields.51e28cdad9', '30 sec')
    },
    {
      value: '60',
      label: translate('auto.components.automations.AutomationPrecheckFields.c820119736', '1 min')
    },
    {
      value: '120',
      label: translate('auto.components.automations.AutomationPrecheckFields.d84d3765fd', '2 min')
    },
    {
      value: '300',
      label: translate('auto.components.automations.AutomationPrecheckFields.bf49585b3c', '5 min')
    },
    {
      value: '600',
      label: translate('auto.components.automations.AutomationPrecheckFields.d2a2ac89ac', '10 min')
    }
  ]
}

export function getSchedulePresetSelectItems(): SelectItemOption[] {
  return (
    [
      ['hourly', 'Hourly'],
      ['daily', 'Daily'],
      ['weekdays', 'Weekdays'],
      ['weekly', 'Weekly'],
      ['custom', 'Custom cron']
    ] as const satisfies readonly [AutomationSchedulePreset, string][]
  ).map(([value, label]) => ({ value, label }))
}

export function getScheduleDaySelectItems(): SelectItemOption[] {
  return [
    ['0', 'Sunday'],
    ['1', 'Monday'],
    ['2', 'Tuesday'],
    ['3', 'Wednesday'],
    ['4', 'Thursday'],
    ['5', 'Friday'],
    ['6', 'Saturday']
  ].map(([value, label]) => ({ value, label }))
}

export function getScheduleHourSelectItems(): SelectItemOption[] {
  return Array.from({ length: 12 }, (_, index) => {
    const value = String(index + 1)
    return { value, label: value }
  })
}

export function getScheduleMinuteSelectItems(): SelectItemOption[] {
  return Array.from({ length: 60 }, (_, index) => {
    const value = String(index)
    return { value, label: value.padStart(2, '0') }
  })
}

export function getSchedulePeriodSelectItems(): SelectItemOption[] {
  return [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ]
}
