import { Button } from '../ui/button'
import { translate } from '@/i18n/i18n'
import type { WorktreeBaseRef } from '../../../../shared/types'

type BaseRefPickerProps = {
  currentBaseRef?: string
  onSelect: (ref: WorktreeBaseRef) => void
  onUsePrimary?: () => void
}

const OPTIONS: { value: WorktreeBaseRef; label: string; description: string }[] = [
  {
    value: 'fresh',
    label: translate('auto.components.settings.BaseRefPicker.fresh', 'Fresh (origin/HEAD)'),
    description: translate(
      'auto.components.settings.BaseRefPicker.freshDesc',
      'Base new worktrees on the remote default branch.'
    )
  },
  {
    value: 'head',
    label: translate('auto.components.settings.BaseRefPicker.head', 'Head (local HEAD)'),
    description: translate(
      'auto.components.settings.BaseRefPicker.headDesc',
      'Base new worktrees on your current local HEAD.'
    )
  }
]

export function BaseRefPicker({
  currentBaseRef,
  onSelect,
  onUsePrimary
}: BaseRefPickerProps): React.JSX.Element {
  const activeValue: WorktreeBaseRef = currentBaseRef === 'head' ? 'head' : 'fresh'

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-foreground">
            {OPTIONS.find((o) => o.value === activeValue)?.label}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentBaseRef
              ? translate(
                  'auto.components.settings.BaseRefPicker.2f3cda96f5',
                  'Pinned for this repo'
                )
              : translate(
                  'auto.components.settings.BaseRefPicker.086ce7f369',
                  'Following default (fresh)'
                )}
          </p>
        </div>
        {onUsePrimary && (
          <Button variant="outline" size="sm" onClick={onUsePrimary} disabled={!currentBaseRef}>
            {translate('auto.components.settings.BaseRefPicker.773a5687a3', 'Use Primary')}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`flex-1 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 ${
              activeValue === option.value
                ? 'border-primary bg-accent text-accent-foreground'
                : 'border-border text-foreground'
            }`}
          >
            <div className="font-medium">{option.label}</div>
            <div className="text-xs text-muted-foreground">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
