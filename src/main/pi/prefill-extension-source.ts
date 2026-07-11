import type { PiAgentKind } from '../../shared/pi-agent-kind'

export const ORCA_PI_PREFILL_EXTENSION_FILE = 'orca-prefill.ts'

// Why: prefill-without-submit needs an env-var the bundled `orca-prefill.ts`
// extension can read on session_start.
const PREFILL_ENV_VAR_BY_KIND: Record<PiAgentKind, string> = {
  pi: 'ORCA_PI_PREFILL'
}

/** Pi's prefill env var. Exported for callers that need the literal name
 *  (renderer draft-launch plan builder, tests). */
export const ORCA_PI_PREFILL_ENV_VAR = PREFILL_ENV_VAR_BY_KIND.pi

export function getPiPrefillExtensionSource(kind: PiAgentKind = 'pi'): string {
  const envVar = PREFILL_ENV_VAR_BY_KIND[kind]
  return [
    'export default function (pi) {',
    "  pi.on('session_start', async (event, ctx) => {",
    '    if (!process.env.ORCA_PANE_KEY) return',
    "    if (event.reason !== 'startup') return",
    `    const prefill = process.env.${envVar}`,
    '    if (!prefill) return',
    `    delete process.env.${envVar}`,
    '    try {',
    '      ctx.ui.setEditorText(prefill)',
    '    } catch {}',
    '  })',
    '}',
    ''
  ].join('\n')
}
