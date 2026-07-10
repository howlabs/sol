# Sol

<p align="center">
  <strong>Un IDE mínimo para el desarrollo con agentes de IA.</strong><br/>
  Terminales potentes, worktrees en paralelo, un solo lugar — menos bloat, lo esencial.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square" alt="macOS, Windows y Linux" />
  <img src="https://badgen.net/github/license/howlabs/sol" alt="Licencia" />
</p>

<p align="center">
  <sub><a href="../../README.md">English</a> · <a href="README.pt.md">Português</a> · <a href="README.zh-CN.md">中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a></sub>
</p>

## Objetivos

Sol es un fork independiente de [Orca](https://github.com/stablyai/orca). Sin roadmap upstream, sin companion móvil, sin integraciones de marketing — solo lo necesario para ejecutar agentes con eficacia.

**Mantener**

- **Terminal** — nivel Ghostty, WebGL, splits ilimitados, scrollback durable
- **Worktrees en paralelo** — varios agentes en ramas git aisladas; comparar y fusionar
- **Cualquier agente CLI** — Claude Code, Codex, Grok, Cursor, OpenCode, Pi… si corre en terminal, corre aquí
- **SSH** — agentes en máquinas remotas con archivo, git y terminal completos
- **Editor** — estilo VS Code, autosave, arrastrar archivos a prompts

**Recortar / despriorizar**

- Companion móvil y notificaciones push complejas
- Integraciones nativas completas de Linear / GitHub
- Design Mode, Computer Use, automation wall
- Orquestación Orca CLI, telemetry, embudo de comunidad (Discord / sitio de marketing)
- Dictado por voz / STT local

Las listas describen la dirección, no el estado exacto de cada función en el build actual.

## Instalación

Compilar desde el código (recomendado para desarrollo del fork):

```bash
pnpm install
pnpm dev
```

Paquetes de escritorio:

```bash
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## Desarrollo

```bash
pnpm install
pnpm dev          # Electron dev
pnpm test         # tests unitarios
pnpm lint         # lint + comprobaciones
```

Flujo de contribución: [CONTRIBUTING.md](../../.github/CONTRIBUTING.md).

## Licencia

MIT — ver [LICENSE](../../LICENSE).
