type StatCardProps = {
  label: string
  value: string
  icon: React.ReactNode
}

/**
 * KPI tile for Stats & Usage. One quiet surface only — sits on the Settings
 * page card; do not wrap StatCards in another bordered panel shell.
 */
export function StatCard({ label, value, icon }: StatCardProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border/50 bg-muted/15 px-3 py-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground [&_svg]:size-3.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold leading-tight text-foreground">{value}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
