/**
 * Shared chrome for usage analytics inside Settings → Stats & Usage.
 *
 * Why: SettingsSection already provides the page card. Nested
 * rounded-lg + border + bg-card shells stacked panel → KPI → subpanel and
 * read as SaaS card soup. Keep stacks flat; one surface for list items only.
 */

/** Provider / analytics pane root: vertical rhythm only. */
export const USAGE_PANEL_SHELL_CLASS = 'space-y-1.5'

/** Chart, table, mix, intensity blocks: no second card — header + content. */
export const USAGE_SUBPANEL_SHELL_CLASS = 'space-y-1.5'

/**
 * Single quiet list tile (provider rows). One border max; never wrap another
 * card inside this shell.
 */
export const USAGE_LIST_ITEM_CLASS = 'rounded-md border border-border/50 bg-muted/15 px-2.5 py-2'
