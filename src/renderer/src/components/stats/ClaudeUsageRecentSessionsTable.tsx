import type {
  ClaudeUsageSessionRow,
  ClaudeUsageSummary
} from '../../../../shared/claude-usage-types'
import { translate } from '@/i18n/i18n'
import { USAGE_SUBPANEL_SHELL_CLASS } from './usage-panel-shell'
import { formatSessionTime, formatTokens } from './usage-formatters'

export function ClaudeUsageRecentSessionsTable({
  recentSessions,
  summary
}: {
  recentSessions: ClaudeUsageSessionRow[]
  summary: ClaudeUsageSummary | null
}): React.JSX.Element {
  return (
    <section className={`${USAGE_SUBPANEL_SHELL_CLASS} space-y-1.5`}>
      <div className="space-y-0.5">
        <h4 className="text-xs font-semibold tracking-tight text-foreground">
          {translate('auto.components.stats.ClaudeUsagePane.7e76c84153', 'Recent sessions')}
        </h4>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {translate('auto.components.stats.ClaudeUsagePane.abfc4a4943', 'Cache reuse rate:')}{' '}
          {summary?.cacheReuseRate !== null && summary?.cacheReuseRate !== undefined
            ? `${Math.round(summary.cacheReuseRate * 100)}%`
            : translate('auto.components.stats.ClaudeUsagePane.7765a4c3e1', 'n/a')}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="px-2 py-2 font-medium">
                {translate('auto.components.stats.ClaudeUsagePane.01476891c7', 'Last active')}
              </th>
              <th className="px-2 py-2 font-medium">
                {translate('auto.components.stats.ClaudeUsagePane.c17bed0416', 'Project')}
              </th>
              <th className="px-2 py-2 font-medium">
                {translate('auto.components.stats.ClaudeUsagePane.1afc25eb06', 'Model')}
              </th>
              <th className="px-2 py-2 font-medium">
                {translate('auto.components.stats.ClaudeUsagePane.0f03975d59', 'Turns')}
              </th>
              <th className="px-2 py-2 font-medium">
                {translate('auto.components.stats.ClaudeUsagePane.faf3444859', 'Input')}
              </th>
              <th className="px-2 py-2 font-medium">
                {translate('auto.components.stats.ClaudeUsagePane.a8b7487ff7', 'Output')}
              </th>
              <th className="px-2 py-2 font-medium">
                {translate('auto.components.stats.ClaudeUsagePane.21ea00bfa8', 'Cache')}
              </th>
            </tr>
          </thead>
          <tbody>
            {recentSessions.map((row) => (
              <tr key={row.sessionId} className="border-b border-border/40 last:border-b-0">
                <td className="px-2 py-2 text-muted-foreground">
                  {formatSessionTime(row.lastActiveAt)}
                </td>
                <td className="px-2 py-2 text-foreground">{row.projectLabel}</td>
                <td className="px-2 py-2 text-muted-foreground">
                  {row.model ??
                    translate('auto.components.stats.ClaudeUsagePane.cfe2282ffa', 'Unknown')}
                </td>
                <td className="px-2 py-2 text-muted-foreground">{row.turns}</td>
                <td className="px-2 py-2 text-muted-foreground">{formatTokens(row.inputTokens)}</td>
                <td className="px-2 py-2 text-muted-foreground">
                  {formatTokens(row.outputTokens)}
                </td>
                <td className="px-2 py-2 text-muted-foreground">
                  {formatTokens(row.cacheReadTokens + row.cacheWriteTokens)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
