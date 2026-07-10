import { Info } from '@/lib/icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Field } from './automation-page-parts'
import { getMissedRunGraceSelectItems } from './automation-select-items'
import type { AutomationDraft } from './AutomationEditorDialog'
import { translate } from '@/i18n/i18n'

type AutomationMissedRunGraceFieldProps = {
  draft: AutomationDraft
  disabled: boolean
  pickerTriggerClassName: string
  onDraftChange: (updater: (current: AutomationDraft) => AutomationDraft) => void
}

export function AutomationMissedRunGraceField({
  draft,
  disabled,
  pickerTriggerClassName,
  onDraftChange
}: AutomationMissedRunGraceFieldProps): React.JSX.Element {
  const items = getMissedRunGraceSelectItems()

  return (
    <Field
      label={
        <span className="inline-flex items-center gap-1">
          {translate(
            'auto.components.automations.AutomationMissedRunGraceField.fc089e5fde',
            'Grace'
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={translate(
                  'auto.components.automations.AutomationMissedRunGraceField.3df53d554a',
                  'Missed-run grace help'
                )}
                className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="max-w-72">
              {translate(
                'auto.components.automations.AutomationMissedRunGraceField.3d70c185c8',
                'If Orca or the execution host was unavailable at the scheduled time, Orca runs one missed occurrence when it becomes available within this window. Older missed runs are skipped.'
              )}
            </TooltipContent>
          </Tooltip>
        </span>
      }
    >
      <Select
        value={draft.missedRunGraceMinutes}
        items={items}
        disabled={disabled}
        onValueChange={(missedRunGraceMinutes) =>
          onDraftChange((current) => ({
            ...current,
            missedRunGraceMinutes: missedRunGraceMinutes ?? current.missedRunGraceMinutes
          }))
        }
      >
        <SelectTrigger className={`w-full ${pickerTriggerClassName}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" align="start" sideOffset={4}>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
