/** Canonical GitHub release feed for Sol desktop auto-updates and release links. */
export const DESKTOP_RELEASE_GITHUB_OWNER = 'howlabs'
export const DESKTOP_RELEASE_GITHUB_REPO = 'sol'
export const DESKTOP_RELEASE_GITHUB_REPOSITORY = `${DESKTOP_RELEASE_GITHUB_OWNER}/${DESKTOP_RELEASE_GITHUB_REPO}`

const GITHUB_RELEASES_BASE = `https://github.com/${DESKTOP_RELEASE_GITHUB_REPOSITORY}/releases`

export const DESKTOP_RELEASE_ATOM_FEED_URL = `${GITHUB_RELEASES_BASE}.atom`
export const DESKTOP_RELEASE_DOWNLOAD_BASE = `${GITHUB_RELEASES_BASE}/download`
export const DESKTOP_RELEASE_LATEST_DOWNLOAD_URL = `${GITHUB_RELEASES_BASE}/latest/download`

export function getDesktopReleaseDownloadUrl(tag: string): string {
  return `${DESKTOP_RELEASE_DOWNLOAD_BASE}/${encodeURIComponent(tag)}`
}

export function getDesktopReleaseTagPageUrl(version: string): string {
  const normalized = version.replace(/^v/i, '')
  return `${GITHUB_RELEASES_BASE}/tag/v${normalized}`
}

export function getDesktopReleasesListingUrl(): string {
  return GITHUB_RELEASES_BASE
}

export function desktopReleaseTagHrefRegex(): RegExp {
  return new RegExp(
    `href="https:\\/\\/github\\.com\\/${DESKTOP_RELEASE_GITHUB_OWNER}\\/${DESKTOP_RELEASE_GITHUB_REPO}\\/releases\\/tag\\/([^"]+)"`,
    'g'
  )
}
