# Voice / Dictation Removal Plan

Status: **implemented** (desktop dictation / speech stack removed for Sol).

## Decision summary

Sol positions itself as a **minimal IDE for AI agent development** ([README.md](../../README.md)). Voice dictation is optional today (`voice.enabled` defaults to `false`), carries a large surface area (local STT worker, model downloads, mic permissions, mobile RPC), and is **not** listed among core “Keep” goals. This plan removes desktop dictation and the speech stack unless product explicitly revives it later.

## Scope

### In scope (remove)

| Area | What |
|------|------|
| **Main process** | Entire `src/main/speech/` (STT worker, model manager, OpenAI key store, catalog) |
| **IPC** | `src/main/ipc/speech.ts` + `registerSpeechHandlers` wiring |
| **Build** | `stt-worker` entry in `electron.vite.config.ts` |
| **Dependencies** | `sherpa-onnx` + platform packages in `package.json` / `pnpm` overrides |
| **Preload** | `window.api.speech.*` and `ui:dictationKeyDown` listener |
| **Renderer** | `components/dictation/*`, `hooks/use-audio-capture.ts`, settings Voice pane + OpenAI transcription UI |
| **Store** | `store/slices/dictation.ts`, dictation fields on UI slice if any |
| **Shortcuts** | `voice.dictation` keybinding + `dictationKeyDown` in `window-shortcut-policy.ts`, `createMainWindow.ts`, `browser-guest-ui.ts` |
| **Native chat** | Mic / dictation controls in `NativeChatComposer*` |
| **Terminal** | `dictation:insertText` listener in `use-terminal-pane-global-effects.ts` (keep paste-target comment only if still accurate) |
| **App shell** | Lazy `DictationController`, overlay boundary `overlay.dictation` in `App.tsx` |
| **Runtime RPC** | `src/main/runtime/rpc/methods/speech.ts`, methods in `runtime-rpc.ts` allowlist, mobile dictation helpers on `orca-runtime.ts` |
| **Shared** | `src/shared/speech-types.ts` (or shrink to nothing), `getDefaultVoiceSettings`, `settings.voice` on `GlobalSettings` |
| **Feature education** | `voice-dictation` tip, `enable-voice` action, `voice` feature-interaction category entries |
| **Tests** | All files under `src/main/speech/*.test.ts`, `speech.test.ts`, dictation/VoicePane tests, fixture updates |

### Out of scope / keep (unless follow-up)

| Item | Rationale |
|------|-----------|
| **`developer-permissions` `microphone`** | Generic OS permission; may be reused by browser/computer-use. Only remove voice-specific **copy** in `developer-permissions-search.ts`. |
| **i18n locale strings** | Dead keys are harmless; optional cleanup pass via locale scripts later. |
| **User disk data** | Downloaded models under speech cache dir + `openai-speech-token.enc` — document optional manual cleanup; no migrator required for Sol fork. |
| **E2E emoji fixture “Microphone”** | Unrelated table content in `terminal-emoji-table.md`. |

### Persisted settings migration

- Today: `persistence.ts` deep-merges `settings.voice` with `getDefaultVoiceSettings()`.
- **Recommended:** Stop reading/writing `voice` on save; on load, **ignore** persisted `voice` (strip before merge or omit from typed `GlobalSettings`). Bump `SCHEMA_VERSION` only if the project convention requires it for settings shape changes; otherwise document “ignored legacy field” in persistence merge.
- **RPC / mobile clients:** `speech.*` methods should return clear errors or be removed from `ALL_RPC_METHODS` — aligns with README “no mobile companion” for Sol.

## Dependency graph (delete order)

Implement as **stacked PRs** or one large PR; order avoids broken intermediate builds.

```text
PR1 — Shared contracts & settings
  - Remove VoiceSettings / speech-types (or move minimal stubs out)
  - Remove voice from GlobalSettings, constants defaults, persistence merge
  - Remove voice-dictation from feature-tips / feature-interactions catalogs
  - Update shared tests (feature-tips, window-shortcut-policy, keybindings)

PR2 — Main + build
  - Delete src/main/speech/
  - Delete ipc/speech.ts; unregister in register-core-handlers
  - Remove speech-runtime imports from orca-runtime (mobile speech block ~lines 6440+)
  - Remove SPEECH_METHODS from rpc/methods; runtime-rpc allowlist entries
  - Remove stt-worker from electron.vite.config.ts
  - Remove sherpa-onnx deps from package.json
  - Prune config/max-lines-baseline.txt lines for deleted files

PR3 — Preload + renderer
  - Strip preload speech API + api-types
  - Delete dictation components, use-audio-capture, Voice* settings files
  - Settings.tsx / useSettingsNavigationMetadata / settings-navigation-types
  - App.tsx DictationController lazy import + overlay
  - Native chat composer dictation UI
  - Terminal dictation event wiring
  - web-preload-api voice deep-merge
  - cmd-j palette-results voice keywords

PR4 — Shortcuts & windows
  - createMainWindow + tests: dictationKeyDown paths
  - browser-guest-ui dictation forward
  - keybindings default entry voice.dictation

PR5 — Tests & docs
  - Fix e2e helpers that dismiss “Voice Dictation is here” (notification-settings.spec.ts)
  - Replace `markFeatureTipsSeen(['voice-dictation', ...])` in terminal e2e with shorter tip lists
  - Update docs/configurable-open-in-menu.md (voice deep-merge note)
  - Update docs/reference/feature-education-state.md
  - README: add Voice under **Cut / deprioritize**
```

## File inventory (grep audit, 2026-07-09)

### Delete entire directories / files

- `src/main/speech/` (all `.ts` + tests)
- `src/main/ipc/speech.ts`, `speech.test.ts`
- `src/main/runtime/rpc/methods/speech.ts`, `speech.test.ts`
- `src/renderer/src/components/dictation/` (all)
- `src/renderer/src/hooks/use-audio-capture.ts`
- `src/renderer/src/components/settings/VoicePane.tsx` (+ `.test.tsx`)
- `src/renderer/src/components/settings/VoiceDictationSettingsSection.tsx`
- `src/renderer/src/components/settings/VoiceSpeechModelSection.tsx` (+ `.test.tsx`)
- `src/renderer/src/components/settings/voice-pane-search.ts`
- `src/renderer/src/components/settings/voice-dictation-toggle.ts`
- `src/renderer/src/components/settings/OpenAiTranscriptionSettingsRow.tsx`
- `src/renderer/src/components/settings/OpenAiTranscriptionKeyDialog.tsx`
- `src/shared/speech-types.ts`
- `src/renderer/src/store/slices/dictation.ts`

### Edit in place (non-exhaustive; ripgrep `speech|dictation|voice` before merge)

- `electron.vite.config.ts`
- `package.json`
- `src/preload/index.ts`, `api-types.ts`
- `src/main/ipc/register-core-handlers.ts` (+ test)
- `src/main/window/createMainWindow.ts` (+ test)
- `src/main/browser/browser-guest-ui.ts`
- `src/main/runtime/orca-runtime.ts` (large — mobile speech section)
- `src/main/runtime/runtime-rpc.ts`
- `src/main/runtime/rpc/methods/index.ts`
- `src/main/persistence.ts` (+ test fixtures referencing voice tips)
- `src/main/startup/dev-education-suppression.ts` (+ test)
- `src/main/runtime/rpc/methods/client-ui.ts` (+ test)
- `src/shared/constants.ts`, `types.ts`, `keybindings.ts`
- `src/shared/feature-tips.ts` (+ test)
- `src/shared/feature-interaction-catalog.ts`, `feature-interaction-categories.ts` (+ test)
- `src/shared/window-shortcut-policy.ts` (+ test)
- `src/renderer/src/App.tsx`, `app-startup-routing.test.ts`
- `src/renderer/src/store/index.ts`, `types.ts`, slices (`ui.test.ts`, `store-test-helpers.ts`, `diffComments.test.ts`)
- `src/renderer/src/components/settings/Settings.tsx`, `developer-permissions-search.ts`
- `src/renderer/src/components/native-chat/NativeChatComposer*.tsx`
- `src/renderer/src/components/terminal-pane/use-terminal-pane-global-effects.ts`
- `src/renderer/src/components/cmd-j/palette-results.ts`
- `src/renderer/src/web/web-preload-api.ts`
- `src/renderer/src/assets/main.css` (voice tip waveform styles)
- `tests/e2e/*` (5+ specs referencing `voice-dictation` tip dismissal)

## Verification checklist

```bash
pnpm install          # lockfile after sherpa-onnx removal
pnpm lint
pnpm test
pnpm check:max-lines-ratchet
# Manual: Settings has no Voice pane; dictation shortcut does nothing; native chat has no mic; build produces no stt-worker bundle
```

## Risk notes

1. **`orca-runtime.ts` size** — speech removal touches a grandfathered max-lines file; deleting code should **shrink** it (good). Do not add disables.
2. **TypeScript ripple** — `GlobalSettings.voice` removal will surface many compile errors; fix in one pass per PR2+PR3.
3. **External API** — Any Orca mobile client expecting `speech.*` RPC will break; acceptable for Sol per product direction.
4. **Feature tip modal** — E2E still expects optional “Voice Dictation is here” dialog; remove dismissal helper once tip is gone.

## Effort estimate

| PR | Rough size |
|----|------------|
| PR1 shared | Small |
| PR2 main/build | Medium (runtime chunk) |
| PR3 renderer | Medium |
| PR4 shortcuts | Small |
| PR5 tests/docs | Small |

**Total:** ~1–2 focused sessions for an agent; human review should focus on `orca-runtime` diff and persistence behavior.

## Alternative (not recommended for Sol)

**Freeze only:** leave code, default off, remove feature tip + README mention. Saves deletion cost but keeps `sherpa-onnx`, worker bundle, and CI maintenance indefinitely.