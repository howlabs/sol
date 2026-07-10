/**
 * Base UI Select.Value shows raw option values unless Root receives `items`
 * (value → label). Build that map once from the same options rendered as
 * SelectItem children.
 */

export type SettingsSelectItem = { value: string; label: string }

export function settingsSelectItems(
  entries: readonly { value: string; label: string }[]
): SettingsSelectItem[] {
  return entries.map((entry) => ({ value: entry.value, label: entry.label }))
}

/** Convenience when value and label are the same string (e.g. distro names). */
export function settingsSelectItemsFromValues(values: readonly string[]): SettingsSelectItem[] {
  return values.map((value) => ({ value, label: value }))
}

export function settingsSelectItemsFromRecord(
  record: Readonly<Record<string, string>>
): SettingsSelectItem[] {
  return Object.entries(record).map(([value, label]) => ({ value, label }))
}
