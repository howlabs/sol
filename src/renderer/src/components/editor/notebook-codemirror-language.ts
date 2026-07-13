/**
 * Map notebook kernel language IDs to CodeMirror 6 language extensions.
 *
 * Only the most common notebook languages are bundled. Unknown languages
 * fall back to plain text (no syntax highlighting).
 */

import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { php } from '@codemirror/lang-php'
import { yaml } from '@codemirror/lang-yaml'
import { xml } from '@codemirror/lang-xml'
import type { Extension } from '@codemirror/state'

export function notebookLanguageExtension(language: string): Extension[] {
  const lower = language.toLowerCase()
  switch (lower) {
    case 'python':
    case 'py':
      return [python()]
    case 'javascript':
    case 'js':
      return [javascript()]
    case 'typescript':
    case 'ts':
      return [javascript({ typescript: true })]
    case 'jsx':
      return [javascript({ jsx: true })]
    case 'tsx':
      return [javascript({ jsx: true, typescript: true })]
    case 'json':
      return [json()]
    case 'markdown':
    case 'md':
      return [markdown()]
    case 'sql':
      return [sql()]
    case 'css':
    case 'scss':
    case 'less':
      return [css()]
    case 'html':
    case 'xml':
      return lower === 'xml' ? [xml()] : [html()]
    case 'rust':
    case 'rs':
      return [rust()]
    case 'go':
    case 'golang':
      return [go()]
    case 'java':
      return [java()]
    case 'c':
    case 'cpp':
    case 'c++':
      return [cpp()]
    case 'php':
      return [php()]
    case 'yaml':
    case 'yml':
      return [yaml()]
    default:
      // Why: unknown kernel languages get plain editing without syntax
      // highlighting — better than crashing on an unsupported grammar.
      return []
  }
}
