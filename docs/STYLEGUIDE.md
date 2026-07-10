# Orca UI Style Guide

This is the **UI/visual design** doc for Orca — color tokens, typography, component selection, and UX rules. It is _not_ an architecture doc; for system-level design see code and inline comments. Token values live in `src/renderer/src/assets/main.css` (canonical); this file documents the _roles and rules_ for using them.

## Overview

Orca is an Electron desktop app for orchestrating coding agents across git worktrees. The visual identity is **monochrome and quiet** — neutral grays carry the chrome, color is reserved for state (selection ring, destructive, git decorations). The product spends most of its time hosting other people's tools (Monaco, xterm, Markdown previews), so Orca's own UI should recede and frame.

When in doubt:

- Reach for **muted/accent/border** before reaching for color.
- Reach for **CSS variables** before hardcoding hex.
- Match the nearest **shadcn primitive** before writing custom CSS.
- Prefer house form controls in `SettingsFormControls.tsx` over one-off settings rows/toggles.

## Design system target (migration in progress)

Target stack for app chrome (not Monaco/xterm content surfaces):

| Dimension     | Target                         | Notes |
| ------------- | ------------------------------ | ----- |
| Visual style  | **shadcn Mira** (compact)      | Dense IDE/settings density |
| Primitives    | **Base UI** via `base-mira`    | `@base-ui/react` |
| Base color    | **Stone**                      | CSS variables in `main.css` |
| Icons         | **Phosphor Icons**             | via `@/lib/icons` |

**Runtime progress (A–E done):**

- **Phase A:** chrome tokens use **stone** (oklch) in `main.css`.
- **Phase B:** **Mira density** on shared controls (radius, button/input/select/tabs/settings rows).
- **Phase C:** icons via **`@/lib/icons`** → **Phosphor** (`regular` weight). Lucide package removed.
- **Phase D:** `components/ui` on **Base UI** (`@base-ui/react`). `radix-ui` package removed.
- **Phase E:** positioner CSS vars (`--available-height` / `--anchor-width` / `--collapsible-panel-height`), open/pressed state selectors (`data-open` / `data-pressed`). Dead `--radix-*` CSS fallbacks removed once producers were Base UI only.
- **Phase F done:** Radix focus/dismiss content props (`onOpenAutoFocus`, `onInteractOutside`, …) shimmed to Base UI on shared primitives (`radix-popup-compat`).

`components.json` records the full target (`style: base-mira`, `baseColor: stone`, `iconLibrary: phosphor`).

Phased plan, guardrails, and non-goals: [`docs/reference/design-system-migration.md`](./reference/design-system-migration.md).

Rules for new UI:

- Do **not** import Lucide or Phosphor ad hoc — use **`@/lib/icons`**.
- Do **not** import Base UI or Radix from app features — only through `@/components/ui/*`.
- Popover/select max-height and trigger width: use Base UI vars only (`--available-height`, `--anchor-width`). Do not add new `--radix-*` fallbacks.
- Toggle selected styles must include **`data-pressed:`** (Base UI), not only `data-[state=on]:`.
- Prefer Base UI focus/dismiss APIs for new code (`initialFocus` / `finalFocus` / Root `onOpenChange` + `cancel`). Existing Radix-named props still work via Phase F shims.

## Source of truth

| Concern                                       | Canonical location                                    |
| --------------------------------------------- | ----------------------------------------------------- |
| Color tokens                                  | `src/renderer/src/assets/main.css` (`:root`, `.dark`) |
| Tailwind theme bindings                       | Same file, `@theme inline { … }` block                |
| Component primitives                          | `src/renderer/src/components/ui/` (shadcn-style)      |
| Settings form grammar                         | `src/renderer/src/components/settings/SettingsFormControls.tsx` |
| shadcn CLI target config                      | `components.json`                                     |
| Migration plan                                | `docs/reference/design-system-migration.md`           |
| App typography / scrollbars / titlebar chrome | Same `main.css`                                       |

Never hardcode a hex value in component code if a variable already covers it. If a new token is needed, add it to `main.css` (both `:root` and `.dark`), expose it in the `@theme inline` block, then use it.

## Settings pane templates

Every Settings content pane (body under `SettingsSection`) must pick **one** layout template. Do not invent a fourth spacing/title scale.

| Template | Use when | Density / chrome | Headers & rows |
| -------- | -------- | ---------------- | -------------- |
| **form-list** | Toggle/input/select rows, preference lists (General, Advanced, Notifications, Git rows, Privacy, Input, …) | Root stack **`space-y-1`**; subsection blocks **`space-y-1.5`** | `SettingsSubsectionHeader` + `SettingsRow` / `SettingsSwitchRow` / house selects. No one-off `text-sm font-medium` section titles. |
| **collection / accordion** | Grouped cards or expanders (Appearance sections, Integrations cards, Tasks providers, Accounts provider blocks) | Root **`space-y-1`** between groups; cards `rounded-lg border border-border/60 bg-card/30` (or `integration-card-shell`) | Accordion titles match compact `text-xs font-semibold` + optional `text-[11px]` summary. Prefer house switches/rows inside expanded bodies. |
| **setup / skill** | Install/setup flows, multi-step skill panels, orchestration onboarding (Ephemeral VMs skill, Orchestration, Agent skill terminals, Developer Permissions grant lists) | Root **`space-y-4`–`space-y-6`** only (never `space-y-8`+ / `space-y-10` without a short in-code “Why: setup/skill template” comment). Inner cards may use `p-3`/`p-4` | May use short prose + primary CTAs; still prefer `SettingsSubsectionHeader` scale (`text-xs` title / `11px` description) over `text-sm` ad-hoc headers when labeling a block. |

### Rules for all templates

- **Page chrome** stays on `SettingsSection` (`h2` + description + body card). Do not re-create a second page-level title inside the pane.
- **`SearchableSetting`** is search metadata only — it does **not** render title/description. Visible labels come from `SettingsSubsectionHeader`, `SettingsRow`, accordion rows, or card chrome.
- **Easter-egg / quiet controls** (e.g. Appearance App Icon carousel): keep `SearchableSetting` title/description for search; **do not** stack a formal `SettingsSubsectionHeader` that duplicates that copy.
- **Do not** use extreme root gaps (`space-y-8`, `space-y-10`) on form-list or collection panes. If a setup/skill pane needs air, cap at `space-y-6` and document the template in a one-line Why comment.
- Prefer `SettingsFormControls` over bespoke label/switch markup. New Settings UI must match one of the three templates above.

## Color roles

Tokens come in pairs: a **surface** and a **foreground** that meets contrast on it. Always use them together.

| Role                                     | Use it for                                                  | Don't use it for                                    |
| ---------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `background` / `foreground`              | App canvas, default text                                    | Cards, popovers, sidebar (have their own)           |
| `card` / `card-foreground`               | Panels lifted off the canvas                                | The canvas itself                                   |
| `popover` / `popover-foreground`         | Floating menus, dropdowns, hovercards                       | Inline UI                                           |
| `primary` / `primary-foreground`         | The single affirmative action in a flow (Save, Confirm)     | Decorative accents; hover states; secondary actions |
| `secondary` / `secondary-foreground`     | Lower-emphasis actions next to a primary                    | The affirmative action                              |
| `muted` / `muted-foreground`             | De-emphasized text, captions, placeholders, disabled chrome | Body copy; primary actions                          |
| `accent` / `accent-foreground`           | Hover/active backgrounds for ghost buttons and list rows    | Solid filled buttons (use `secondary` instead)      |
| `destructive` / `destructive-foreground` | Delete, discard, irreversible-action buttons; error states  | Cancel buttons (Cancel is not destructive)          |
| `border`                                 | All hairlines: dividers, input outlines, card edges         | Heavy emphasis; that's `ring`                       |
| `input`                                  | Form field background only                                  | Anywhere outside form fields                        |
| `ring`                                   | Focus-visible outlines, active selection halos              | Persistent decoration                               |
| `sidebar` (+ variants)                   | The worktree sidebar and its children                       | Other panels                                        |
| `editor-surface`                         | Background of Monaco / markdown editor panes                | App chrome                                          |

The `sidebar` family expands into `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, and `--sidebar-ring` — use them inside the worktree sidebar so its hover/selected/focus states stay consistent and don't bleed into other panels. `editor-surface` is its own token (not just `background`) because Monaco and the markdown editor have a slightly darker surface in dark mode to match VS Code conventions; reach for it whenever you're rendering an editor pane.

### Git decoration colors

For diff status, file-tree decorations, and the changes view, use the git decoration tokens (mirroring VS Code's palette so users transferring from VS Code aren't surprised):

| Token                        | State          |
| ---------------------------- | -------------- |
| `--git-decoration-added`     | Added / new    |
| `--git-decoration-modified`  | Modified       |
| `--git-decoration-deleted`   | Deleted        |
| `--git-decoration-renamed`   | Renamed        |
| `--git-decoration-untracked` | Untracked      |
| `--git-decoration-copied`    | Copied         |
| `--git-decoration-ignored`   | Ignored by git |

Use these _only_ for git status. Don't reuse them for unrelated state colors — that breaks the convention.

### List rows: hover, selected, current

A common point of drift. Use these conventions for any list-style row (worktrees, command palette items, settings nav):

- **Idle:** transparent background.
- **Hover:** `bg-accent` (in the worktree sidebar, `bg-sidebar-accent`).
- **Keyboard-selected (cmdk highlight):** `data-[selected=true]:bg-accent` plus a `border-border` outline so the active row stays visible while the user types. The `data-selected` attribute is set by `cmdk` automatically.
- **Persistent "current" / "active" row** (e.g. the worktree the user is viewing): also `bg-accent`, _plus_ a `data-current="true"` attribute so CSS or future styling can distinguish it from the cmdk highlight.
- **Worktree left rail paint:** use `worktree-sidebar-*` tokens (`bg-worktree-sidebar-accent`, hover `/60`, ring `worktree-sidebar-ring`) — not generic `sidebar-*` — for row backgrounds and rings on that rail (including Settings nav when it reuses the rail surface).
- **Worktree card current:** a persistent current worktree may set `data-current="true"` and/or `data-worktree-card-active` (alongside or instead of only relying on class names).
- **Don't:** hardcode `bg-[#ededed]` / `bg-[#333333]` or invent a "selected" color. The accent token already adapts to light/dark and matches the rest of the app.

### Color mixing

When you need a tint (e.g. a 12% primary wash on hover), use `color-mix` against the existing token, not a new hex:

```css
background: color-mix(in srgb, var(--primary) 12%, var(--background));
```

This keeps light/dark parity automatic.

## Typography

- **Family:** `Geist` is loaded as a single variable woff2 (weight range 100–900). Always reach for `Geist` for sans, never `Inter` or system sans.
- **Mono:** `var(--font-mono)` — used for paths, terminal-adjacent UI, code, and anywhere monospace conveys "this is literal."
- **Body letter-spacing:** `0.01em` (set globally on `body`). Don't override per component.
- **Sizes:** Tailwind's default scale. Common sizes in this repo:
  - 11px (uppercase meta, sidebar headers, captions) — pair with `font-weight: 600` and `text-transform: uppercase` and `letter-spacing: 0.05em` for category labels.
  - 12px (`text-xs`) — control labels, Mira button default, paths, secondary content
  - 13px (sidebar items, dense list rows)
  - 14px (default body where density is not constrained)

## Radius

`--radius: 0.5rem` (8px) is the Mira-aligned base; the rest are computed (`--radius-sm` = 0.6×, `--radius-md` = 0.8×, `--radius-lg` = 1×, `--radius-xl` = 1.4×, etc.). Buttons and inputs use `rounded-md`; the `Card` primitive uses `rounded-xl`; badges use `rounded-full`. Match the existing primitive's radius rather than introducing a new one.

## Control density (Mira Phase B)

Default control height is **compact**:

| Control | Default height |
| ------- | -------------- |
| Button `default` | `h-7` (28px) |
| Button `sm` / `xs` | `h-6` / `h-5` |
| Input | `h-7` |
| Select trigger | `h-7` (`sm` = `h-6`) |
| Settings switch | `h-4` track |

Prefer these sizes for settings and chrome. Only use larger sizes when the surface is marketing-like or a sparse empty state.

## Elevation & shadows

Orca uses shadows sparingly. Three levels in practice:

1. **Inset hairline** — `border` + `border` token. The default. Almost everything sits at this level.
2. **Subtle lift** — `shadow-xs` + a single-token border. Outline buttons, embedded cards.
3. **Floating** — `0 10px 24px rgba(0, 0, 0, 0.18)`. Popovers, popups that escape the editor surface. Reserved.

Don't add a fourth level. If something needs more emphasis than "floating," you're probably reaching for the focus `ring` instead.

## Components

Use the shadcn primitives in `src/renderer/src/components/ui/` before writing anything custom. The shadcn-style wrappers in this folder follow a consistent pattern:

- Most carry a `data-slot="<name>"` attribute on their root for CSS targeting — do not strip it. (The non-shadcn helpers in this folder — `sonner`, `repo-multi-combobox`, `team-multi-combobox` — don't follow this pattern and shouldn't be modeled when adding new primitives that should.)
- Use `cn()` for class merging. Pass user `className` last so callers can override.
- Use `class-variance-authority` (CVA) for variants when there are multiple.

### Buttons (`button.tsx`)

Variants in priority order:

| Variant       | Use case                                                           |
| ------------- | ------------------------------------------------------------------ |
| `default`     | The single affirmative action in a flow.                           |
| `secondary`   | Lower-emphasis sibling next to a `default`.                        |
| `outline`     | Toolbar / standalone actions where a filled button feels heavy.    |
| `ghost`       | Icon buttons, list-row triggers, anywhere chrome should disappear. |
| `link`        | Inline text actions inside paragraphs.                             |
| `destructive` | Delete, discard, irreversible. Never for Cancel.                   |

Sizes: `default` (36px), `sm` (32px), `xs` (24px), `lg` (40px), plus `icon`, `icon-xs`, `icon-sm`, `icon-lg`. Match the size to the surrounding row height — don't drop a `default` button into a 28px toolbar.

### Other primitives in this repo

Browse `src/renderer/src/components/ui/` for the full list. Most wrap a Radix UI primitive — exceptions are `command` (wraps `cmdk`), `sonner` (wraps `sonner`), and the visual-only wrappers (`badge`, `button-group`, `card`, `input`) which apply tokens and Tailwind utilities directly. Never reimplement headless behavior; extend the existing wrapper.

### Picking the right primitive

When a control has multiple plausible primitives, use this fork:

| You want…                                                    | Reach for                                                            | Don't use                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------- |
| Hover-only label on an icon-only button                      | `Tooltip`                                                            | `HoverCard` (too heavy), title attr   |
| Hover preview of richer content (avatar + summary)           | `HoverCard`                                                          | `Tooltip` (no rich content)           |
| Click-revealed menu with actions                             | `DropdownMenu`                                                       | `Popover` with hand-rolled list       |
| Right-click contextual actions                               | `ContextMenu`                                                        | `DropdownMenu` (different invocation) |
| Click-revealed surface with arbitrary content (form, picker) | `Popover`                                                            | `Dialog` (it traps focus and dims)    |
| Modal that demands a decision before you continue            | `Dialog`                                                             | `Popover`, inline overlay             |
| Drawer / panel sliding in from an edge                       | `Sheet`                                                              | `Dialog` centered                     |
| Single choice from a known list                              | `Select`                                                             | Custom listbox                        |
| Single choice with search / fuzzy filtering                  | `Command` inside `Popover`                                           | `Select` (no search)                  |
| Multi-select with search                                     | `repo-multi-combobox` / `team-multi-combobox` (mirror their pattern) | Roll a new one                        |
| Transient confirmation ("Saved", "Copied")                   | `sonner` toast                                                       | `Dialog`, inline banner               |
| Persistent inline status ("3 errors")                        | inline text + `Badge`                                                | toast (toasts disappear)              |

If you find yourself styling around a primitive (`<Popover>` to act like a `<Dialog>`, or vice versa), stop and reconsider — the focus-management semantics differ and a future contributor will be misled by the mismatch.

### Tooltips

Tooltips exist to _name_ a control whose meaning isn't obvious from its appearance. They are not the place to teach, persuade, or warn — anything users need to read while acting belongs in the visible UI.

- **Use a tooltip when:** an icon-only button or compact chip needs a label. Toolbar icons, badges with abbreviations, truncated paths.
- **Don't use a tooltip when:** the control already has a visible label, the content is interactive (links, buttons), or the message is critical (errors, blocking warnings — those go inline).
- **Mounting:** the global `<TooltipProvider delayDuration={400}>` lives at the App root. Don't nest a second `TooltipProvider` unless you need a different delay for a tightly-scoped surface.
- **Trigger pattern:** wrap the trigger element with `<TooltipTrigger asChild>` so the tooltip's accessibility props attach to the button (not a wrapper span). This is required for keyboard focus to surface the tooltip.
- **Placement:** default `side="top" sideOffset={4}` — match the toolbar pattern in `sidebar/SidebarToolbar.tsx`. Pick a different side only when the default would clip against the viewport.
- **Shortcut chips inside tooltips:** if the action has a keyboard shortcut, append `<ShortcutKeyCombo />` rather than baking the keys into the label string. The chips render correctly per platform; baked-in strings drift.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" onClick={openSettings}>
      <Settings />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="top" sideOffset={4}>
    Settings
  </TooltipContent>
</Tooltip>
```

### Icons

Icons come from **Phosphor** via the Lucide-compatible bridge at **`@/lib/icons`** (backed by `@phosphor-icons/react`). Do **not** import `lucide-react` or import Phosphor icons ad hoc from app features — use the bridge so names and default weight stay consistent.

- **Import:** `import { Search, Loader2 } from '@/lib/icons'`
- **Default weight:** `regular` (loaders use `bold` so the spinner reads at small sizes).
- **Default size:** `size-4` (16px) via className. Icons default to `size="1em"` so Tailwind `size-*` classes control display size. Buttons apply `[&_svg:not([class*='size-'])]:size-3.5` (Mira density).
- **`size-3` / `size-3.5`:** for metadata, captions, and dense list rows where 16px is too loud.
- **`size-7`+:** for featured/empty-state hero icons only.
- **Color:** inherit from surrounding text — `text-muted-foreground` for secondary, `text-destructive` for destructive, etc. Don't apply a token to the SVG directly when the parent already carries the right color.
- **Spinner:** the canonical loading icon is `<Loader2 className="size-4 animate-spin" />`. For 3s+ multi-step work, prefer a label that names the stage ("Cloning…" → "Installing…") over an unlabeled spinner. See _UX rule 1_.

### Keyboard shortcut chips

Use **`<ShortcutKeyCombo />`** from `src/renderer/src/components/ShortcutKeyCombo.tsx`. It renders a consistent key-cap style and inserts a `+` separator on Windows/Linux (Mac shows adjacent glyphs, no separator). It does **not** transform key strings — the _caller_ picks the platform-appropriate labels and passes them in:

```tsx
const isMac = navigator.userAgent.includes('Mac')
const mod = isMac ? '⌘' : 'Ctrl'
const shift = isMac ? '⇧' : 'Shift'
<ShortcutKeyCombo keys={[mod, shift, 'N']} />
```

See `Landing.tsx` for the canonical pattern. Don't roll a one-off `<kbd>` — kbd chips drift in shape and color across the app fast if everyone styles their own.

**Where shortcuts surface in the UI:**

- **Tooltips on icon buttons** — append the chip after the label, trailing.
- **Dropdown / context-menu items** — use `<DropdownMenuShortcut>` (or its context-menu equivalent) for the right-aligned chip; don't position one yourself.
- **Never on Cancel, Dismiss, or `link`-variant inline actions** — see _UX rule 3_.

**The label MUST match the actual binding for the platform.** If the keyboard handler reads `metaKey` on Mac and `ctrlKey` elsewhere, the chip must show `⌘` on Mac and `Ctrl` elsewhere. Mismatched chips are worse than no chip.

### Form anatomy

The pattern in `src/renderer/src/components/settings/SettingsFormControls.tsx` is the house style for any label + control + helper text. Match it for new forms:

- **Outer stack:** `space-y-3` for full-section forms (`ThemePicker`); `space-y-2` for compact single-control fields (`ColorField`, `NumberField`). Pick by density, not preference.
- **Label group:** `space-y-1` containing `<Label>` and a description in `text-xs text-muted-foreground`.
- **Control:** the shadcn primitive (`<Input>`, `<Select>`, etc.). Errors surface via `aria-invalid`; the input primitive already maps that to a destructive ring — don't paint your own.
- **Trailing metadata:** `text-[11px] text-muted-foreground` below the control (e.g., "Current: 14px · Default: 13px"), not next to the label.

### Scrollbars

Three scrollbar classes are defined globally in `main.css`:

- **`.scrollbar-sleek`** — the default thin, neutral scrollbar for sidebars, lists, popovers. Pair with `.scrollbar-sleek-parent` on a hover-target ancestor if you want the thumb to fade in only on parent hover.
- **`.scrollbar-editor`** — slightly heavier, used inside Monaco-adjacent surfaces.
- **`.worktree-sidebar-scrollbar`** — reserves the gutter but keeps the thumb invisible until the parent (`.scrollbar-sleek-parent`) is hovered. Used only in the worktree sidebar so the chrome stays still.

Apply one of these to overflow containers; don't write a fourth style.

## UX rules

These are the rules a contributor will most often get wrong if they're working in isolation. They apply to every UI change.

**UI copy must not overclaim.** Never imply the app has taken an action, made a decision, or observed a fact unless the code has real state or result data to support it. Use neutral process language while work is pending, and reserve result verbs like "skipped", "protected", "found", "verified", or "deleted" for actual results.

### Screen UX review rubric

Use this rubric when reviewing any Orca IDE screen, screenshot, or prototype. A good review should name the highest-impact friction first, then give concrete changes the implementer can make.

#### Review output format

1. **Top fixes:** the 3 changes that would most improve the screen.
2. **Friction notes:** specific clutter, alignment, copy, focus, or flow issues, with the affected UI element named.
3. **Suggested changes:** exact changes to layout, hierarchy, controls, copy, empty/error states, and disclosure.
4. **Keyboard and speed check:** whether the primary workflow can be completed in 1-2 actions where appropriate, with good default focus and Enter/Esc behavior.
5. **Follow-up links or states:** missing external links, acquisition actions, or persistent errors the user needs to recover.

#### What to judge

- **Progressive disclosure:** keep high-frequency actions visible and prominent. Move low-frequency actions out of the common pointer path into menus, overflow controls, detail drawers, or advanced sections. Do not make menus so long that the user has to scan unrelated actions; group or split them when they grow.
- **Action hierarchy:** the primary action must be obvious through placement, size, and `default` button styling. Put high-frequency actions at the top of menus and in the most reachable toolbar positions. Secondary and rare actions should not compete with the primary action.
- **Click count:** remove unnecessary intermediate steps. Common workflows should complete in 1-2 actions when the app already has enough information to proceed.
- **Default focus:** dialogs, popovers, and command surfaces should focus the field or primary action the user is most likely to use. If Enter submits, focus must land where Enter triggers the intended primary action. Esc should back out without adding visual noise to Cancel/Dismiss.
- **Keyboard navigation:** prefer searchable command surfaces for long option lists. Add search fields when users need to find repositories, branches, worktrees, agents, commands, settings, files, or providers from a list.
- **Shortcut labels:** show shortcut chips only for shortcuts that are actually implemented and useful at that location. Labels must match the platform binding. If a shortcut strategy is undecided, do not expose a placeholder label in product UI.
- **Alignment:** rows and columns must line up to a visible grid. Left-align text and labels for scanability; right-align numbers, counts, shortcuts, and trailing metadata when comparison matters; center-align only compact icon controls, empty states, and table cells where symmetry is the clearest read.
- **Copy quality:** displayed text must be typo-free, concise, and specific. Prefer direct verbs and concrete nouns. Remove filler like "please", "simply", "just", "you can", and generic success language that is not backed by state.
- **Dialogs and overlays:** choose a dialog size that matches the amount of input. Short confirmations stay compact; forms with multi-line text, path pickers, provider setup, or review content need a larger dialog or sheet. Floating surfaces must use the documented shadow/elevation and background treatment so they read as above the page.
- **Empty and error states:** when data is missing, show a direct action to acquire or configure that data. Use toasts for transient failures or confirmations; persist errors inline when the user needs to read, retry, copy, or act on the message.
- **External links:** add direct links when the user may need provider docs, token settings, billing/setup pages, Git provider resources, or troubleshooting context. Put links near the relevant empty state, error, helper text, or setup step instead of burying them in a generic menu.
- **Affordance:** users should be able to discover available features without intrusive education. Use familiar icons, visible hover/focus states, clear labels where needed, and tooltips for icon-only controls. Prefer simple lucide icons already used nearby over obscure alternatives.
- **Layout density:** avoid jamming controls together. Preserve breathing room around the primary workflow, reduce competing buttons, and keep toolbar groups visually distinct. Dense screens are acceptable only when grouping, alignment, and hierarchy make scanning faster.
- **Cards and containers:** cards must be visually distinct from their parent surface through the existing `card`/`border` treatment. Avoid nesting cards inside cards. If a section is not a repeated item, modal, or framed tool, consider an unframed layout or full-width band instead.
- **Side-by-side layouts:** default to row-by-row layouts for complex workflows because they are easier to align and scan. Use side-by-side layouts only when space is constrained or comparison is the point, then polish column widths, baselines, and wrapping states carefully.
- **Animation:** use subtle animation to soften expanding/collapsing content and prevent jumpy layout changes. Animation should clarify continuity, not decorate. Respect reduced-motion settings.
- **SSH and latency:** assume actions may run remotely. Disable submit controls immediately, delay visible loading feedback when appropriate, and keep focus stable while remote data arrives.

### 1. Match in-flight feedback to perceived duration

The right question isn't _"should this control change while it's working?"_ — it's _"how long does the action take, and what does the user need to know during that time?"_

| Duration           | Feedback                                      |
| ------------------ | --------------------------------------------- |
| 0–100 ms           | None. Anything visible reads as a glitch.     |
| 100 ms–1 s         | Disabled state only.                          |
| 1 s–3 s            | Disabled + spinner or label swap.             |
| 3 s+ or multi-step | Stage labels, progress, optional reassurance. |

Two corollaries:

- **Pre-reserve any space you'll later occupy.** If a control may swap to a longer label or grow an icon, fix its footprint up front (use `width`, not `min-width`). A control that resizes mid-action looks broken even when the action succeeded.
- **Don't pick worst-case feedback for everyone.** If the action is fast locally and slow remotely (SSH), defer the visible loading state by ~200ms. Local users see nothing; remote users get appropriate feedback. Bind the _disabled_ state immediately (so double-clicks don't double-submit) and the _visible_ state on a timer.

### 2. Look for sibling components before designing in isolation

If your component has a sibling — same domain, overlapping behavior, often visible at adjacent moments in the same flow — the two should read as one design. Same icons, same shortcut conventions, same submit semantics. A user moving between them shouldn't perceive a seam.

This is _not_ "match every existing pattern." Some repo patterns are debt and copying them spreads the debt. The narrower claim is about _adjacent_ components. Diverging from a sibling needs a reason: either the sibling is wrong (fix both) or the new component has a real difference in role (commit to it).

When there's no sibling, match the surrounding chrome — button sizes, icon weights, copy tone — and don't manufacture a sibling from a screen the user will never correlate with this one.

### 3. Don't overload the back-out path

`destructive` is for actions that lose data or can't be undone. **Cancel, Dismiss, Close, and Discard are not destructive** — they back the user out of an in-progress action and should stay quiet (default ghost button, no color, no keyboard chip, no animated affordance). Save the visual weight for the affirmative action so the two don't compete. Keyboard handlers can still honor Esc; the visible decoration is what stays minimal.

## Cross-platform

Orca runs on macOS, Linux, and Windows. Every UI change must hold up on all three, in both light and dark mode.

- **Modifier keys:** Never hardcode `e.metaKey`. Use `navigator.userAgent.includes('Mac')` to choose `metaKey` on Mac and `ctrlKey` on Linux/Windows. Electron menu accelerators should use `CmdOrCtrl`.
- **Shortcut labels:** Display `⌘` / `⇧` on Mac; display `Ctrl+` / `Shift+` on other platforms. The label must reflect the actual binding for that platform.
- **Window chrome:** macOS shows traffic lights; the titlebar reserves an 80px gutter (`titlebar-traffic-light-pad`) so they don't overlap content. Don't put hit targets in that band on Mac.
- **SSH:** Many users run Orca on a remote machine. Loading states, focus management, and animations must hold up under 50–200 ms of extra latency. Test under simulated latency (or actual SSH) — local-only verification isn't enough. See _UX rules → 1_.

## When this guide is silent

If you have a UI question this doc doesn't answer:

1. Look at adjacent code in `src/renderer/src/components/` for the closest sibling, and follow its lead.
2. Check `src/renderer/src/components/ui/` for a primitive that already encodes the pattern.
3. If it's a token question, `main.css` is canonical — use what's there, or add a new one in both light and dark.
4. If none of those resolve it, ask the user before inventing.
