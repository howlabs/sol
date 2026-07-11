import * as React from 'react'
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler'

/**
 * Phase F: map Radix dismiss/focus content props onto Base UI
 * (initialFocus / finalFocus / Root onOpenChange + cancel).
 */

export type RadixPreventableEvent = {
  preventDefault: () => void
  defaultPrevented: boolean
  target: EventTarget | null
  currentTarget: EventTarget | null
  type: string
}

export type RadixPreventableHandler = (event: RadixPreventableEvent) => void

export type RadixDismissHandlers = {
  onInteractOutside?: RadixPreventableHandler
  onPointerDownOutside?: RadixPreventableHandler
  onFocusOutside?: RadixPreventableHandler
  onEscapeKeyDown?: RadixPreventableHandler
}

export type RadixFocusHandlers = {
  onOpenAutoFocus?: RadixPreventableHandler
  onCloseAutoFocus?: RadixPreventableHandler
}

type CancelableOpenChangeDetails = {
  reason: string
  event?: Event
  cancel: () => void
  isCanceled: boolean
}

type DismissRegistry = {
  register: (handlers: RadixDismissHandlers) => () => void
}

const PopupDismissContext = React.createContext<DismissRegistry | null>(null)

export function createRadixPreventableEvent(
  native?: Event | null,
  type = 'radix-compat'
): RadixPreventableEvent {
  let defaultPrevented = false
  return {
    type,
    target: native?.target ?? null,
    currentTarget: native?.currentTarget ?? null,
    get defaultPrevented() {
      return defaultPrevented
    },
    preventDefault() {
      defaultPrevented = true
    }
  }
}

function runHandler(
  handler: RadixPreventableHandler | undefined,
  native: Event | undefined,
  type: string
): boolean {
  if (!handler) {
    return false
  }
  const event = createRadixPreventableEvent(native ?? null, type)
  handler(event)
  return event.defaultPrevented
}

/** Apply registered Radix dismiss handlers; cancel Base UI close when prevented. */
export function applyRadixDismissHandlers(
  handlersList: Iterable<RadixDismissHandlers>,
  open: boolean,
  details: CancelableOpenChangeDetails
): void {
  if (open || details.isCanceled) {
    return
  }

  const native = details.event
  let prevented = false

  for (const handlers of handlersList) {
    switch (details.reason) {
      case 'outsidePress':
        prevented =
          runHandler(handlers.onPointerDownOutside, native, 'pointerDownOutside') ||
          runHandler(handlers.onInteractOutside, native, 'interactOutside') ||
          prevented
        break
      case 'focusOut':
        prevented =
          runHandler(handlers.onFocusOutside, native, 'focusOutside') ||
          runHandler(handlers.onInteractOutside, native, 'interactOutside') ||
          prevented
        break
      case 'escapeKey':
        prevented = runHandler(handlers.onEscapeKeyDown, native, 'escapeKeyDown') || prevented
        break
      default:
        break
    }
  }

  if (prevented) {
    details.cancel()
  }
}

export function usePopupDismissRegistry(): {
  registry: DismissRegistry
  handlersRef: React.MutableRefObject<Set<RadixDismissHandlers>>
} {
  const handlersRef = React.useRef(new Set<RadixDismissHandlers>())
  const registry = React.useMemo<DismissRegistry>(
    () => ({
      register(handlers) {
        handlersRef.current.add(handlers)
        return () => {
          handlersRef.current.delete(handlers)
        }
      }
    }),
    []
  )
  return { registry, handlersRef }
}

export function PopupDismissProvider({
  registry,
  children
}: {
  registry: DismissRegistry
  children: React.ReactNode
}): React.JSX.Element {
  return <PopupDismissContext.Provider value={registry}>{children}</PopupDismissContext.Provider>
}

/**
 * Register Content-level Radix dismiss props with the nearest Root.
 * Why: useLayoutEffect so handlers exist before paint/outside-press on first open;
 * keep a stable registry entry and read latest handlers from a ref (inline props
 * change identity every render).
 */
export function useRegisterRadixDismissHandlers(handlers: RadixDismissHandlers): void {
  const registry = React.useContext(PopupDismissContext)
  const handlersRef = React.useRef(handlers)
  handlersRef.current = handlers

  React.useLayoutEffect(() => {
    if (!registry) {
      return
    }
    return registry.register({
      onInteractOutside: (event) => handlersRef.current.onInteractOutside?.(event),
      onPointerDownOutside: (event) => handlersRef.current.onPointerDownOutside?.(event),
      onFocusOutside: (event) => handlersRef.current.onFocusOutside?.(event),
      onEscapeKeyDown: (event) => handlersRef.current.onEscapeKeyDown?.(event)
    })
  }, [registry])
}

type FocusMapper =
  | boolean
  | React.RefObject<HTMLElement | null>
  | ((interactionType: InteractionType) => boolean | HTMLElement | null | void)
  | undefined

/**
 * Map Radix onOpenAutoFocus (preventDefault skips focus) → Base UI initialFocus.
 * Prefer explicit initialFocus when both are set.
 */
export function mapRadixOpenAutoFocus(
  onOpenAutoFocus: RadixPreventableHandler | undefined,
  initialFocus: FocusMapper
): FocusMapper {
  if (initialFocus !== undefined) {
    return initialFocus
  }
  if (!onOpenAutoFocus) {
    return undefined
  }
  return () => {
    const event = createRadixPreventableEvent(null, 'openAutoFocus')
    onOpenAutoFocus(event)
    return !event.defaultPrevented
  }
}

/**
 * Map Radix onCloseAutoFocus (preventDefault skips restore) → Base UI finalFocus.
 */
export function mapRadixCloseAutoFocus(
  onCloseAutoFocus: RadixPreventableHandler | undefined,
  finalFocus: FocusMapper
): FocusMapper {
  if (finalFocus !== undefined) {
    return finalFocus
  }
  if (!onCloseAutoFocus) {
    return undefined
  }
  return () => {
    const event = createRadixPreventableEvent(null, 'closeAutoFocus')
    onCloseAutoFocus(event)
    return !event.defaultPrevented
  }
}

/**
 * When asChild renders a non-<button> DOM tag, Base UI needs nativeButton={false}.
 * Component hosts (e.g. app <Button>) leave the prop unset so Base UI keeps its
 * default (true) — those composites still mount a real <button>.
 */
export function nativeButtonForAsChild(
  asChild: boolean | undefined,
  child: React.ReactNode,
  explicit?: boolean
): boolean | undefined {
  if (explicit !== undefined) {
    return explicit
  }
  if (!asChild || !React.isValidElement(child)) {
    return undefined
  }
  if (typeof child.type === 'string') {
    return child.type === 'button'
  }
  // Why: function/forwardRef children are usually Button-like hosts that render
  // a native button; forcing false triggers Base UI host mismatch warnings.
  return undefined
}

export type RadixContentCompatProps = RadixDismissHandlers &
  RadixFocusHandlers & {
    onOpenAutoFocus?: RadixPreventableHandler
    onCloseAutoFocus?: RadixPreventableHandler
  }

/**
 * Radix MenuItem used `onSelect`; Base UI only fires `onClick` (unknown
 * `onSelect` is ignored). Map so actions like "Project Settings" run again.
 */
export type RadixMenuSelectHandler = (event: RadixPreventableEvent) => void

export function mapRadixMenuItemSelectToClick(args: {
  onSelect?: RadixMenuSelectHandler
  onClick?: React.MouseEventHandler<HTMLElement>
}): React.MouseEventHandler<HTMLElement> | undefined {
  const { onSelect, onClick } = args
  if (!onSelect && !onClick) {
    return undefined
  }
  return (domEvent) => {
    onClick?.(domEvent)
    if (!onSelect) {
      return
    }
    onSelect(createRadixPreventableEvent(domEvent.nativeEvent, 'menuSelect'))
  }
}

/** Strip Radix-only props so they never hit the DOM / Base UI unknown handlers. */
export function splitRadixContentCompatProps<T extends Record<string, unknown>>(
  props: T
): {
  radix: RadixContentCompatProps
  rest: Omit<
    T,
    | 'onOpenAutoFocus'
    | 'onCloseAutoFocus'
    | 'onInteractOutside'
    | 'onPointerDownOutside'
    | 'onFocusOutside'
    | 'onEscapeKeyDown'
  >
} {
  const {
    onOpenAutoFocus,
    onCloseAutoFocus,
    onInteractOutside,
    onPointerDownOutside,
    onFocusOutside,
    onEscapeKeyDown,
    ...rest
  } = props as T & RadixContentCompatProps

  return {
    radix: {
      onOpenAutoFocus,
      onCloseAutoFocus,
      onInteractOutside,
      onPointerDownOutside,
      onFocusOutside,
      onEscapeKeyDown
    },
    rest: rest as Omit<
      T,
      | 'onOpenAutoFocus'
      | 'onCloseAutoFocus'
      | 'onInteractOutside'
      | 'onPointerDownOutside'
      | 'onFocusOutside'
      | 'onEscapeKeyDown'
    >
  }
}
