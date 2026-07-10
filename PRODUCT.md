# Sol

## Register

product

## Purpose

Sol is a minimal desktop IDE for AI agent development: strong terminals, parallel git worktrees, SSH, and a focused editor. Design serves the task — chrome stays quiet; color is for state.

## Users

Developers running CLI agents (Claude Code, Codex, Grok, Cursor, …) across local and remote worktrees. Primary context: long sessions, dense sidebars, settings as configuration not marketing.

## Personality

Quiet, precise, monochrome. Tool disappears into the work.

## Anti-references

SaaS onboarding walls, nested card stacks, marketing fluff in settings, decorative gradients, busy multi-color chrome.

## Design principles

1. Restrained palette; state over decoration.
2. Density with scannable hierarchy.
3. One primary action per row/section.
4. Progressive disclosure for setup details.
5. Match `docs/STYLEGUIDE.md` tokens and shadcn primitives.

## Design system target

Gradual chrome migration (see `docs/reference/design-system-migration.md`):

- **Style:** shadcn **Mira** (compact, dense product UI)
- **Base color:** **stone**
- **Icons:** **Phosphor Icons** via `@/lib/icons` (Phase C done)
- **Primitives:** **Base UI** (`@base-ui/react`, `base-mira` in `components.json`) — Phase D done

Phases A–D landed (stone + Mira density + Phosphor + Base UI).
