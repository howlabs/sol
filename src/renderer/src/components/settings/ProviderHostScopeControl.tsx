import { ServerCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import type { ProviderAccountScope, ProviderRateLimitScope } from './provider-account-scope'
import { translate } from '@/i18n/i18n'

type ProviderHostScopeControlProps = {
  labelPrefix: string
  scope: ProviderAccountScope | ProviderRateLimitScope
  className?: string
}

export function OpenRemoteServersButton(props: {
  className?: string
  size?: 'sm' | 'default'
}): React.JSX.Element {
  const openSettingsPage = useAppStore((state) => state.openSettingsPage)
  const openSettingsTarget = useAppStore((state) => state.openSettingsTarget)

  return (
    <Button
      type="button"
      variant="ghost"
      size={props.size ?? 'sm'}
      className={props.className}
      onClick={() => {
        openSettingsPage()
        openSettingsTarget({ pane: 'servers', repoId: null, sectionId: 'default-runtime' })
      }}
    >
      <ServerCog className="size-3.5" />
      {translate(
        'auto.components.settings.ProviderHostScopeControl.change_host',
        'Open remote servers'
      )}
    </Button>
  )
}

/** Rate-limit panels still show scope label + description; Integrations cards use OpenRemoteServersButton only. */
export function ProviderHostScopeControl({
  labelPrefix,
  scope,
  className
}: ProviderHostScopeControlProps): React.JSX.Element {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[min(14rem,100%)] flex-1">
          <span className="font-medium text-foreground">
            {translate(
              'auto.components.settings.ProviderHostScopeControl.scope_label',
              '{{value0}}: {{value1}}',
              { value0: labelPrefix, value1: scope.label }
            )}
          </span>
          <div className="mt-0.5 text-muted-foreground">{scope.description}</div>
        </div>
        <OpenRemoteServersButton className="shrink-0" />
      </div>
    </div>
  )
}
