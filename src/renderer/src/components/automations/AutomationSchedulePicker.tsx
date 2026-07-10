import React from 'react'
import { CalendarClock, ChevronsUpDown } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { AutomationSchedulePreset } from '../../../../shared/automations-types'
import {
  buildAutomationCronSchedule,
  buildAutomationRrule,
  formatAutomationSchedule,
  isValidAutomationSchedule
} from '../../../../shared/automation-schedules'
import type { AutomationDraft } from './AutomationEditorDialog'
import { AutomationCustomCronPanel } from './AutomationCustomCronPanel'
import { Field } from './automation-page-parts'
import {
  getScheduleDaySelectItems,
  getScheduleHourSelectItems,
  getScheduleMinuteSelectItems,
  getSchedulePeriodSelectItems,
  getSchedulePresetSelectItems
} from './automation-select-items'
import { translate } from '@/i18n/i18n'

const FIELD_CONTROL_CLASS = 'border-input bg-input/30 shadow-xs dark:bg-input/30'

export const AUTOMATION_SCHEDULE_PRESET_OPTIONS = [
  ['hourly', 'Hourly'],
  ['daily', 'Daily'],
  ['weekdays', 'Weekdays'],
  ['weekly', 'Weekly'],
  ['custom', 'Custom cron']
] as const satisfies readonly [AutomationSchedulePreset, string][]

function parseTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(':').map((part) => Number(part))
  return {
    hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 9,
    minute: Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : 0
  }
}

function formatTimeInput(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function getClockParts(time: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  const { hour, minute } = parseTime(time)
  return {
    hour12: hour % 12 === 0 ? 12 : hour % 12,
    minute,
    period: hour >= 12 ? 'PM' : 'AM'
  }
}

function updateTimePart(
  time: string,
  patch: { hour12?: number; minute?: number; period?: 'AM' | 'PM' }
): string {
  const current = getClockParts(time)
  const nextHour12 = patch.hour12 ?? current.hour12
  const nextPeriod = patch.period ?? current.period
  const nextMinute = patch.minute ?? current.minute
  const hour24 =
    nextPeriod === 'AM'
      ? nextHour12 === 12
        ? 0
        : nextHour12
      : nextHour12 === 12
        ? 12
        : nextHour12 + 12
  return formatTimeInput(hour24, nextMinute)
}

function getDraftScheduleLabel(draft: AutomationDraft): string {
  if (draft.preset === 'custom') {
    return draft.customSchedule.trim()
      ? formatAutomationSchedule(draft.customSchedule)
      : 'Advanced schedule'
  }
  const { hour, minute } = parseTime(draft.time)
  return formatAutomationSchedule(
    buildAutomationRrule({
      preset: draft.preset,
      hour,
      minute,
      dayOfWeek: Number(draft.dayOfWeek)
    })
  )
}

function buildCustomScheduleSeed(draft: AutomationDraft): string {
  const existing = draft.customSchedule.trim()
  if (existing) {
    return draft.customSchedule
  }
  if (draft.preset === 'custom') {
    return ''
  }
  const { hour, minute } = parseTime(draft.time)
  return buildAutomationCronSchedule({
    preset: draft.preset,
    hour,
    minute,
    dayOfWeek: Number(draft.dayOfWeek)
  })
}

export function getSchedulePresetDraft(
  current: AutomationDraft,
  preset: AutomationSchedulePreset
): Pick<AutomationDraft, 'preset' | 'customSchedule' | 'scheduleWarning'> {
  return {
    preset,
    customSchedule: preset === 'custom' ? buildCustomScheduleSeed(current) : current.customSchedule,
    scheduleWarning: null
  }
}

export function AutomationSchedulePicker({
  draft,
  triggerClassName,
  validateAdvancedSchedule = isValidAutomationSchedule,
  onDraftChange
}: {
  draft: AutomationDraft
  triggerClassName?: string
  validateAdvancedSchedule?: (schedule: string) => boolean
  onDraftChange: (updater: (current: AutomationDraft) => AutomationDraft) => void
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false)
  const label = getDraftScheduleLabel(draft)
  const clockParts = getClockParts(draft.time)
  const customSchedule = draft.customSchedule.trim()
  const customScheduleInvalid =
    draft.preset === 'custom' &&
    customSchedule.length > 0 &&
    !validateAdvancedSchedule(customSchedule)
  const presetItems = React.useMemo(() => getSchedulePresetSelectItems(), [])
  const dayItems = React.useMemo(() => getScheduleDaySelectItems(), [])
  const hourItems = React.useMemo(() => getScheduleHourSelectItems(), [])
  const minuteItems = React.useMemo(() => getScheduleMinuteSelectItems(), [])
  const periodItems = React.useMemo(() => getSchedulePeriodSelectItems(), [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-9 w-full justify-between px-3 text-sm font-normal', triggerClassName)}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="popover-scroll-content scrollbar-sleek max-h-[var(--available-height, var(--radix-popover-content-available-height))] w-[min(var(--anchor-width, var(--radix-popover-trigger-width)),calc(100vw-2rem))] min-w-[min(22rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto p-3"
      >
        <div className="grid gap-3">
          <Field
            label={translate(
              'auto.components.automations.AutomationSchedulePicker.233b8c94b6',
              'Cadence'
            )}
          >
            <Select
              value={draft.preset}
              items={presetItems}
              onValueChange={(preset) => {
                if (preset == null) {
                  return
                }
                onDraftChange((current) => ({
                  ...current,
                  ...getSchedulePresetDraft(current, preset as AutomationSchedulePreset)
                }))
              }}
            >
              <SelectTrigger className={cn('w-full min-w-0', FIELD_CONTROL_CLASS)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start">
                {presetItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {draft.preset === 'custom' ? (
            <AutomationCustomCronPanel
              draft={draft}
              customScheduleInvalid={customScheduleInvalid}
              validateAdvancedSchedule={validateAdvancedSchedule}
              onDraftChange={onDraftChange}
            />
          ) : (
            <>
              {draft.preset === 'weekly' ? (
                <Field
                  label={translate(
                    'auto.components.automations.AutomationSchedulePicker.6b914c5fbb',
                    'Day'
                  )}
                >
                  <Select
                    value={draft.dayOfWeek}
                    items={dayItems}
                    onValueChange={(dayOfWeek) => {
                      if (dayOfWeek == null) {
                        return
                      }
                      onDraftChange((current) => ({
                        ...current,
                        dayOfWeek,
                        scheduleWarning: null
                      }))
                    }}
                  >
                    <SelectTrigger className={cn('w-full min-w-0', FIELD_CONTROL_CLASS)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                      {dayItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
              {draft.preset === 'hourly' ? (
                <Field
                  label={translate(
                    'auto.components.automations.AutomationSchedulePicker.9e677335b0',
                    'Minute'
                  )}
                >
                  <Select
                    value={String(clockParts.minute)}
                    items={minuteItems}
                    onValueChange={(minute) => {
                      if (minute == null) {
                        return
                      }
                      onDraftChange((current) => ({
                        ...current,
                        time: updateTimePart(current.time, { minute: Number(minute) }),
                        scheduleWarning: null
                      }))
                    }}
                  >
                    <SelectTrigger className={cn('w-full min-w-0', FIELD_CONTROL_CLASS)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                      {minuteItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          :{item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <Field
                  label={translate(
                    'auto.components.automations.AutomationSchedulePicker.d90981f766',
                    'Time'
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-2">
                    <Select
                      value={String(clockParts.hour12)}
                      items={hourItems}
                      onValueChange={(hour12) => {
                        if (hour12 == null) {
                          return
                        }
                        onDraftChange((current) => ({
                          ...current,
                          time: updateTimePart(current.time, { hour12: Number(hour12) }),
                          scheduleWarning: null
                        }))
                      }}
                    >
                      <SelectTrigger
                        aria-label={translate(
                          'auto.components.automations.AutomationSchedulePicker.6b802ecc99',
                          'Hour'
                        )}
                        className={cn('w-full min-w-0', FIELD_CONTROL_CLASS)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start">
                        {hourItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(clockParts.minute)}
                      items={minuteItems}
                      onValueChange={(minute) => {
                        if (minute == null) {
                          return
                        }
                        onDraftChange((current) => ({
                          ...current,
                          time: updateTimePart(current.time, { minute: Number(minute) }),
                          scheduleWarning: null
                        }))
                      }}
                    >
                      <SelectTrigger
                        aria-label={translate(
                          'auto.components.automations.AutomationSchedulePicker.9e677335b0',
                          'Minute'
                        )}
                        className={cn('w-full min-w-0', FIELD_CONTROL_CLASS)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start">
                        {minuteItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={clockParts.period}
                      items={periodItems}
                      onValueChange={(period) => {
                        if (period == null) {
                          return
                        }
                        onDraftChange((current) => ({
                          ...current,
                          time: updateTimePart(current.time, { period: period as 'AM' | 'PM' }),
                          scheduleWarning: null
                        }))
                      }}
                    >
                      <SelectTrigger
                        aria-label={translate(
                          'auto.components.automations.AutomationSchedulePicker.22359b186a',
                          'AM or PM'
                        )}
                        className={cn('w-full min-w-0', FIELD_CONTROL_CLASS)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start">
                        {periodItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
