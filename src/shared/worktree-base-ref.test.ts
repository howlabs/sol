import { describe, expect, it, vi } from 'vitest'
import { resolveWorktreeAddBaseRef } from './worktree-base-ref'

describe('resolveWorktreeAddBaseRef', () => {
  it('resolves "fresh" to origin/HEAD when available', async () => {
    const refExists = vi.fn(async (ref: string) => ref === 'refs/remotes/origin/HEAD')
    await expect(resolveWorktreeAddBaseRef('fresh', refExists)).resolves.toBe(
      'refs/remotes/origin/HEAD'
    )
  })

  it('falls back to HEAD for "fresh" when origin/HEAD is missing', async () => {
    const refExists = vi.fn(async () => false)
    await expect(resolveWorktreeAddBaseRef('fresh', refExists)).resolves.toBe('HEAD')
  })

  it('resolves "head" to HEAD without probing', async () => {
    const refExists = vi.fn()
    await expect(resolveWorktreeAddBaseRef('head', refExists)).resolves.toBe('HEAD')
    expect(refExists).not.toHaveBeenCalled()
  })

  it('passes through arbitrary refs unchanged', async () => {
    const refExists = vi.fn()
    await expect(resolveWorktreeAddBaseRef('refs/heads/main', refExists)).resolves.toBe(
      'refs/heads/main'
    )
    await expect(resolveWorktreeAddBaseRef('origin/main', refExists)).resolves.toBe('origin/main')
    await expect(resolveWorktreeAddBaseRef('abc1234', refExists)).resolves.toBe('abc1234')
    expect(refExists).not.toHaveBeenCalled()
  })
})
