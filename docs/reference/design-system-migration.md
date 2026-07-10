# Design system migration: Mira · Stone · Phosphor · Base UI

Status: **Phase A + B landed** (stone tokens + Mira density). Phase C/D not started.

## Target

| Dimension        | Runtime now                         | Target                                      |
| ---------------- | ----------------------------------- | ------------------------------------------- |
| shadcn visual style | Mira density on Radix primitives | **Mira** full (`base-mira`)                 |
| Primitive library   | Radix (`radix-ui`)                | **Base UI** via shadcn `base-mira`          |
| Base color          | **Stone** oklch in `main.css`     | **Stone** (done)                            |
| Icons               | `lucide-react`                    | **Phosphor Icons** (`@phosphor-icons/react`) |

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

### Phase C — Icons: Phosphor (mechanical, high surface area)

1. Add `@phosphor-icons/react`.
2. Prefer **one weight** app-wide for chrome (e.g. regular; bold only for active/emphasis).
3. Migrate `src/renderer/src/components/ui/*` icons first (dialog close, etc.).
4. Migrate product files in batches (settings → sidebar → rest). Codemod Lucide names → Phosphor equivalents; leave unmapped icons explicit.
5. Remove `lucide-react` only when zero imports remain.

Done when: no `lucide-react` in `src/`; STYLEGUIDE forbids new Lucide imports.

### Phase D — Primitives: Base UI / `base-mira` (highest risk)

1. Install Base UI deps required by shadcn base-mira.
2. Re-add **one primitive at a time** with shadcn CLI (`button`, then `dialog`, then menus…), review API diffs vs Radix wrappers.
3. Keep public exports (`Button`, `Dialog`, …) stable for app code; fix call sites only when APIs diverge.
4. Pay special attention to: focus traps, portals in Electron, menu/context-menu, select, combobox/cmdk.
5. Drop `radix-ui` when no `ui/*` import remains.

Done when: `components/ui` is Base UI–backed; Radix is gone from renderer UI.

## Guardrails

- **One concern per PR** when possible (tokens **or** icons **or** one primitive family).
- New UI code must use `@/components/ui/*` + STYLEGUIDE tokens — no new hex for chrome roles.
- Settings forms: use `SettingsFormControls` first; do not invent parallel toggles/rows.
- Visual regression: Settings (General, Appearance, Accounts, Notifications, Integrations), command palette, dialogs, worktree sidebar.
- Cross-platform: Windows/Linux/macOS; Electron + web client if both share renderer UI.

## Suggested next implementation PR

Phase C: add `@phosphor-icons/react`, migrate `components/ui` icons first, then batch product files. No Base UI until Phase D.

## References

- shadcn create / styles (Mira = compact): [December 2025 changelog](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create)
- Base UI default direction: [July 2026 changelog](https://ui.shadcn.com/docs/changelog)
- Local style rules: [`docs/STYLEGUIDE.md`](../STYLEGUIDE.md)
- CLI config: [`components.json`](../../components.json)
