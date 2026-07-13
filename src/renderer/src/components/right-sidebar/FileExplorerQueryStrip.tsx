import React from 'react'

type FileExplorerQueryStripProps = {
  children: React.ReactNode
}

// Why: minimal explorer chrome is a single query field (name filter or
// contents-search when opened off-chrome). No Names|Contents dual switch.
export function FileExplorerQueryStrip({
  children
}: FileExplorerQueryStripProps): React.JSX.Element {
  return (
    <div className="border-b border-border px-2 py-1.5">
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}
