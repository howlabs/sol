// @vitest-environment happy-dom

import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { resolveButtonNativeButton } from './button'

describe('resolveButtonNativeButton', () => {
  it('returns undefined when asChild is false', () => {
    expect(resolveButtonNativeButton(false, <a href="/">link</a>)).toBeUndefined()
    expect(resolveButtonNativeButton(undefined, <button type="button">ok</button>)).toBeUndefined()
  })

  it('returns true for asChild + native <button>', () => {
    expect(resolveButtonNativeButton(true, <button type="button">ok</button>)).toBe(true)
  })

  it('returns false for asChild + native non-button tags', () => {
    expect(resolveButtonNativeButton(true, <a href="/docs">docs</a>)).toBe(false)
    expect(resolveButtonNativeButton(true, <span>chip</span>)).toBe(false)
    expect(resolveButtonNativeButton(true, <div role="button">host</div>)).toBe(false)
  })

  it('returns false for asChild + function / forwardRef children', () => {
    function CustomLink(props: React.ComponentPropsWithoutRef<'a'>): React.JSX.Element {
      return <a {...props} />
    }
    const ForwardLink = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<'a'>>(
      function ForwardLink(props, ref) {
        return <a ref={ref} {...props} />
      }
    )

    expect(resolveButtonNativeButton(true, <CustomLink href="/">custom</CustomLink>)).toBe(false)
    expect(resolveButtonNativeButton(true, <ForwardLink href="/">fwd</ForwardLink>)).toBe(false)
  })

  it('returns undefined when asChild but children is not a valid element', () => {
    expect(resolveButtonNativeButton(true, 'plain text')).toBeUndefined()
    expect(resolveButtonNativeButton(true, null)).toBeUndefined()
  })
})
