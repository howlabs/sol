import { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

type IntegrationCardPresentation = 'default' | 'setup-guide'

const IntegrationCardPresentationContext = createContext<IntegrationCardPresentation>('default')

export function IntegrationCardPresentationProvider(props: {
  value: IntegrationCardPresentation
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <IntegrationCardPresentationContext.Provider value={props.value}>
      {props.children}
    </IntegrationCardPresentationContext.Provider>
  )
}

export function useIntegrationCardPresentation(): IntegrationCardPresentation {
  return useContext(IntegrationCardPresentationContext)
}

export function useIntegrationCardShellClass(className?: string): string {
  // Why: settings Integrations is a connection list, not a marketing card
  // grid. Flat rows inside one group beat stacked elevated cards.
  return cn('bg-transparent px-3 py-2', className)
}

export function IntegrationCardGroup(props: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  // Why: one quiet list frame only — softer than elevated card chrome so
  // SettingsSection (or a transparent body) never reads as double nesting.
  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-border/50 divide-y divide-border/40',
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

export function useIntegrationSubordinateRowClass(className?: string): string {
  // Why: nested muted cards inside each provider row were double chrome.
  // Hairline top border is enough hierarchy under a list row.
  return cn('border-t border-border/40 px-0 py-2 first:border-t-0', className)
}

export function useIntegrationCommandRowClass(): string {
  return cn(
    'flex items-center gap-2 rounded-md border border-border/50 bg-muted/40 px-2.5 py-1.5 font-mono text-xs'
  )
}
