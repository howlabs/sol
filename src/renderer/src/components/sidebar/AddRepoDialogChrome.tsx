import type { ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { AddRepoDialogStep } from './add-repo-dialog-types'
import { AddRepoStepIndicator } from './AddRepoStepIndicator'
import { cn } from '@/lib/utils'

/**
 * Flat dialog shell for Add Project — solid surface, comfortable width for
 * large hit targets (not a narrow square). Nested import stays wider.
 */
export function AddRepoDialogChrome({
  children,
  isAdding,
  isOpen,
  onBack,
  onOpenChange,
  step
}: {
  children: ReactNode
  isAdding: boolean
  isOpen: boolean
  onBack: () => void
  onOpenChange: (open: boolean) => void
  step: AddRepoDialogStep
}): React.JSX.Element {
  const isNested = step === 'nested'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'min-w-0 gap-6 overflow-hidden border-border bg-background p-6 shadow-none backdrop-blur-none [&>*]:min-w-0 sm:rounded-xl',
          'dark:border-border dark:bg-background dark:shadow-none',
          isNested
            ? 'max-h-[calc(100vh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)] sm:max-w-xl'
            : 'sm:max-w-md'
        )}
      >
        <AddRepoStepIndicator step={step} isAdding={isAdding} onBack={onBack} />
        {children}
      </DialogContent>
    </Dialog>
  )
}
