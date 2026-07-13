import { useEffect, useRef } from 'react'
import type { OpenFile } from '@/store/slices/editor'
import { cursorPositionCache, diffViewStateCache, scrollTopCache } from '@/lib/scroll-cache'

function deleteCacheEntriesByPrefix<T>(cache: Map<string, T>, prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

export function useClosedEditorTabCleanup(openFiles: OpenFile[]): void {
  const prevOpenFilesRef = useRef<Map<string, OpenFile>>(new Map())

  useEffect(() => {
    const currentFilesById = new Map(openFiles.map((f) => [f.id, f]))
    for (const [prevId, prevFile] of prevOpenFilesRef.current) {
      if (!currentFilesById.has(prevId)) {
        disposeClosedEditorTab(prevId, prevFile)
      }
    }
    prevOpenFilesRef.current = currentFilesById
  }, [openFiles])
}

function disposeClosedEditorTab(prevId: string, prevFile: OpenFile): void {
  switch (prevFile.mode) {
    case 'edit':
      scrollTopCache.delete(prevFile.filePath)
      deleteCacheEntriesByPrefix(scrollTopCache, `${prevFile.filePath}::`)
      // Why: markdown and mermaid surfaces keep mode-scoped scroll positions.
      scrollTopCache.delete(`${prevFile.filePath}:rich`)
      scrollTopCache.delete(`${prevFile.filePath}:preview`)
      scrollTopCache.delete(`${prevFile.filePath}:mermaid-diagram`)
      cursorPositionCache.delete(prevFile.filePath)
      deleteCacheEntriesByPrefix(cursorPositionCache, `${prevFile.filePath}::`)
      break
    case 'markdown-preview':
      // Why: preview tabs own pane-scoped preview scroll cache entries.
      scrollTopCache.delete(`${prevFile.id}:preview`)
      deleteCacheEntriesByPrefix(scrollTopCache, `${prevFile.id}::`)
      break
    case 'diff':
      diffViewStateCache.delete(prevId)
      deleteCacheEntriesByPrefix(diffViewStateCache, `${prevId}::`)
      scrollTopCache.delete(`${prevId}:preview`)
      deleteCacheEntriesByPrefix(scrollTopCache, `${prevId}::`)
      break
    case 'conflict-review':
      break
    case 'check-details':
      break
  }
}
