import { StateEffect, StateField, type EditorState, type Extension } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin, gutter, type ViewUpdate } from '@codemirror/view'
import { getChunks } from '@codemirror/merge'
import {
  AddReviewMarker,
  MAX_REVIEW_NOTE_LENGTH,
  ReviewComposerWidget,
  ReviewNoteWidget,
  type PositionedReviewNote
} from './codemirror-diff-review-widgets'

type StoredReviewNote = {
  id: string
  line: number
  body: string
  createdAt: number
}

type ReviewState = {
  open: { pos: number; line: number } | null
  notes: PositionedReviewNote[]
}

const STORAGE_PREFIX = 'sol.diff-review-notes.v1:'
const MAX_NOTES_PER_DIFF = 100
const MAX_NOTE_LENGTH = MAX_REVIEW_NOTE_LENGTH

function readStoredNotes(reviewKey: string): StoredReviewNote[] {
  try {
    const value = window.localStorage.getItem(`${STORAGE_PREFIX}${reviewKey}`)
    if (!value) {
      return []
    }
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter(
        (note): note is StoredReviewNote =>
          typeof note === 'object' &&
          note !== null &&
          typeof note.id === 'string' &&
          typeof note.line === 'number' &&
          Number.isInteger(note.line) &&
          note.line > 0 &&
          typeof note.body === 'string' &&
          typeof note.createdAt === 'number'
      )
      .slice(-MAX_NOTES_PER_DIFF)
  } catch {
    return []
  }
}

function writeStoredNotes(reviewKey: string, notes: readonly PositionedReviewNote[]): void {
  try {
    const stored: StoredReviewNote[] = notes.slice(-MAX_NOTES_PER_DIFF).map((note) => ({
      id: note.id,
      line: note.line,
      body: note.body.slice(0, MAX_NOTE_LENGTH),
      createdAt: note.createdAt
    }))
    window.localStorage.setItem(`${STORAGE_PREFIX}${reviewKey}`, JSON.stringify(stored))
  } catch {
    // Why: review remains usable for the current mount when storage is unavailable.
  }
}

function createNoteId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `review-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
}

function lineEndPosition(state: EditorState, lineNumber: number): number {
  const boundedLine = Math.max(1, Math.min(lineNumber, state.doc.lines))
  return state.doc.line(boundedLine).to
}

function initialReviewState(state: EditorState, reviewKey: string): ReviewState {
  return {
    open: null,
    notes: readStoredNotes(reviewKey).map((note) => ({
      ...note,
      line: Math.max(1, Math.min(note.line, state.doc.lines)),
      pos: lineEndPosition(state, note.line)
    }))
  }
}

function isChangedModifiedLine(view: EditorView, lineNumber: number): boolean {
  const result = getChunks(view.state)
  if (!result || result.side === 'a') {
    return false
  }
  for (const chunk of result.chunks) {
    const start = view.state.doc.lineAt(Math.min(chunk.fromB, view.state.doc.length)).number
    const end = view.state.doc.lineAt(Math.min(chunk.endB, view.state.doc.length)).number
    if (lineNumber >= start && lineNumber <= end) {
      return true
    }
  }
  return false
}

export function diffReviewExtension(reviewKey: string): Extension {
  const openEffect = StateEffect.define<number | null>()
  const addEffect = StateEffect.define<{ pos: number; body: string }>()
  const removeEffect = StateEffect.define<string>()
  let currentView: EditorView | null = null
  let reviewField: StateField<ReviewState>

  const persist = (): void => {
    if (currentView) {
      writeStoredNotes(reviewKey, currentView.state.field(reviewField).notes)
    }
  }

  const dispatch = (effect: StateEffect<unknown>): void => {
    currentView?.dispatch({ effects: effect })
  }

  const decorations = (state: ReviewState) => {
    const ranges = state.notes.map((note) =>
      Decoration.widget({
        block: true,
        side: 1,
        widget: new ReviewNoteWidget(note, () => {
          dispatch(removeEffect.of(note.id))
          persist()
        })
      }).range(note.pos)
    )
    if (state.open) {
      const open = state.open
      ranges.push(
        Decoration.widget({
          block: true,
          side: 2,
          widget: new ReviewComposerWidget(
            open.line,
            (body) => {
              dispatch(addEffect.of({ pos: open.pos, body }))
              persist()
            },
            () => dispatch(openEffect.of(null))
          )
        }).range(open.pos)
      )
    }
    return Decoration.set(ranges, true)
  }

  reviewField = StateField.define<ReviewState>({
    create(state) {
      return initialReviewState(state, reviewKey)
    },
    update(value, transaction) {
      let next: ReviewState = {
        open:
          value.open === null
            ? null
            : {
                pos: transaction.changes.mapPos(value.open.pos),
                line: transaction.state.doc.lineAt(transaction.changes.mapPos(value.open.pos))
                  .number
              },
        notes: value.notes.map((note) => {
          const pos = transaction.changes.mapPos(note.pos)
          return { ...note, pos, line: transaction.state.doc.lineAt(pos).number }
        })
      }
      for (const effect of transaction.effects) {
        if (effect.is(openEffect)) {
          next = {
            ...next,
            open:
              effect.value === null
                ? null
                : {
                    pos: effect.value,
                    line: transaction.state.doc.lineAt(effect.value).number
                  }
          }
        }
        if (effect.is(addEffect)) {
          const line = transaction.state.doc.lineAt(effect.value.pos).number
          next = {
            open: null,
            notes: [
              ...next.notes,
              {
                id: createNoteId(),
                line,
                pos: transaction.state.doc.line(line).to,
                body: effect.value.body.slice(0, MAX_NOTE_LENGTH),
                createdAt: Date.now()
              }
            ].slice(-MAX_NOTES_PER_DIFF)
          }
        }
        if (effect.is(removeEffect)) {
          next = { ...next, notes: next.notes.filter((note) => note.id !== effect.value) }
        }
      }
      return next
    },
    provide: (field) => EditorView.decorations.from(field, decorations)
  })

  const reviewLifecycle = ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        currentView = view
      }

      update(update: ViewUpdate): void {
        currentView = update.view
        if (update.docChanged) {
          persist()
        }
      }

      destroy(): void {
        currentView = null
      }
    }
  )

  const reviewGutter = gutter({
    class: 'orca-diff-review-gutter',
    lineMarker(view, line) {
      const lineNumber = view.state.doc.lineAt(line.from).number
      if (!isChangedModifiedLine(view, lineNumber)) {
        return null
      }
      return new AddReviewMarker(line.to, (target, pos) => {
        target.dispatch({ effects: openEffect.of(pos) })
      })
    }
  })

  return [reviewField, reviewLifecycle, reviewGutter]
}
