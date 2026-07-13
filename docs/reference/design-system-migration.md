# Design system migration: Mira · Stone · Phosphor · Base UI

Status: **Phases A–F landed** (stone + Mira density + Phosphor + Base UI + hardening + Radix focus/dismiss shims).

## Target

| Dimension           | Runtime now                    | Target                                     |
| ------------------- | ------------------------------ | ------------------------------------------ |
| shadcn visual style | Mira density on Base UI        | **Mira** (`base-mira`)                     |
| Primitive library   | **Base UI** (`@base-ui/react`) | **Base UI** (done; `radix-ui` removed)     |
| Base color          | **Stone** oklch in `main.css`  | **Stone** (done)                           |
| Icons               | **`@/lib/icons` → Phosphor**   | **Phosphor** (done; Lucide names retained) |

Why this combo for Sol:

- **Mira** matches a dense IDE/settings surface (compact controls, tight padding).
- **Stone** keeps monochrome chrome while shifting from pure neutral gray toward a slightly warmer tool palette without going cream/sand.
- **Phosphor** is a full icon family with regular/bold weights suitable for status + settings chrome.
- **Base UI** is the current shadcn default path; new primitives should not deepen the Radix dependency.

## Non-goals (this migration)

- No big-bang rewrite of all settings panes or product screens in one PR.
- Do not re-theme CodeMirror, xterm, or markdown preview palettes as part of chrome migration.
- Do not invent parallel design tokens outside `main.css` / STYLEGUIDE roles.
- Do not run a full `shadcn add --overwrite` of every primitive until Phase C is intentional.

## Source of truth during migration

| Artifact                           | Role                                                              |
| ---------------------------------- | ----------------------------------------------------------------- |
| `components.json`                  | **Target** for new shadcn CLI adds (`base-mira`, stone, phosphor) |
| `src/renderer/src/components/ui/*` | **Runtime** primitives (Base UI + Phosphor via `@/lib/icons`)     |
| `src/renderer/src/assets/main.css` | Token source of truth; stone + positioner/collapsible CSS vars    |
| `docs/STYLEGUIDE.md`               | Visual/UX rules; documents target + “prefer house form grammar”   |

Treat existing `ui/*` APIs as stable. App code should keep importing `@/components/ui/*` and house form controls in `SettingsFormControls.tsx`.

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

### Phase E — Base UI hardening (positioners + open/pressed) — **done**

1. **CSS variables** on product surfaces and `main.css`:
   - `--available-height` / `--available-width` / `--anchor-width` / `--collapsible-panel-height` (Base UI positioners)
   - Temporary dual `--radix-*` fallbacks were removed after call sites and CSS only consumed Base UI vars
2. **Open/closed state**: collapsible height animations accept both `data-open`/`data-closed` and `data-state=open|closed`.
3. **Toggle pressed**: primitive + call-site selected styles accept `data-pressed` (and `aria-pressed` where already present) alongside `data-[state=on]`.
4. **Modal recovery**: body `pointer-events` recovery watches Base UI `data-open` on dialog/sheet slots (still accepts `data-state=open`).
5. **ScrollArea**: restored `viewportProps` + root style merge (`position: relative` always wins) so font autocomplete and other clamps reach the viewport.
6. Tests assert Base UI `maxHeight` vars on font autocomplete scroll areas.

### Phase F — Radix focus/dismiss API shims (call-site compatibility) — **done**

1. Shared helper `components/ui/radix-popup-compat.tsx`:
   - `onOpenAutoFocus` / `onCloseAutoFocus` → Base UI `initialFocus` / `finalFocus` (respect `preventDefault`; side effects still run)
   - `onInteractOutside` / `onPointerDownOutside` / `onFocusOutside` / `onEscapeKeyDown` → Root `onOpenChange` + `details.cancel()`
   - Content registers dismiss handlers via **`useLayoutEffect`** + stable ref (safe on first open; no re-register storm from inline handlers)
2. Wired into **Popover**, **Dialog**, **Sheet**, **DropdownMenu**, **ContextMenu** content + roots.
3. `asChild` triggers/anchors set `nativeButton={false}` when the child is not a native `<button>` (silences Base UI warnings; FontAutocomplete anchors).
4. Command palette forwards open/close autofocus handlers to `DialogContent` (typed, no cast).
5. Terminal pane-title tooltip open styles accept `data-open` alongside Radix `data-state`.
6. Unit + integration coverage: prop stripping from dialog DOM, focus side-effect mapping, dismiss cancel reasons.

**Verified call-site families (still use Radix names; shims apply):** dialogs (discard/confirm, settings, worktree), popover comboboxes (settings font, repos, automations), context menus (terminal, file explorer, tabs), dropdown menus (notes send, browser), command palette / Quick Open.

## Guardrails

- **One concern per PR** when possible (tokens **or** icons **or** one primitive family).
- New UI code must use `@/components/ui/*` + STYLEGUIDE tokens — no new hex for chrome roles.
- Settings forms: use `SettingsFormControls` first; do not invent parallel toggles/rows.
- Settings pane bodies must pick one STYLEGUIDE **Settings pane template** (form-list / collection-accordion / setup-skill); no ad-hoc `space-y-8+` roots or one-off `text-sm` subsection titles on form/collection surfaces.
- Positioned popovers/selects: use Base UI vars only (`--available-height`, `--anchor-width`); do not reintroduce `--radix-*` fallbacks.
- Toggle selected chrome: include `data-pressed:` (Base UI) when overriding pressed styles; `data-[state=on]:` alone is insufficient.
- Visual regression: Settings (General, Appearance, Accounts, Notifications, Integrations), command palette, dialogs, worktree sidebar.
- Cross-platform: Windows/Linux/macOS; Electron + web client if both share renderer UI.

## Suggested next implementation PR

Design-system migration **A–F is complete**. Optional only: Electron smoke of command palette, context menus, select portals, sheet drawers, and toggle groups. Prefer Base UI-native props (`initialFocus`, `finalFocus`, Root `onOpenChange` cancel) for **new** code; Radix-named shims remain for existing call sites.

## References

- shadcn create / styles (Mira = compact): [December 2025 changelog](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create)
- Base UI default direction: [July 2026 changelog](https://ui.shadcn.com/docs/changelog)
- Local style rules: [`docs/STYLEGUIDE.md`](../STYLEGUIDE.md)
- CLI config: [`components.json`](../../components.json)
