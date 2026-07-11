import { RefreshCw, Trash2 } from '@/lib/icons'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import type { GrokManagedAccountSummary } from '../../../../shared/types'

export type GrokAccountRowProps = {
  account: GrokManagedAccountSummary
  active: boolean
  disabled: boolean
  onSelect: () => void
  onRemove: () => void
  onReauthenticate: () => void
}

export function GrokAccountRow({
  account,
  active,
  disabled,
  onSelect,
  onRemove,
  onReauthenticate
}: GrokAccountRowProps): React.JSX.Element {
  return (
    <div
      data-current={active ? 'true' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-lg border p-2.5',
        active ? 'border-border/60 bg-accent' : 'border-border/40'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-50"
      >
        <div
          className={cn(
            'size-2 shrink-0 rounded-full',
            active ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-xs font-medium">{account.email}</p>
          {account.teamId ? (
            <p className="truncate text-xs text-muted-foreground">{account.teamId}</p>
          ) : null}
        </div>
      </button>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          onClick={onReauthenticate}
          disabled={disabled}
          className="gap-1"
        >
          <RefreshCw className="size-3" />
          {translate('auto.components.settings.GrokAccountsSection.reauthBtn', 'Refresh')}
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onRemove}
          disabled={disabled}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}
