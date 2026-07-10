# Sol

<p align="center">
  <strong>AI エージェント開発向けのミニマル IDE。</strong><br/>
  強力なターミナル、並列 worktree、一か所で — 無駄を削ぎ、必要なものだけ残す。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square" alt="macOS、Windows、Linux" />
  <img src="https://badgen.net/github/license/howlabs/sol" alt="ライセンス" />
</p>

<p align="center">
  <sub><a href="../../README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.zh-CN.md">中文</a> · <a href="README.ko.md">한국어</a></sub>
</p>

## 目標

Sol は [Orca](https://github.com/stablyai/orca) から分岐した独立フォークです。上流ロードマップ、モバイル companion、マーケ連携はありません — エージェントを効果的に動かすために必要なものだけです。

**残す**

- **ターミナル** — Ghostty 級、WebGL、無限分割、永続スクロールバック
- **並列 worktree** — 隔離 git ブランチ上の複数エージェント；比較とマージ
- **任意の CLI エージェント** — Claude Code、Codex、Grok、Cursor、OpenCode、Pi… ターミナルで動くものはここで動く
- **SSH** — リモート上のエージェント、ファイル / git / ターミナル一式
- **エディタ** — VS Code 風、オートセーブ、ファイルをプロンプトへドラッグ

**削減 / 優先度下げ**

- モバイル companion と複雑なプッシュ通知
- フルネイティブ Linear / GitHub 連携
- Design Mode、Computer Use、automation wall
- Orca CLI orchestration、telemetry、コミュニティ導線（Discord / マーケサイト）
- 音声ディクテーション / ローカル STT

上記は方向性であり、現行ビルドの全機能と 1:1 ではありません。

## インストール

ソースからビルド（フォーク開発向け）：

```bash
pnpm install
pnpm dev
```

デスクトップパッケージ：

```bash
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## 開発

```bash
pnpm install
pnpm dev          # Electron 開発
pnpm test         # ユニットテスト
pnpm lint         # lint + チェック
```

貢献の流れは [CONTRIBUTING.md](../../.github/CONTRIBUTING.md) を参照。

## ライセンス

MIT — [LICENSE](../../LICENSE) を参照。
