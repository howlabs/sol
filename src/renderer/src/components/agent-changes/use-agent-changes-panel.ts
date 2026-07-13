import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { findWorktreeById } from '@/store/slices/worktree-helpers'
import {
  discardAgentChangedFile,
  loadAgentChangesStatusSnapshot,
  loadFileBodyIntoSnapshot,
  type AgentChangesLoadContext
} from './agent-changes-load'
import type { AgentChangesSnapshot, UnifiedHunkLine } from './agent-changes-types'

const REFRESH_DEBOUNCE_MS = 250

export type AgentChangesPanelState = {
  snapshot: AgentChangesSnapshot | null
  selectedPath: string | null
  selectedLines: UnifiedHunkLine[]
  loading: boolean
  loadingFile: boolean
  error: string | null
  refresh: () => void
  selectFile: (relativePath: string) => void
  setSelectedLines: (lines: UnifiedHunkLine[]) => void
  discardSelected: () => Promise<void>
  worktreePath: string | null
  worktreeId: string | null
}

export function useAgentChangesPanel(active: boolean): AgentChangesPanelState {
  const activeWorktreeId = useAppStore((s) => s.activeWorktreeId)
  const worktreePath = useAppStore((s) => {
    if (!s.activeWorktreeId) {
      return null
    }
    return findWorktreeById(s.worktreesByRepo, s.activeWorktreeId)?.path ?? null
  })

  const [snapshot, setSnapshot] = useState<AgentChangesSnapshot | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [selectedLines, setSelectedLines] = useState<UnifiedHunkLine[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFile, setLoadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const revisionRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadGenRef = useRef(0)
  const fileLoadGenRef = useRef(0)

  const getContext = useCallback((): AgentChangesLoadContext | null => {
    if (!activeWorktreeId || !worktreePath) {
      return null
    }
    return { worktreeId: activeWorktreeId, worktreePath }
  }, [activeWorktreeId, worktreePath])

  const runRefresh = useCallback(async () => {
    const context = getContext()
    if (!context) {
      setSnapshot(null)
      setSelectedPath(null)
      setError(null)
      return
    }
    const gen = ++loadGenRef.current
    setLoading(true)
    setError(null)
    try {
      revisionRef.current += 1
      const next = await loadAgentChangesStatusSnapshot(context, revisionRef.current)
      if (gen !== loadGenRef.current) {
        return
      }
      setSnapshot(next)
      setSelectedPath((current) => {
        if (current && next.files.some((f) => f.relativePath === current)) {
          return current
        }
        return next.files[0]?.relativePath ?? null
      })
    } catch (err) {
      if (gen !== loadGenRef.current) {
        return
      }
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (gen === loadGenRef.current) {
        setLoading(false)
      }
    }
  }, [getContext])

  const refresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void runRefresh()
    }, REFRESH_DEBOUNCE_MS)
  }, [runRefresh])

  // Initial + worktree change load when panel is active.
  useEffect(() => {
    if (!active) {
      return
    }
    void runRefresh()
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [active, activeWorktreeId, worktreePath, runRefresh])

  // Lazy load hunks when selection changes.
  useEffect(() => {
    if (!active || !selectedPath || !snapshot) {
      return
    }
    const file = snapshot.files.find((row) => row.relativePath === selectedPath)
    // Why: empty hunks array means "loaded, no changes to show" — only undefined
    // means the body has not been fetched yet.
    if (!file || file.hunks !== undefined || file.binary || file.tooLarge) {
      return
    }
    const context = getContext()
    if (!context) {
      return
    }
    const gen = ++fileLoadGenRef.current
    setLoadingFile(true)
    void loadFileBodyIntoSnapshot(context, snapshot, selectedPath)
      .then((next) => {
        if (gen !== fileLoadGenRef.current) {
          return
        }
        setSnapshot(next)
      })
      .catch((err) => {
        if (gen !== fileLoadGenRef.current) {
          return
        }
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (gen === fileLoadGenRef.current) {
          setLoadingFile(false)
        }
      })
  }, [active, selectedPath, snapshot, getContext])

  const selectFile = useCallback((relativePath: string) => {
    setSelectedPath(relativePath)
    setSelectedLines([])
  }, [])

  const discardSelected = useCallback(async () => {
    const context = getContext()
    if (!context || !selectedPath) {
      return
    }
    await discardAgentChangedFile(context, selectedPath)
    await runRefresh()
  }, [getContext, selectedPath, runRefresh])

  return {
    snapshot,
    selectedPath,
    selectedLines,
    loading,
    loadingFile,
    error,
    refresh,
    selectFile,
    setSelectedLines,
    discardSelected,
    worktreePath,
    worktreeId: activeWorktreeId
  }
}
