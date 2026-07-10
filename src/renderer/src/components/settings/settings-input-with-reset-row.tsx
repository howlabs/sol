import { useId } from 'react'
import { Button } from '../ui/button'
import { ButtonGroup } from '../ui/button-group'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '@/lib/utils'

export type SettingsInputWithResetRowProps = {
  label: string
  hideLabel?: boolean
  value: string
  placeholder?: string
  spellCheck?: boolean
  invalid?: boolean
  describedBy?: string
  showReset: boolean
  resetLabel: string
  onValueChange: (value: string) => void
  onCommit: () => void
  onReset: () => void
  onEscape: () => void
  inputClassName?: string
  groupClassName?: string
}

function SettingsFieldLabel(props: {
  inputId: string
  label: string
  hideLabel?: boolean
}): React.JSX.Element | null {
  if (props.hideLabel) {
    return null
  }
  return (
    <Label htmlFor={props.inputId} className="text-[11px] font-normal text-muted-foreground">
      {props.label}
    </Label>
  )
}

export function SettingsInputWithResetRow({
  label,
  value,
  placeholder,
  spellCheck = false,
  invalid,
  describedBy,
  showReset,
  resetLabel,
  onValueChange,
  onCommit,
  onReset,
  onEscape,
  inputClassName,
  groupClassName,
  hideLabel
}: SettingsInputWithResetRowProps): React.JSX.Element {
  const inputId = useId()

  return (
    <div className="flex flex-col gap-1">
      <SettingsFieldLabel inputId={inputId} label={label} hideLabel={hideLabel} />
      {/* Why: shadcn ButtonGroup attaches reset to the field — one focus target, no float gap. */}
      <ButtonGroup className={cn('w-full', groupClassName)}>
        <Input
          id={inputId}
          aria-label={hideLabel ? label : undefined}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCommit()
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') {
              onEscape()
              e.currentTarget.blur()
            }
          }}
          placeholder={placeholder}
          spellCheck={spellCheck}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn('h-7 min-w-0 flex-1 font-mono text-xs', inputClassName)}
        />
        {showReset ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-7 shrink-0 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {resetLabel}
          </Button>
        ) : null}
      </ButtonGroup>
    </div>
  )
}
