import { GutterMarker, WidgetType, type EditorView } from '@codemirror/view'

export const MAX_REVIEW_NOTE_LENGTH = 4_000

export type PositionedReviewNote = {
  id: string
  line: number
  body: string
  createdAt: number
  pos: number
}

export class AddReviewMarker extends GutterMarker {
  constructor(
    private readonly pos: number,
    private readonly openReview: (view: EditorView, pos: number) => void
  ) {
    super()
  }

  eq(other: AddReviewMarker): boolean {
    return other.pos === this.pos
  }

  toDOM(view: EditorView): HTMLElement {
    const line = view.state.doc.lineAt(this.pos).number
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'orca-diff-comment-add-btn'
    button.textContent = '+'
    button.title = `Add review note on line ${line}`
    button.setAttribute('aria-label', button.title)
    button.dataset.testid = 'diff-comment-add'
    button.addEventListener('mousedown', (event) => event.preventDefault())
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.openReview(view, this.pos)
    })
    return button
  }
}

export class ReviewComposerWidget extends WidgetType {
  constructor(
    private readonly line: number,
    private readonly submit: (body: string) => void,
    private readonly cancel: () => void
  ) {
    super()
  }

  eq(other: ReviewComposerWidget): boolean {
    return other.line === this.line
  }

  toDOM(): HTMLElement {
    const shell = document.createElement('div')
    shell.className = 'orca-diff-review-inline'
    shell.dataset.testid = 'diff-comment-composer'

    const composer = document.createElement('div')
    composer.className = 'orca-diff-review-composer'
    composer.setAttribute('role', 'dialog')
    composer.setAttribute('aria-label', `Review note for line ${this.line}`)

    const label = document.createElement('div')
    label.className = 'orca-diff-review-label'
    label.textContent = `Line ${this.line}`

    const textarea = document.createElement('textarea')
    textarea.className = 'orca-diff-review-textarea'
    textarea.placeholder = 'Leave feedback for this line…'
    textarea.maxLength = MAX_REVIEW_NOTE_LENGTH
    textarea.rows = 2

    const isMac = navigator.userAgent.includes('Mac')

    const submitButton = document.createElement('button')
    submitButton.type = 'button'
    submitButton.className = 'orca-diff-review-submit'
    submitButton.textContent = '+'
    submitButton.title = 'Add review note'
    submitButton.setAttribute('aria-label', submitButton.title)
    submitButton.disabled = true

    const runSubmit = (): void => {
      const body = textarea.value.trim()
      if (!body) {
        return
      }
      this.submit(body)
    }
    textarea.addEventListener('input', () => {
      submitButton.disabled = textarea.value.trim().length === 0
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(160, textarea.scrollHeight)}px`
    })
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.cancel()
      } else if (event.key === 'Enter' && (isMac ? event.metaKey : event.ctrlKey)) {
        event.preventDefault()
        runSubmit()
      }
    })
    submitButton.addEventListener('click', runSubmit)

    composer.append(label, textarea, submitButton)
    shell.append(composer)
    requestAnimationFrame(() => textarea.focus())
    return shell
  }

  ignoreEvent(): boolean {
    return true
  }
}

export class ReviewNoteWidget extends WidgetType {
  constructor(
    private readonly note: PositionedReviewNote,
    private readonly remove: () => void
  ) {
    super()
  }

  eq(other: ReviewNoteWidget): boolean {
    return other.note.id === this.note.id && other.note.body === this.note.body
  }

  toDOM(): HTMLElement {
    const shell = document.createElement('div')
    shell.className = 'orca-diff-review-inline'
    shell.dataset.testid = 'diff-comment-card'

    const card = document.createElement('div')
    card.className = 'orca-diff-review-note'
    const header = document.createElement('div')
    header.className = 'orca-diff-review-note-header'
    const label = document.createElement('span')
    label.textContent = `Review note · Line ${this.note.line}`
    const removeButton = document.createElement('button')
    removeButton.type = 'button'
    removeButton.className = 'orca-diff-review-note-remove'
    removeButton.textContent = '×'
    removeButton.title = 'Delete review note'
    removeButton.setAttribute('aria-label', removeButton.title)
    removeButton.addEventListener('click', this.remove)
    const body = document.createElement('div')
    body.className = 'orca-diff-review-note-body'
    body.textContent = this.note.body
    header.append(label, removeButton)
    card.append(header, body)
    shell.append(card)
    return shell
  }

  ignoreEvent(): boolean {
    return true
  }
}
