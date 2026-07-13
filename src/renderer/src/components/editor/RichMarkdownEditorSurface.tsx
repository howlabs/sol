import type React from 'react'
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { RichMarkdownToolbar } from './RichMarkdownToolbar'
import { RichMarkdownSearchBar } from './RichMarkdownSearchBar'
import { RichMarkdownSlashMenu } from './RichMarkdownSlashMenu'
import { RichMarkdownDocLinkMenu } from './RichMarkdownDocLinkMenu'
import { RichMarkdownEmojiMenu } from './RichMarkdownEmojiMenu'
import { RichMarkdownLinkBubble, type LinkBubbleState } from './RichMarkdownLinkBubble'
import { MarkdownTableOfContentsPanel } from './MarkdownTableOfContentsPanel'
import type { DocLinkMenuRow, DocLinkMenuState } from './rich-markdown-commands'
import type { SlashCommand, SlashMenuState } from './rich-markdown-slash-commands'
import type { MarkdownTocItem } from './markdown-table-of-contents'

function shouldFocusEmptyEditorFromSurfaceClick(
  event: React.MouseEvent<HTMLDivElement>,
  editor: Editor | null
): boolean {
  if (!editor?.isEmpty || event.button !== 0) {
    return false
  }
  const target = event.target
  if (!(target instanceof Element)) {
    return false
  }
  return !target.closest('.rich-markdown-editor-shell button, .rich-markdown-editor-shell input')
}

type RichMarkdownEditorSurfaceProps = {
  editor: Editor | null
  editorFontZoomLevel: number
  rootRef: (node: HTMLDivElement | null) => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  headerSlot?: React.ReactNode
  linkBubble: LinkBubbleState | null
  isEditingLink: boolean
  slashMenu: SlashMenuState | null
  filteredSlashCommands: SlashCommand[]
  selectedCommandIndex: number
  emojiMenu: { left: number; top: number } | null
  docLinkMenu: DocLinkMenuState | null
  docLinkRows: DocLinkMenuRow[]
  docLinkTotalMatches: number
  selectedDocLinkIndex: number
  tableOfContentsItems: MarkdownTocItem[]
  showTableOfContents: boolean
  searchState: {
    activeMatchIndex: number
    isReplaceMode: boolean
    isSearchOpen: boolean
    matchCase: boolean
    matchCount: number
    replaceQuery: string
    searchQuery: string
    searchInputRef: React.RefObject<HTMLInputElement | null>
    wholeWord: boolean
  }
  searchActions: {
    closeSearch: () => void
    moveToMatch: (direction: 1 | -1) => void
    replaceAllMatches: () => void
    replaceCurrentMatch: () => void
    setReplaceQuery: (query: string) => void
    setSearchQuery: (query: string) => void
    toggleMatchCase: () => void
    toggleReplaceMode: () => void
    toggleWholeWord: () => void
  }
  linkBubbleActions: {
    handleLinkSave: (href: string) => void
    handleLinkRemove: () => void
    handleLinkEditCancel: () => void
    handleLinkOpen: () => void
    setIsEditingLink: (editing: boolean) => void
  }
  onToggleLink: () => void
  onImagePick: () => void
  onEmojiPick: (menu: SlashMenuState) => void
  onCloseEmojiMenu: () => void
  onNavigateTableOfContentsItem: (id: string) => void
  onCloseTableOfContents?: () => void
}

export function RichMarkdownEditorSurface({
  editor,
  editorFontZoomLevel,
  rootRef,
  scrollContainerRef,
  headerSlot,
  linkBubble,
  isEditingLink,
  slashMenu,
  filteredSlashCommands,
  selectedCommandIndex,
  emojiMenu,
  docLinkMenu,
  docLinkRows,
  docLinkTotalMatches,
  selectedDocLinkIndex,
  tableOfContentsItems,
  showTableOfContents,
  searchState,
  searchActions,
  linkBubbleActions,
  onToggleLink,
  onImagePick,
  onEmojiPick,
  onCloseEmojiMenu,
  onNavigateTableOfContentsItem,
  onCloseTableOfContents
}: RichMarkdownEditorSurfaceProps): React.JSX.Element {
  return (
    <div className="rich-markdown-editor-layout">
      {showTableOfContents ? (
        <MarkdownTableOfContentsPanel
          items={tableOfContentsItems}
          onClose={onCloseTableOfContents ?? (() => {})}
          onNavigate={onNavigateTableOfContentsItem}
        />
      ) : null}
      <div
        ref={rootRef}
        className="rich-markdown-editor-shell"
        style={{ '--editor-font-zoom-level': editorFontZoomLevel } as React.CSSProperties}
      >
        <RichMarkdownToolbar
          editor={editor}
          onToggleLink={onToggleLink}
          onImagePick={onImagePick}
        />
        {headerSlot}
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollContainerRef}
            className="relative h-full overflow-auto scrollbar-editor"
            onMouseDown={(event) => {
              if (!shouldFocusEmptyEditorFromSurfaceClick(event, editor)) {
                return
              }
              // Why: native contenteditable only places the caret on actual line
              // boxes; an empty note should still focus from blank document space.
              event.preventDefault()
              editor?.commands.focus('start')
            }}
          >
            <EditorContent editor={editor} />
          </div>
          <RichMarkdownSearchBar
            activeMatchIndex={searchState.activeMatchIndex}
            isOpen={searchState.isSearchOpen}
            isReplaceMode={searchState.isReplaceMode}
            matchCase={searchState.matchCase}
            matchCount={searchState.matchCount}
            query={searchState.searchQuery}
            replaceQuery={searchState.replaceQuery}
            searchInputRef={searchState.searchInputRef}
            wholeWord={searchState.wholeWord}
            onClose={searchActions.closeSearch}
            onMoveToMatch={searchActions.moveToMatch}
            onQueryChange={searchActions.setSearchQuery}
            onReplaceAll={searchActions.replaceAllMatches}
            onReplaceCurrent={searchActions.replaceCurrentMatch}
            onReplaceQueryChange={searchActions.setReplaceQuery}
            onToggleMatchCase={searchActions.toggleMatchCase}
            onToggleReplaceMode={searchActions.toggleReplaceMode}
            onToggleWholeWord={searchActions.toggleWholeWord}
          />
        </div>
        {linkBubble ? (
          <RichMarkdownLinkBubble
            linkBubble={linkBubble}
            isEditing={isEditingLink}
            onSave={linkBubbleActions.handleLinkSave}
            onRemove={linkBubbleActions.handleLinkRemove}
            onEditStart={() => linkBubbleActions.setIsEditingLink(true)}
            onEditCancel={linkBubbleActions.handleLinkEditCancel}
            onOpen={linkBubbleActions.handleLinkOpen}
          />
        ) : null}
        {slashMenu ? (
          <RichMarkdownSlashMenu
            editor={editor}
            slashMenu={slashMenu}
            filteredCommands={filteredSlashCommands}
            selectedIndex={selectedCommandIndex}
            onImagePick={onImagePick}
            onEmojiPick={() => onEmojiPick(slashMenu)}
          />
        ) : null}
        {emojiMenu ? (
          <RichMarkdownEmojiMenu
            editor={editor}
            left={emojiMenu.left}
            top={emojiMenu.top}
            onClose={onCloseEmojiMenu}
          />
        ) : null}
        {docLinkMenu ? (
          <RichMarkdownDocLinkMenu
            editor={editor}
            menu={docLinkMenu}
            rows={docLinkRows}
            totalMatches={docLinkTotalMatches}
            selectedIndex={selectedDocLinkIndex}
          />
        ) : null}
      </div>
    </div>
  )
}
