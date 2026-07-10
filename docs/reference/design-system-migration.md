# Design system migration: Mira · Stone · Phosphor · Base UI

Status: **Phases A–D landed** (stone + Mira density + Phosphor + Base UI primitives).

## Target

| Dimension        | Runtime now                         | Target                                      |
| ---------------- | ----------------------------------- | ------------------------------------------- |
| shadcn visual style | Mira density on Base UI            | **Mira** (`base-mira`)                      |
| Primitive library   | **Base UI** (`@base-ui/react`)     | **Base UI** (done; `radix-ui` removed)      |
| Base color          | **Stone** oklch in `main.css`     | **Stone** (done)                            |
| Icons               | **`@/lib/icons` → Phosphor**      | **Phosphor** (done; Lucide names retained)  |

Why this combo for Sol:

- **Mira** matches a dense IDE/settings surface (compact controls, tight padding).
- **Stone** keeps monochrome chrome while shifting from pure neutral gray toward a slightly warmer tool palette without going cream/sand.
- **Phosphor** is a full icon family with regular/bold weights suitable for status + settings chrome.
- **Base UI** is the current shadcn default path; new primitives should not deepen the Radix dependency.

## Non-goals (this migration)

- No big-bang rewrite of all settings panes or product screens in one PR.
- Do not re-theme Monaco, xterm, or markdown preview palettes as part of chrome migration.
- Do not invent parallel design tokens outside `main.css` / STYLEGUIDE roles.
- Do not run a full `shadcn add --overwrite` of every primitive until Phase C is intentional.

## Source of truth during migration

| Artifact            | Role                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| `components.json`   | **Target** for new shadcn CLI adds (`base-mira`, stone, phosphor)    |
| `src/renderer/src/components/ui/*` | **Runtime** primitives (still Radix + Lucide until replaced) |
| `src/renderer/src/assets/main.css` | Token source of truth; stone lands here first                |
| `docs/STYLEGUIDE.md` | Visual/UX rules; documents target + “prefer house form grammar”    |

Until a primitive is migrated, treat existing `ui/*` APIs as stable. App code should keep importing `@/components/ui/*` and house form controls in `SettingsFormControls.tsx`.

## Phased plan

### Phase A — Tokens: Stone base color (low risk) — **done**

1. Mapped shadcn **stone** CSS variables into `:root` / `.dark` in `main.css` (oklch).
2. Preserved Sol-only tokens (git decorations, editor-surface, terminal title colors, status-success).
3. Worktree/sidebar chrome derived from the stone ramp; dark `sidebar-primary` stays monochrome (no default purple).
4. No product-feature rewrites beyond CSS.

### Phase B — Density: Mira-aligned chrome (medium risk) — **done**

1. `--radius` → `0.5rem`.
2. Button/input/select/tabs/command density aligned to Mira (`h-7` default controls, `text-xs` labels).
3. Settings form grammar tightened (`SettingsRow`, switch, segmented control, subsection headers).
4. Still on Radix primitives (no Base UI yet).

### Phase C — Icons: Phosphor (mechanical, high surface area) — **done**

1. Added `@phosphor-icons/react`.
2. Default weight **`regular`** (loaders use **`bold`**).
3. Generated Lucide-compatible bridge: `src/renderer/src/lib/icons.tsx` (~310 Lucide export names).
4. Codemod rewrote app imports to `@/lib/icons` (~407 files); test mocks updated.
5. Removed `lucide-react` dependency.

Call sites keep Lucide icon **names** (`Loader2`, `ChevronDown`, …) for a stable API; glyphs are Phosphor.

### Phase D — Primitives: Base UI / `base-mira` (highest risk) — **done**

1. Installed `@base-ui/react`.
2. Migrated `src/renderer/src/components/ui/*` off `radix-ui` onto Base UI (button, dialog, sheet, select, menus, popover, tooltip, tabs, accordion, scroll-area, etc.).
3. Preserved Sol-specific behavior: Electron `WebkitAppRegion: no-drag`, popover wheel shim, translucent floating surfaces, i18n close labels.
4. Kept call-site compatibility shims: `asChild` → Base UI `render`, `delayDuration` → `delay`, `VisuallyHidden.Root` local reimplementation.
5. Removed `radix-ui` package.

Remaining polish (optional): tighten any residual `data-[state=*]` selectors still present in product CSS, and re-verify heavy dialog/menu flows in Electron.

## Guardrails

- **One concern per PR** when possible (tokens **or** icons **or** one primitive family).
- New UI code must use `@/components/ui/*` + STYLEGUIDE tokens — no new hex for chrome roles.
- Settings forms: use `SettingsFormControls` first; do not invent parallel toggles/rows.
- Visual regression: Settings (General, Appearance, Accounts, Notifications, Integrations), command palette, dialogs, worktree sidebar.
- Cross-platform: Windows/Linux/macOS; Electron + web client if both share renderer UI.

## Suggested next implementation PR

Optional hardening: Electron smoke of command palette, context menus, select portals, and sheet drawers after Base UI; fix any remaining `data-state` vs `data-open` animation mismatches.

## References

- shadcn create / styles (Mira = compact): [December 2025 changelog](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create)
- Base UI default direction: [July 2026 changelog](https://ui.shadcn.com/docs/changelog)
- Local style rules: [`docs/STYLEGUIDE.md`](../STYLEGUIDE.md)
- CLI config: [`components.json`](../../components.json)
