# Sol

<p align="center">
  <strong>Um IDE mínimo para desenvolvimento com agentes de IA.</strong><br/>
  Terminais fortes, worktrees em paralelo, um só lugar — menos bloat, o que importa.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square" alt="macOS, Windows e Linux" />
  <img src="https://badgen.net/github/license/howlabs/sol" alt="Licença" />
</p>

<p align="center">
  <sub><a href="../../README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.zh-CN.md">中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a></sub>
</p>

## Objetivos

Sol é um fork independente de [Orca](https://github.com/stablyai/orca). Sem roadmap upstream, sem companion mobile, sem integrações de marketing — só o necessário para rodar agentes com eficiência.

**Manter**

- **Terminal** — nível Ghostty, WebGL, splits infinitos, scrollback durável
- **Worktrees em paralelo** — vários agentes em branches git isoladas; comparar e mesclar
- **Qualquer agente CLI** — Claude Code, Codex, Grok, Cursor, OpenCode, Pi… se roda no terminal, roda aqui
- **SSH** — agentes em máquinas remotas com arquivo, git e terminal completos
- **Editor** — estilo VS Code, autosave, arrastar arquivos para prompts

**Cortar / despriorizar**

- Companion mobile e push notifications complexas
- Integrações nativas completas Linear / GitHub
- Design Mode, Computer Use, automation wall
- Orquestração Orca CLI, telemetry, funil de comunidade (Discord / site de marketing)
- Ditado por voz / STT local

As listas descrevem a direção, não o estado exato de cada recurso no build atual.

## Instalação

Build a partir do código (recomendado para desenvolvimento do fork):

```bash
pnpm install
pnpm dev
```

Pacotes desktop:

```bash
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## Desenvolvimento

```bash
pnpm install
pnpm dev          # Electron dev
pnpm test         # testes unitários
pnpm lint         # lint + checagens
```

Fluxo de contribuição: [CONTRIBUTING.md](../../.github/CONTRIBUTING.md).

## Licença

MIT — ver [LICENSE](../../LICENSE).
