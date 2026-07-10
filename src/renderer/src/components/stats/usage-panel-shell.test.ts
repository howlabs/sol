// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import {
  USAGE_LIST_ITEM_CLASS,
  USAGE_PANEL_SHELL_CLASS,
  USAGE_SUBPANEL_SHELL_CLASS
} from './usage-panel-shell'
import { StatCard } from './StatCard'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

describe('Stats & Usage surface chrome (no nested card stacks)', () => {
  it('keeps panel roots flat — spacing only, no border+bg card shell', () => {
    // Why: SettingsSection already supplies the page card; stacking another
    // rounded-lg border bg-card shell made Overview → KPI → chart triple-nested.
    for (const shell of [USAGE_PANEL_SHELL_CLASS, USAGE_SUBPANEL_SHELL_CLASS]) {
      expect(shell).toContain('space-y')
      expect(shell).not.toMatch(/\bborder\b/)
      expect(shell).not.toMatch(/bg-card/)
      expect(shell).not.toMatch(/rounded-lg/)
    }
  })

  it('allows a single quiet list-item surface for provider rows', () => {
    expect(USAGE_LIST_ITEM_CLASS).toMatch(/border-border/)
    expect(USAGE_LIST_ITEM_CLASS).toMatch(/rounded-md/)
    // One surface only — not the old panel+card stack tokens together.
    expect(USAGE_LIST_ITEM_CLASS).not.toMatch(/rounded-lg border border-border\/60 bg-card/)
  })

  it('renders StatCard as one muted tile without nested panel wrappers', () => {
    const markup = renderToStaticMarkup(
      createElement(StatCard, {
        label: 'Agents',
        value: '12',
        icon: createElement('span', { 'aria-hidden': true }, '•')
      })
    )
    expect(markup).toContain('Agents')
    expect(markup).toContain('12')
    // Single tile class vocabulary
    expect(markup).toMatch(/rounded-md border border-border\/50/)
    expect(markup).not.toMatch(/bg-card\/40/)
    expect(markup).not.toMatch(/rounded-lg border border-border\/60 bg-card/)
  })
})
