/**
 * Shiki highlighter singleton for read-only code excerpts.
 *
 * Replaces `monaco.editor.colorize()` for notebook inactive cells and PR
 * comment code excerpts. Uses VS Code's `light-plus` / `dark-plus` themes
 * to stay visually close to Monaco's `vs` / `vs-dark`.
 *
 * Languages are loaded lazily — only the first excerpt for a given language
 * pays the grammar fetch cost.
 */

import { createHighlighter, type Highlighter, type ThemedToken } from 'shiki'

/** Per-line token array produced by Shiki. */
export type HighlightedLine = ThemedToken[]

export type HighlightResult = {
  lines: HighlightedLine[]
  bg: string
  fg: string
}

/** Languages pre-loaded at singleton creation — the common notebook/PR set. */
const PRELOADED_LANGS = [
  'python',
  'typescript',
  'javascript',
  'json',
  'bash',
  'shell',
  'markdown',
  'yaml',
  'html',
  'css',
  'sql',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'ruby',
  'php'
] as const

const LIGHT_THEME = 'light-plus'
const DARK_THEME = 'dark-plus'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [LIGHT_THEME, DARK_THEME],
    langs: [...PRELOADED_LANGS]
  })
  return highlighterPromise
}

/**
 * Map Monaco/Monarch language IDs to Shiki grammar IDs.
 * Most are identical; a few need translation.
 */
function monacoToShikiLang(language: string): string {
  const lower = language.toLowerCase()
  switch (lower) {
    case 'csharp':
      return 'csharp'
    case 'fsharp':
      return 'fsharp'
    case 'qsharp':
      return 'qsharp'
    case 'shell':
    case 'sh':
      return 'shell'
    case 'plaintext':
    case 'text':
    case 'txt':
      return 'text'
    case 'typescriptreact':
      return 'tsx'
    case 'javascriptreact':
      return 'jsx'
    default:
      return lower
  }
}

/**
 * Lazily load a language grammar if it's not already registered.
 * Falls back to `text` (plain) if the grammar is unavailable.
 */
async function ensureLanguage(highlighter: Highlighter, lang: string): Promise<string> {
  const shikiLang = monacoToShikiLang(lang)
  try {
    const loaded = highlighter.getLoadedLanguages()
    if (loaded.includes(shikiLang)) {
      return shikiLang
    }
    // Why: loadLanguage accepts BundledLanguage keys or LanguageRegistration;
    // cast through unknown because our runtime string may not be in the
    // static BundledLanguage union.
    await highlighter.loadLanguage(shikiLang as never)
    return shikiLang
  } catch {
    // Why: unknown language IDs from arbitrary PR file extensions should
    // not crash the excerpt — fall back to plain text.
    if (shikiLang !== 'text') {
      try {
        await highlighter.loadLanguage('text' as never)
      } catch {
        // ignore — text is always available
      }
    }
    return 'text'
  }
}

/**
 * Highlight code into per-line token arrays.
 * Returns an empty lines array for empty input.
 */
export async function highlightCode(
  code: string,
  language: string,
  isDark: boolean
): Promise<HighlightResult> {
  if (code.length === 0) {
    return { lines: [], bg: '', fg: '' }
  }
  const highlighter = await getHighlighter()
  const lang = await ensureLanguage(highlighter, language)
  const theme = isDark ? DARK_THEME : LIGHT_THEME
  const result = highlighter.codeToTokens(code, { lang: lang as never, theme })
  return {
    lines: result.tokens,
    bg: result.bg ?? '',
    fg: result.fg ?? ''
  }
}
