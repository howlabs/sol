<h1 align="center">Sol</h1>

<p align="center">
  <strong>A minimal IDE for AI agent development.</strong><br/>
  Strong terminals, parallel worktrees, one place — cut the bloat, keep what matters.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square" alt="macOS, Windows, and Linux" />
  <img src="https://badgen.net/github/license/howlabs/sol" alt="License" />
</p>

## Goals

Sol is an independent fork, split from [Orca](https://github.com/stablyai/orca). No upstream roadmap, no mobile companion, no marketing integrations — only what you need to run agents effectively.

**Keep**

- **Terminal** — Ghostty-class, WebGL, infinite splits, durable scrollback
- **Parallel worktrees** — multiple agents in isolated git branches; compare and merge
- **Any CLI agent** — Claude Code, Codex, Grok, Cursor, OpenCode, Pi… if it runs in a terminal, it runs here
- **SSH** — agents on remote machines with full file, git, and terminal access
- **Editor** — VS Code-style, autosave, drag files into prompts

**Cut / deprioritize**

- Mobile companion and complex push notifications
- Full native Linear/GitHub integrations
- Design Mode, Computer Use, automation wall
- Orca CLI orchestration, telemetry, community funnel

The lists above describe direction, not the exact state of every feature in the current build.

## Install

Build from source (recommended for fork development):

```bash
pnpm install
pnpm dev
```

Desktop packages:

```bash
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## Developing

```bash
pnpm install
pnpm dev          # Electron dev
pnpm test         # unit tests
pnpm lint         # lint + checks
```

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for contribution workflow.

## License

MIT — see [LICENSE](LICENSE).