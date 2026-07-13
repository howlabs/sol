/**
 * Line-level LCS diff engine for the agent-changes panel.
 *
 * Pure: no I/O, no Monaco. Takes two arrays of lines and returns a flat
 * edit script (equal / del / add) that the hunk grouper turns into unified
 * diff hunks.
 */

export type EditOp =
  | { type: 'equal'; oldIndex: number; newIndex: number; text: string }
  | { type: 'del'; oldIndex: number; text: string }
  | { type: 'add'; newIndex: number; text: string }

export function computeLineEdits(oldLines: string[], newLines: string[]): EditOp[] {
  const n = oldLines.length
  const m = newLines.length
  if (n === 0 && m === 0) {
    return []
  }
  if (n === 0) {
    return newLines.map((text, newIndex) => ({ type: 'add' as const, newIndex, text }))
  }
  if (m === 0) {
    return oldLines.map((text, oldIndex) => ({ type: 'del' as const, oldIndex, text }))
  }

  // Strip common prefix/suffix to shrink DP.
  let prefix = 0
  while (prefix < n && prefix < m && oldLines[prefix] === newLines[prefix]) {
    prefix += 1
  }
  let suffix = 0
  while (
    suffix < n - prefix &&
    suffix < m - prefix &&
    oldLines[n - 1 - suffix] === newLines[m - 1 - suffix]
  ) {
    suffix += 1
  }

  const oldMid = oldLines.slice(prefix, n - suffix)
  const newMid = newLines.slice(prefix, m - suffix)
  const midEdits = computeMidEdits(oldMid, newMid, prefix)

  const edits: EditOp[] = []
  for (let i = 0; i < prefix; i += 1) {
    edits.push({ type: 'equal', oldIndex: i, newIndex: i, text: oldLines[i]! })
  }
  edits.push(...midEdits)
  for (let s = 0; s < suffix; s += 1) {
    const oldIndex = n - suffix + s
    const newIndex = m - suffix + s
    edits.push({
      type: 'equal',
      oldIndex,
      newIndex,
      text: oldLines[oldIndex]!
    })
  }
  return edits
}

function computeMidEdits(oldMid: string[], newMid: string[], indexOffset: number): EditOp[] {
  const n = oldMid.length
  const m = newMid.length
  if (n === 0) {
    return newMid.map((text, j) => ({
      type: 'add' as const,
      newIndex: indexOffset + j,
      text
    }))
  }
  if (m === 0) {
    return oldMid.map((text, i) => ({
      type: 'del' as const,
      oldIndex: indexOffset + i,
      text
    }))
  }

  // One-row rolling LCS length table is not enough for reconstruction; full
  // table is fine under AGENT_CHANGES_MAX_LINES_PER_SIDE.
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i -= 1) {
    const row = dp[i]!
    const nextRow = dp[i + 1]!
    const oldLine = oldMid[i]
    for (let j = m - 1; j >= 0; j -= 1) {
      if (oldLine === newMid[j]) {
        row[j] = nextRow[j + 1]! + 1
      } else {
        const down = nextRow[j]!
        const right = row[j + 1]!
        row[j] = down >= right ? down : right
      }
    }
  }

  const edits: EditOp[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (oldMid[i] === newMid[j]) {
      edits.push({
        type: 'equal',
        oldIndex: indexOffset + i,
        newIndex: indexOffset + j,
        text: oldMid[i]!
      })
      i += 1
      j += 1
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      edits.push({ type: 'del', oldIndex: indexOffset + i, text: oldMid[i]! })
      i += 1
    } else {
      edits.push({ type: 'add', newIndex: indexOffset + j, text: newMid[j]! })
      j += 1
    }
  }
  while (i < n) {
    edits.push({ type: 'del', oldIndex: indexOffset + i, text: oldMid[i]! })
    i += 1
  }
  while (j < m) {
    edits.push({ type: 'add', newIndex: indexOffset + j, text: newMid[j]! })
    j += 1
  }
  return edits
}
