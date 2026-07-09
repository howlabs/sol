# Sol

<p align="center">
  <strong>AI 에이전트 개발을 위한 미니멀 IDE.</strong><br/>
  강력한 터미널, 병렬 worktree, 한곳에서 — 군더더기는 줄이고 중요한 것만 남깁니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square" alt="macOS, Windows, Linux" />
  <img src="https://badgen.net/github/license/howlabs/sol" alt="라이선스" />
</p>

<p align="center">
  <sub><a href="../../README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <a href="README.zh-CN.md">中文</a> · <a href="README.ja.md">日本語</a></sub>
</p>

## 목표

Sol은 [Orca](https://github.com/stablyai/orca)에서 분기한 독립 포크입니다. 업스트림 로드맵, 모바일 companion, 마케팅 연동 없음 — 에이전트를 효과적으로 돌리는 데 필요한 것만.

**유지**

- **터미널** — Ghostty급, WebGL, 무한 분할, 지속 스크롤백
- **병렬 worktree** — 격리된 git 브랜치의 여러 에이전트; 비교와 병합
- **모든 CLI 에이전트** — Claude Code, Codex, Grok, Cursor, OpenCode, Pi… 터미널에서 되면 여기에서도
- **SSH** — 원격 머신의 에이전트, 파일 / git / 터미널 전체
- **에디터** — VS Code 스타일, 자동 저장, 파일을 프롬프트로 드래그

**축소 / 우선순위 하향**

- 모바일 companion 및 복잡한 푸시 알림
- 완전한 네이티브 Linear / GitHub 연동
- Design Mode, Computer Use, automation wall
- Orca CLI orchestration, telemetry, 커뮤니티 유입(Discord / 마케팅 사이트)
- 음성 받아쓰기 / 로컬 STT

위 목록은 방향이며 현재 빌드의 모든 기능과 1:1은 아닙니다.

## 설치

소스에서 빌드(포크 개발 권장):

```bash
pnpm install
pnpm dev
```

데스크톱 패키지:

```bash
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

## 개발

```bash
pnpm install
pnpm dev          # Electron 개발
pnpm test         # 단위 테스트
pnpm lint         # lint + 검사
```

기여 흐름은 [CONTRIBUTING.md](../../.github/CONTRIBUTING.md)를 참고하세요.

## 라이선스

MIT — [LICENSE](../../LICENSE) 참고.
