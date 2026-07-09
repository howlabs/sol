# Sol

<p align="center">
  <strong>面向 AI agent 开发的极简 IDE。</strong><br/>
  强终端、并行 worktree、一处搞定 — 去掉臃肿，只留真正有用的部分。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square" alt="macOS、Windows 和 Linux" />
  <img src="https://badgen.net/github/license/howlabs/sol" alt="许可证" />
</p>

<p align="center">
  <sub><a href="../../README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a></sub>
</p>

## 目标

Sol 是从 [Orca](https://github.com/stablyai/orca) 分出的独立 fork。没有上游路线图、没有移动 companion、没有营销集成 — 只保留高效运行 agent 所需的能力。

**保留**

- **终端** — Ghostty 级、WebGL、无限分屏、持久滚动历史
- **并行 worktree** — 多 agent 隔离在不同 git 分支；比较与合并
- **任意 CLI agent** — Claude Code、Codex、Grok、Cursor、OpenCode、Pi… 能在终端跑的都能用
- **SSH** — 远程机器上的 agent，完整文件 / git / 终端访问
- **编辑器** — VS Code 风格、自动保存、拖文件进提示

**削减 / 降优先级**

- 移动 companion 与复杂推送通知
- 完整原生 Linear / GitHub 集成
- Design Mode、Computer Use、automation wall
- Orca CLI orchestration、telemetry、社区引流（Discord / 营销站）
- 语音听写 / 本地 STT

以上描述方向，不保证与当前构建的每一个功能一一对应。

## 安装

从源码构建（fork 开发推荐）：

```bash
pnpm install
pnpm dev
```

桌面包：

```bash
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## 开发

```bash
pnpm install
pnpm dev          # Electron 开发
pnpm test         # 单元测试
pnpm lint         # lint + 检查
```

贡献流程见 [CONTRIBUTING.md](../../.github/CONTRIBUTING.md)。

## 许可证

MIT — 见 [LICENSE](../../LICENSE)。
