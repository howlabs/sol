import type { UnifiedHunkLine } from './agent-changes-types'

export type AskAgentSeedInput = {
  relativePath: string
  status?: string
  selectedLines?: readonly Pick<UnifiedHunkLine, 'kind' | 'text' | 'oldLine' | 'newLine'>[]
}

/**
 * Build a composer/agent prompt seed from a changed file (and optional line selection).
 */
export function buildAgentChangesAskAgentPrompt(input: AskAgentSeedInput): string {
  const path = input.relativePath.trim()
  if (!path) {
    return ''
  }

  const selected = input.selectedLines?.filter((line) => line.text !== undefined) ?? []
  if (selected.length === 0) {
    const statusSuffix = input.status ? ` (${input.status})` : ''
    return `Please review the local changes in \`${path}\`${statusSuffix} and fix or improve them.`
  }

  const body = selected
    .map((line) => {
      const lineNo = line.newLine ?? line.oldLine
      const prefix = line.kind === 'add' ? '+' : line.kind === 'del' ? '-' : ' '
      const loc = lineNo != null ? `L${lineNo}` : ''
      return `${loc}${loc ? ' ' : ''}${prefix}${line.text}`
    })
    .join('\n')

  return `Regarding \`${path}\`, please address this selection:\n\n\`\`\`diff\n${body}\n\`\`\``
}
