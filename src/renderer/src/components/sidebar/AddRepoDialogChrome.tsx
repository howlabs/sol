import type { ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { AddRepoDialogStep } from './add-repo-dialog-types'
import { AddRepoStepIndicator } from './AddRepoStepIndicator'
import { cn } from '@/lib/utils'

/**
 * Flat dialog shell for Add Project — solid surface, tight width, no glass.
 * Nested import keeps a wider panel for the file list.
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
          'min-w-0 gap-5 overflow-hidden border-border bg-background p-5 shadow-none backdrop-blur-none [&>*]:min-w-0',
          'dark:border-border dark:bg-background dark:shadow-none',
          isNested
            ? 'max-h-[calc(100vh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)] sm:max-w-lg'
            : 'sm:max-w-[22rem]'
        )}
      >
        <AddRepoStepIndicator step={step} isAdding={isAdding} onBack={onBack} />
        {children}
      </DialogContent>
    </Dialog>
  )
}
