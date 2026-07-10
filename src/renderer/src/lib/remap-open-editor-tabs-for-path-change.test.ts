import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import { remapOpenEditorTabsForPathChange } from './remap-open-editor-tabs-for-path-change'

describe('remapOpenEditorTabsForPathChange', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true)
  })

  it('preserves runtime owners, drafts, dirty state, and markdown preview sources', () => {
    const state = useAppStore.getState()
    const worktreeId = 'wt-1'
    const worktreePath = '/repo'
    const oldPath = '/repo/docs/readme.md'
    const newPath = '/repo/notes/readme.md'
    useAppStore.setState({
      settings: { activeRuntimeEnvironmentId: 'env-active' } as NonNullable<
        ReturnType<typeof useAppStore.getState>['settings']
      >
    })

    state.openFile(
      {
        filePath: oldPath,
        relativePath: 'docs/readme.md',
        worktreeId,
        runtimeEnvironmentId: null,
        language: 'markdown',
        mode: 'edit'
      },
      { suppressActiveRuntimeFallback: true }
    )
    const localEditId = useAppStore.getState().openFiles[0]?.id
    expect(localEditId).toBeTruthy()
    state.setEditorDraft(localEditId!, 'local draft')
    state.markFileDirty(localEditId!, true)

    state.openFile({
      filePath: oldPath,
      relativePath: 'docs/readme.md',
      worktreeId,
      runtimeEnvironmentId: 'env-remote',
      language: 'markdown',
      mode: 'edit'
    })
    const remoteEdit = useAppStore
      .getState()
      .openFiles.find((file) => file.mode === 'edit' && file.runtimeEnvironmentId === 'env-remote')
    expect(remoteEdit).toBeTruthy()
    state.setEditorDraft(remoteEdit!.id, 'remote draft')
    state.markFileDirty(remoteEdit!.id, true)

    state.openMarkdownPreview(
      {
        filePath: oldPath,
        relativePath: 'docs/readme.md',
        worktreeId,
        runtimeEnvironmentId: 'env-remote',
        language: 'markdown'
      },
      { anchor: 'heading', sourceFileId: remoteEdit!.id }
    )

    remapOpenEditorTabsForPathChange({
      fromPath: '/repo/docs',
      toPath: '/repo/notes',
      worktreePath,
      worktreeId
    })

    const nextState = useAppStore.getState()
    expect(nextState.openFiles.some((file) => file.filePath === oldPath)).toBe(false)

    const localRemapped = nextState.openFiles.find(
      (file) =>
        file.filePath === newPath && file.mode === 'edit' && file.runtimeEnvironmentId === null
    )
    const remoteRemapped = nextState.openFiles.find(
      (file) =>
        file.filePath === newPath &&
        file.mode === 'edit' &&
        file.runtimeEnvironmentId === 'env-remote'
    )
    expect(localRemapped).toMatchObject({
      relativePath: 'notes/readme.md',
      isDirty: true,
      runtimeEnvironmentId: null
    })
    expect(remoteRemapped).toMatchObject({
      relativePath: 'notes/readme.md',
      isDirty: true,
      runtimeEnvironmentId: 'env-remote'
    })
    expect(nextState.editorDrafts[localRemapped!.id]).toBe('local draft')
    expect(nextState.editorDrafts[remoteRemapped!.id]).toBe('remote draft')
    expect(nextState.editorDrafts[localEditId!]).toBeUndefined()
    expect(nextState.editorDrafts[remoteEdit!.id]).toBeUndefined()

    const remotePreview = nextState.openFiles.find(
      (file) => file.mode === 'markdown-preview' && file.runtimeEnvironmentId === 'env-remote'
    )
    expect(remotePreview).toMatchObject({
      filePath: newPath,
      relativePath: 'notes/readme.md',
      markdownPreviewAnchor: 'heading',
      markdownPreviewSourceFileId: remoteRemapped!.id
    })
  })

  it('clears the untitled marker when remapping a renamed new markdown file', () => {
    const state = useAppStore.getState()
    const oldPath = '/repo/untitled.md'
    const newPath = '/repo/renamed.md'

    state.openFile({
      filePath: oldPath,
      relativePath: 'untitled.md',
      worktreeId: 'wt-1',
      language: 'markdown',
      isUntitled: true,
      mode: 'edit'
    })

    remapOpenEditorTabsForPathChange({
      fromPath: oldPath,
      toPath: newPath,
      worktreePath: '/repo',
      worktreeId: 'wt-1'
    })

    expect(useAppStore.getState().openFiles).toHaveLength(1)
    expect(useAppStore.getState().openFiles[0]).toMatchObject({
      filePath: newPath,
      relativePath: 'renamed.md'
    })
    expect(useAppStore.getState().openFiles[0].isUntitled).toBeUndefined()
  })
})
