import { RefreshCw, Trash2 } from '@/lib/icons'
import { translate } from '@/i18n/i18n'
import { Button } from '../ui/button'
import type { GrokManagedAccountSummary } from '../../../../shared/types'
import { ProviderAccountRow, ProviderAccountStatusBadge } from './provider-account-list'

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
    <ProviderAccountRow
      active={active}
      disabled={disabled}
      onSelect={onSelect}
      title={account.email}
      subtitle={account.teamId ?? undefined}
      badges={
        active ? (
          <ProviderAccountStatusBadge kind="active">Active</ProviderAccountStatusBadge>
        ) : null
      }
      actions={
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            title={translate('auto.components.settings.GrokAccountsSection.reauthBtn', 'Refresh')}
            aria-label={translate(
              'auto.components.settings.GrokAccountsSection.reauthBtn',
              'Refresh'
            )}
            onClick={(event) => {
              event.stopPropagation()
              onReauthenticate()
            }}
            disabled={disabled}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title={translate(
              'auto.components.settings.GrokAccountsSection.removeBtn',
              'Remove account'
            )}
            aria-label={translate(
              'auto.components.settings.GrokAccountsSection.removeBtn',
              'Remove account'
            )}
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      }
    />
  )
}
