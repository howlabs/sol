import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommitArea } from './SourceControl'
import { resolvePrimaryAction, type PrimaryActionInputs } from './source-control-primary-action'
import { resolveDropdownItems, type DropdownActionKind } from './source-control-dropdown-items'
import { hasPhosphorIcon } from '@/lib/phosphor-icon-paths'

// Why: split out from CommitArea.test.tsx so each file stays under the
// project's max-lines budget. These tests cover the directional-icon
// mapping for primary action kinds (push / pull / sync / publish); the
// commit-checkmark and core CommitArea behaviour live in the sibling file.

function buildInputs(overrides: Partial<PrimaryActionInputs> = {}): PrimaryActionInputs {
  return {
    stagedCount: 1,
    hasUnstagedChanges: false,
    hasStageableChanges: false,
    hasPartiallyStagedChanges: false,
    hasMessage: true,
    hasUnresolvedConflicts: false,
    isCommitting: false,
    isRemoteOperationActive: false,
    upstreamStatus: { hasUpstream: true, ahead: 0, behind: 0 },
    ...overrides
  }
}

function baseProps(overrides: Partial<PrimaryActionInputs> = {}) {
  const inputs = buildInputs(overrides)
  return {
    worktreeId: 'wt-1',
    groupId: 'group-1',
    commitMessage: 'feat: add commit area',
    commitError: null as string | null,
    commitFailureRecoveryPrompt: null as string | null,
    pushRecovery: null,
    remoteActionError: null as string | null,
    isCommitting: inputs.isCommitting,
    isFixingCommitFailureWithAI: false,
    isFixingPushFailureWithAI: false,
    sourceControlAiActionsVisible: true,
    aiEnabled: false,
    aiAgentConfigured: false,
    isGenerating: false,
    generateError: null as string | null,
    stagedCount: inputs.stagedCount,
    hasPartiallyStagedChanges: inputs.hasPartiallyStagedChanges,
    hasUnresolvedConflicts: inputs.hasUnresolvedConflicts,
    isRemoteOperationActive: inputs.isRemoteOperationActive,
    inFlightRemoteOpKind: inputs.inFlightRemoteOpKind ?? null,
    primaryAction: resolvePrimaryAction(inputs),
    dropdownItems: resolveDropdownItems(inputs),
    onCommitMessageChange: vi.fn(),
    onGenerate: vi.fn(),
    onCancelGenerate: vi.fn(),
    onFixCommitFailureWithAI: vi.fn(),
    onFixPushFailureWithAI: vi.fn(),
    onPrimaryAction: vi.fn(),
    onDropdownAction: vi.fn() as (kind: DropdownActionKind) => void
  }
}

function primaryButton(props: ReturnType<typeof baseProps>): string {
  const markup = renderToStaticMarkup(
    <TooltipProvider>
      <CommitArea {...props} />
    </TooltipProvider>
  )
  const match = markup.match(/<button\b[\s\S]*?<\/button>/)
  if (!match) {
    throw new Error('primary button not found')
  }
  return match[0]
}

describe('CommitArea primary action icons', () => {
  it('renders an up-arrow on a Push primary', () => {
    expect(
      hasPhosphorIcon(
        primaryButton(
          baseProps({
            stagedCount: 0,
            hasMessage: false,
            upstreamStatus: { hasUpstream: true, ahead: 1, behind: 0 }
          })
        ),
        'ArrowUp'
      )
    ).toBe(true)
  })

  it('renders no directional icon on a Pull primary', () => {
    const button = primaryButton(
      baseProps({
        stagedCount: 0,
        hasMessage: false,
        upstreamStatus: { hasUpstream: true, ahead: 0, behind: 1 }
      })
    )
    expect(button).not.toContain('<svg')
  })

  it('renders a bidirectional arrow on a Sync primary', () => {
    expect(
      hasPhosphorIcon(
        primaryButton(
          baseProps({
            stagedCount: 0,
            hasMessage: false,
            upstreamStatus: { hasUpstream: true, ahead: 1, behind: 1 }
          })
        ),
        'ArrowsDownUp'
      )
    ).toBe(true)
  })

  it('renders a cloud-up icon on a Publish primary', () => {
    expect(
      hasPhosphorIcon(
        primaryButton(
          baseProps({
            stagedCount: 0,
            hasMessage: false,
            upstreamStatus: { hasUpstream: false, ahead: 0, behind: 0 }
          })
        ),
        'CloudArrowUp'
      )
    ).toBe(true)
  })

  it('renders a plus icon on a Stage All primary', () => {
    expect(
      hasPhosphorIcon(
        primaryButton(
          baseProps({
            stagedCount: 0,
            hasUnstagedChanges: true,
            hasStageableChanges: true,
            hasMessage: false,
            upstreamStatus: { hasUpstream: true, ahead: 0, behind: 0 }
          })
        ),
        'Plus'
      )
    ).toBe(true)
  })
})
