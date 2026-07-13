// Why: single source of truth for the commit trailer Sol appends when the
// "Sol Attribution" toggle (`enableGitHubAttribution`) is on. The prompt
// fragment is injected into the agent session preamble so the agent adds
// the trailer itself instead of relying on a PATH shim.

export const ORCA_GIT_COMMIT_TRAILER = 'Co-authored-by: Sol <hello@howlabs.ai>'

export function buildAttributionPromptFragment(): string {
  return `When you write or edit a git commit message, ensure the message ends with this trailer exactly once: ${ORCA_GIT_COMMIT_TRAILER}. Keep existing trailers, append at end if missing, don't duplicate, and keep one blank line between body and trailer.`
}
