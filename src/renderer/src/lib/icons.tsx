/* eslint-disable max-lines -- Why: Phase C icon bridge re-exports the full Lucide surface used by the app as Phosphor icons so call sites keep stable names during migration. */
import { forwardRef, type ForwardRefExoticComponent, type Ref, type RefAttributes } from 'react'
import type {
  Icon as PhosphorIconComponent,
  IconProps as PhosphorIconProps,
  IconWeight
} from '@phosphor-icons/react'
import {
  AppWindow as PhosphorAppWindow,
  Archive as PhosphorArchive,
  ArrowBendDownLeft as PhosphorArrowBendDownLeft,
  ArrowClockwise as PhosphorArrowClockwise,
  ArrowCounterClockwise as PhosphorArrowCounterClockwise,
  ArrowDown as PhosphorArrowDown,
  ArrowLeft as PhosphorArrowLeft,
  ArrowLineDown as PhosphorArrowLineDown,
  ArrowLineUp as PhosphorArrowLineUp,
  ArrowRight as PhosphorArrowRight,
  ArrowSquareOut as PhosphorArrowSquareOut,
  ArrowUUpLeft as PhosphorArrowUUpLeft,
  ArrowUp as PhosphorArrowUp,
  ArrowUpRight as PhosphorArrowUpRight,
  ArrowsClockwise as PhosphorArrowsClockwise,
  ArrowsCounterClockwise as PhosphorArrowsCounterClockwise,
  ArrowsDownUp as PhosphorArrowsDownUp,
  ArrowsIn as PhosphorArrowsIn,
  ArrowsLeftRight as PhosphorArrowsLeftRight,
  ArrowsOut as PhosphorArrowsOut,
  Bell as PhosphorBell,
  BellRinging as PhosphorBellRinging,
  BellSlash as PhosphorBellSlash,
  Bluetooth as PhosphorBluetooth,
  BookOpen as PhosphorBookOpen,
  Bookmark as PhosphorBookmark,
  BracketsCurly as PhosphorBracketsCurly,
  Brain as PhosphorBrain,
  Briefcase as PhosphorBriefcase,
  Broadcast as PhosphorBroadcast,
  Bug as PhosphorBug,
  Buildings as PhosphorBuildings,
  Calendar as PhosphorCalendar,
  CalendarBlank as PhosphorCalendarBlank,
  Camera as PhosphorCamera,
  CaretDoubleDown as PhosphorCaretDoubleDown,
  CaretDoubleUp as PhosphorCaretDoubleUp,
  CaretDown as PhosphorCaretDown,
  CaretLeft as PhosphorCaretLeft,
  CaretRight as PhosphorCaretRight,
  CaretUp as PhosphorCaretUp,
  CaretUpDown as PhosphorCaretUpDown,
  ChartBar as PhosphorChartBar,
  ChatCircleDots as PhosphorChatCircleDots,
  ChatTeardropText as PhosphorChatTeardropText,
  Check as PhosphorCheck,
  CheckCircle as PhosphorCheckCircle,
  Circle as PhosphorCircle,
  CircleDashed as PhosphorCircleDashed,
  CircleNotch as PhosphorCircleNotch,
  Clipboard as PhosphorClipboard,
  ClipboardText as PhosphorClipboardText,
  Clock as PhosphorClock,
  Cloud as PhosphorCloud,
  CloudArrowUp as PhosphorCloudArrowUp,
  Code as PhosphorCode,
  CodeBlock as PhosphorCodeBlock,
  Coins as PhosphorCoins,
  Columns as PhosphorColumns,
  Copy as PhosphorCopy,
  Cpu as PhosphorCpu,
  Crosshair as PhosphorCrosshair,
  Cube as PhosphorCube,
  Cursor as PhosphorCursor,
  Database as PhosphorDatabase,
  DeviceMobile as PhosphorDeviceMobile,
  Devices as PhosphorDevices,
  DotsThree as PhosphorDotsThree,
  DotsThreeCircle as PhosphorDotsThreeCircle,
  DotsThreeVertical as PhosphorDotsThreeVertical,
  DownloadSimple as PhosphorDownloadSimple,
  Eraser as PhosphorEraser,
  Eye as PhosphorEye,
  EyeSlash as PhosphorEyeSlash,
  Faders as PhosphorFaders,
  File as PhosphorFile,
  FileArchive as PhosphorFileArchive,
  FileArrowUp as PhosphorFileArrowUp,
  FileAudio as PhosphorFileAudio,
  FileCode as PhosphorFileCode,
  FileDashed as PhosphorFileDashed,
  FileImage as PhosphorFileImage,
  FileLock as PhosphorFileLock,
  FilePlus as PhosphorFilePlus,
  FileText as PhosphorFileText,
  FileVideo as PhosphorFileVideo,
  FileXls as PhosphorFileXls,
  Files as PhosphorFiles,
  Fingerprint as PhosphorFingerprint,
  Flag as PhosphorFlag,
  Flask as PhosphorFlask,
  FloppyDisk as PhosphorFloppyDisk,
  Folder as PhosphorFolder,
  FolderMinus as PhosphorFolderMinus,
  FolderOpen as PhosphorFolderOpen,
  FolderPlus as PhosphorFolderPlus,
  FolderSimple as PhosphorFolderSimple,
  FolderSimpleDashed as PhosphorFolderSimpleDashed,
  Funnel as PhosphorFunnel,
  Gauge as PhosphorGauge,
  GearSix as PhosphorGearSix,
  GitBranch as PhosphorGitBranch,
  GitCommit as PhosphorGitCommit,
  GitDiff as PhosphorGitDiff,
  GitFork as PhosphorGitFork,
  GitMerge as PhosphorGitMerge,
  GitPullRequest as PhosphorGitPullRequest,
  GithubLogo as PhosphorGithubLogo,
  GitlabLogo as PhosphorGitlabLogo,
  Globe as PhosphorGlobe,
  HardDrives as PhosphorHardDrives,
  Hash as PhosphorHash,
  House as PhosphorHouse,
  Image as PhosphorImage,
  ImageBroken as PhosphorImageBroken,
  Info as PhosphorInfo,
  Kanban as PhosphorKanban,
  Key as PhosphorKey,
  Keyboard as PhosphorKeyboard,
  Lightbulb as PhosphorLightbulb,
  Lightning as PhosphorLightning,
  Link as PhosphorLink,
  LinkBreak as PhosphorLinkBreak,
  LinkSimple as PhosphorLinkSimple,
  List as PhosphorList,
  ListChecks as PhosphorListChecks,
  ListDashes as PhosphorListDashes,
  ListNumbers as PhosphorListNumbers,
  Lock as PhosphorLock,
  MagnifyingGlass as PhosphorMagnifyingGlass,
  MagnifyingGlassMinus as PhosphorMagnifyingGlassMinus,
  MagnifyingGlassPlus as PhosphorMagnifyingGlassPlus,
  MapTrifold as PhosphorMapTrifold,
  Memory as PhosphorMemory,
  Microphone as PhosphorMicrophone,
  Minus as PhosphorMinus,
  MinusCircle as PhosphorMinusCircle,
  Monitor as PhosphorMonitor,
  MonitorArrowUp as PhosphorMonitorArrowUp,
  Moon as PhosphorMoon,
  Network as PhosphorNetwork,
  Note as PhosphorNote,
  Notebook as PhosphorNotebook,
  Package as PhosphorPackage,
  Palette as PhosphorPalette,
  PaperPlaneTilt as PhosphorPaperPlaneTilt,
  Paperclip as PhosphorPaperclip,
  Paragraph as PhosphorParagraph,
  Path as PhosphorPath,
  Pause as PhosphorPause,
  PauseCircle as PhosphorPauseCircle,
  PencilSimple as PhosphorPencilSimple,
  PencilSimpleLine as PhosphorPencilSimpleLine,
  PersonSimple as PhosphorPersonSimple,
  Play as PhosphorPlay,
  PlayCircle as PhosphorPlayCircle,
  Plug as PhosphorPlug,
  Plugs as PhosphorPlugs,
  PlugsConnected as PhosphorPlugsConnected,
  Plus as PhosphorPlus,
  Prohibit as PhosphorProhibit,
  Pulse as PhosphorPulse,
  PushPin as PhosphorPushPin,
  PushPinSlash as PhosphorPushPinSlash,
  Question as PhosphorQuestion,
  Quotes as PhosphorQuotes,
  Radio as PhosphorRadio,
  Robot as PhosphorRobot,
  Rocket as PhosphorRocket,
  Rows as PhosphorRows,
  Shapes as PhosphorShapes,
  ShareNetwork as PhosphorShareNetwork,
  Shield as PhosphorShield,
  ShieldCheck as PhosphorShieldCheck,
  ShieldWarning as PhosphorShieldWarning,
  Sidebar as PhosphorSidebar,
  Sigma as PhosphorSigma,
  SlidersHorizontal as PhosphorSlidersHorizontal,
  Sparkle as PhosphorSparkle,
  SpeakerLow as PhosphorSpeakerLow,
  SplitVertical as PhosphorSplitVertical,
  Square as PhosphorSquare,
  SquaresFour as PhosphorSquaresFour,
  Stack as PhosphorStack,
  Star as PhosphorStar,
  StopCircle as PhosphorStopCircle,
  Sun as PhosphorSun,
  Table as PhosphorTable,
  Tag as PhosphorTag,
  Terminal as PhosphorTerminal,
  TerminalWindow as PhosphorTerminalWindow,
  TextAa as PhosphorTextAa,
  TextAlignLeft as PhosphorTextAlignLeft,
  TextB as PhosphorTextB,
  TextHFive as PhosphorTextHFive,
  TextHFour as PhosphorTextHFour,
  TextHOne as PhosphorTextHOne,
  TextHThree as PhosphorTextHThree,
  TextHTwo as PhosphorTextHTwo,
  TextItalic as PhosphorTextItalic,
  TextStrikethrough as PhosphorTextStrikethrough,
  TextT as PhosphorTextT,
  Textbox as PhosphorTextbox,
  Ticket as PhosphorTicket,
  Timer as PhosphorTimer,
  Trash as PhosphorTrash,
  TreeStructure as PhosphorTreeStructure,
  UploadSimple as PhosphorUploadSimple,
  Usb as PhosphorUsb,
  User as PhosphorUser,
  UserGear as PhosphorUserGear,
  UserMinus as PhosphorUserMinus,
  UserPlus as PhosphorUserPlus,
  Users as PhosphorUsers,
  Warning as PhosphorWarning,
  WarningCircle as PhosphorWarningCircle,
  Waveform as PhosphorWaveform,
  Wrench as PhosphorWrench,
  X as PhosphorX,
  XCircle as PhosphorXCircle
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export type IconProps = Omit<PhosphorIconProps, 'weight' | 'size'> & {
  /** CSS length or number (px). Prefer className size-* with size="1em". */
  size?: number | string
  weight?: IconWeight
  /** Accepted for Lucide API compatibility; ignored (Phosphor uses weight). */
  strokeWidth?: number | string
  absoluteStrokeWidth?: boolean
}

export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>
/** @deprecated Prefer IconComponent — kept for Lucide call-site compatibility. */
export type LucideIcon = IconComponent
/** @deprecated Prefer IconProps — kept for Lucide call-site compatibility. */
export type LucideProps = IconProps

function wrap(Icon: PhosphorIconComponent, defaultWeight: IconWeight = 'regular'): IconComponent {
  const Wrapped = forwardRef(function WrappedIcon(
    {
      className,
      size = '1em',
      weight = defaultWeight,
      strokeWidth: _strokeWidth,
      absoluteStrokeWidth: _abs,
      ...props
    }: IconProps,
    ref: Ref<SVGSVGElement>
  ) {
    return <Icon ref={ref} className={cn(className)} size={size} weight={weight} {...props} />
  })
  Wrapped.displayName = Icon.displayName || Icon.name || 'Icon'
  return Wrapped
}

export const Accessibility = wrap(PhosphorPersonSimple)
export const Activity = wrap(PhosphorPulse)
export const AlertCircle = wrap(PhosphorWarningCircle)
export const AlertTriangle = wrap(PhosphorWarning)
export const AppWindow = wrap(PhosphorAppWindow)
export const ArchiveRestore = wrap(PhosphorArchive)
export const ArrowDown = wrap(PhosphorArrowDown)
export const ArrowDownToLine = wrap(PhosphorArrowLineDown)
export const ArrowDownUp = wrap(PhosphorArrowsDownUp)
export const ArrowLeft = wrap(PhosphorArrowLeft)
export const ArrowRight = wrap(PhosphorArrowRight)
export const ArrowRightLeft = wrap(PhosphorArrowsLeftRight)
export const ArrowUp = wrap(PhosphorArrowUp)
export const ArrowUpDown = wrap(PhosphorArrowsDownUp)
export const ArrowUpRight = wrap(PhosphorArrowUpRight)
export const ArrowUpToLine = wrap(PhosphorArrowLineUp)
export const AudioWaveform = wrap(PhosphorWaveform)
export const Ban = wrap(PhosphorProhibit)
export const BarChart3 = wrap(PhosphorChartBar)
export const Bell = wrap(PhosphorBell)
export const BellDot = wrap(PhosphorBell)
export const BellOff = wrap(PhosphorBellSlash)
export const BellRing = wrap(PhosphorBellRinging)
export const Blocks = wrap(PhosphorSquaresFour)
export const Bluetooth = wrap(PhosphorBluetooth)
export const Bold = wrap(PhosphorTextB)
export const Bookmark = wrap(PhosphorBookmark)
export const BookOpen = wrap(PhosphorBookOpen)
export const Bot = wrap(PhosphorRobot)
export const Box = wrap(PhosphorPackage)
export const Braces = wrap(PhosphorBracketsCurly)
export const Brain = wrap(PhosphorBrain)
export const Briefcase = wrap(PhosphorBriefcase)
export const Bug = wrap(PhosphorBug)
export const Building2 = wrap(PhosphorBuildings)
export const Cable = wrap(PhosphorPlugsConnected)
export const Calendar = wrap(PhosphorCalendar)
export const CalendarClock = wrap(PhosphorCalendar)
export const CalendarDays = wrap(PhosphorCalendarBlank)
export const Camera = wrap(PhosphorCamera)
export const CaseSensitive = wrap(PhosphorTextAa)
export const Check = wrap(PhosphorCheck)
export const CheckCircle2 = wrap(PhosphorCheckCircle)
export const CheckIcon = wrap(PhosphorCheck)
export const ChevronDown = wrap(PhosphorCaretDown)
export const ChevronDownIcon = wrap(PhosphorCaretDown)
export const ChevronLeft = wrap(PhosphorCaretLeft)
export const ChevronRight = wrap(PhosphorCaretRight)
export const ChevronRightIcon = wrap(PhosphorCaretRight)
export const ChevronsUpDown = wrap(PhosphorCaretUpDown)
export const ChevronUp = wrap(PhosphorCaretUp)
export const ChevronUpIcon = wrap(PhosphorCaretUp)
export const Circle = wrap(PhosphorCircle)
export const CircleAlert = wrap(PhosphorWarningCircle)
export const CircleCheck = wrap(PhosphorCheckCircle)
export const CircleCheckIcon = wrap(PhosphorCheckCircle)
export const CircleDashed = wrap(PhosphorCircleDashed)
export const CircleDot = wrap(PhosphorCircle)
export const CircleEllipsis = wrap(PhosphorDotsThreeCircle)
export const CircleHelp = wrap(PhosphorQuestion)
export const CircleIcon = wrap(PhosphorCircle)
export const CircleMinus = wrap(PhosphorMinusCircle)
export const CirclePause = wrap(PhosphorPauseCircle)
export const CirclePlay = wrap(PhosphorPlayCircle)
export const CircleSlash = wrap(PhosphorProhibit)
export const CircleStop = wrap(PhosphorStopCircle)
export const CircleX = wrap(PhosphorXCircle)
export const Clipboard = wrap(PhosphorClipboard)
export const ClipboardCopy = wrap(PhosphorClipboardText)
export const Clock = wrap(PhosphorClock)
export const Clock3 = wrap(PhosphorClock)
export const Cloud = wrap(PhosphorCloud)
export const CloudUpload = wrap(PhosphorCloudArrowUp)
export const Code = wrap(PhosphorCode)
export const Code2 = wrap(PhosphorCode)
export const Coins = wrap(PhosphorCoins)
export const Columns2 = wrap(PhosphorColumns)
export const Columns3 = wrap(PhosphorColumns)
export const Copy = wrap(PhosphorCopy)
export const CornerDownLeft = wrap(PhosphorArrowBendDownLeft)
export const Cpu = wrap(PhosphorCpu)
export const Crosshair = wrap(PhosphorCrosshair)
export const Database = wrap(PhosphorDatabase)
export const DatabaseZap = wrap(PhosphorDatabase)
export const Download = wrap(PhosphorDownloadSimple)
export const Ellipsis = wrap(PhosphorDotsThree)
export const EllipsisVertical = wrap(PhosphorDotsThreeVertical)
export const Eraser = wrap(PhosphorEraser)
export const ExternalLink = wrap(PhosphorArrowSquareOut)
export const Eye = wrap(PhosphorEye)
export const EyeOff = wrap(PhosphorEyeSlash)
export const File = wrap(PhosphorFile)
export const FileArchive = wrap(PhosphorFileArchive)
export const FileAudio = wrap(PhosphorFileAudio)
export const FileAxis3D = wrap(PhosphorCube)
export const FileBox = wrap(PhosphorPackage)
export const FileBraces = wrap(PhosphorFileCode)
export const FileChartColumn = wrap(PhosphorChartBar)
export const FileCode = wrap(PhosphorFileCode)
export const FileCode2 = wrap(PhosphorFileCode)
export const FileCog = wrap(PhosphorFileDashed)
export const FileDiff = wrap(PhosphorGitDiff)
export const FileImage = wrap(PhosphorFileImage)
export const FileJson = wrap(PhosphorFileCode)
export const FileKey = wrap(PhosphorFileLock)
export const FileLock = wrap(PhosphorFileLock)
export const FileMusic = wrap(PhosphorFileAudio)
export const FilePlus = wrap(PhosphorFilePlus)
export const Files = wrap(PhosphorFiles)
export const FileSliders = wrap(PhosphorFileDashed)
export const FileSpreadsheet = wrap(PhosphorFileXls)
export const FileTerminal = wrap(PhosphorTerminalWindow)
export const FileText = wrap(PhosphorFileText)
export const FileType = wrap(PhosphorFileText)
export const FileUp = wrap(PhosphorFileArrowUp)
export const FileVideo = wrap(PhosphorFileVideo)
export const FileWarning = wrap(PhosphorWarning)
export const Filter = wrap(PhosphorFunnel)
export const Fingerprint = wrap(PhosphorFingerprint)
export const Flag = wrap(PhosphorFlag)
export const FlaskConical = wrap(PhosphorFlask)
export const Folder = wrap(PhosphorFolder)
export const FolderGit2 = wrap(PhosphorFolderSimple)
export const FolderInput = wrap(PhosphorFolderSimpleDashed)
export const FolderKanban = wrap(PhosphorFolderSimple)
export const FolderOpen = wrap(PhosphorFolderOpen)
export const FolderPlus = wrap(PhosphorFolderPlus)
export const FolderTree = wrap(PhosphorTreeStructure)
export const FolderX = wrap(PhosphorFolderMinus)
export const Gauge = wrap(PhosphorGauge)
export const GitBranch = wrap(PhosphorGitBranch)
export const GitBranchPlus = wrap(PhosphorGitBranch)
export const GitCommitHorizontal = wrap(PhosphorGitCommit)
export const GitCompare = wrap(PhosphorGitDiff)
export const GitCompareArrows = wrap(PhosphorGitDiff)
export const GitFork = wrap(PhosphorGitFork)
export const Github = wrap(PhosphorGithubLogo)
export const Gitlab = wrap(PhosphorGitlabLogo)
export const GitMerge = wrap(PhosphorGitMerge)
export const GitPullRequest = wrap(PhosphorGitPullRequest)
export const GitPullRequestArrow = wrap(PhosphorGitPullRequest)
export const GitPullRequestClosed = wrap(PhosphorGitPullRequest)
export const GitPullRequestDraft = wrap(PhosphorGitPullRequest)
export const Globe = wrap(PhosphorGlobe)
export const Globe2 = wrap(PhosphorGlobe)
export const HardDrive = wrap(PhosphorHardDrives)
export const Hash = wrap(PhosphorHash)
export const Heading1 = wrap(PhosphorTextHOne)
export const Heading2 = wrap(PhosphorTextHTwo)
export const Heading3 = wrap(PhosphorTextHThree)
export const Heading4 = wrap(PhosphorTextHFour)
export const Heading5 = wrap(PhosphorTextHFive)
export const HelpCircle = wrap(PhosphorQuestion)
export const Home = wrap(PhosphorHouse)
export const Image = wrap(PhosphorImage)
export const ImageIcon = wrap(PhosphorImage)
export const ImageOff = wrap(PhosphorImageBroken)
export const Import = wrap(PhosphorDownloadSimple)
export const Info = wrap(PhosphorInfo)
export const InfoIcon = wrap(PhosphorInfo)
export const Italic = wrap(PhosphorTextItalic)
export const Kanban = wrap(PhosphorKanban)
export const KanbanSquare = wrap(PhosphorKanban)
export const Keyboard = wrap(PhosphorKeyboard)
export const KeyRound = wrap(PhosphorKey)
export const Layers = wrap(PhosphorStack)
export const Layers3 = wrap(PhosphorStack)
export const LayoutGrid = wrap(PhosphorSquaresFour)
export const Lightbulb = wrap(PhosphorLightbulb)
export const Link = wrap(PhosphorLink)
export const Link2 = wrap(PhosphorLinkSimple)
export const List = wrap(PhosphorList)
export const ListChecks = wrap(PhosphorListChecks)
export const ListCollapse = wrap(PhosphorListDashes)
export const ListFilter = wrap(PhosphorFunnel)
export const ListOrdered = wrap(PhosphorListNumbers)
export const ListTodo = wrap(PhosphorListChecks)
export const ListTree = wrap(PhosphorTreeStructure)
export const ListX = wrap(PhosphorList)
export const Loader = wrap(PhosphorCircleNotch, 'bold')
export const Loader2 = wrap(PhosphorCircleNotch, 'bold')
export const Loader2Icon = wrap(PhosphorCircleNotch, 'bold')
export const LoaderCircle = wrap(PhosphorCircleNotch, 'bold')
export const LocateFixed = wrap(PhosphorCrosshair)
export const Lock = wrap(PhosphorLock)
export const Map = wrap(PhosphorMapTrifold)
export const Maximize2 = wrap(PhosphorArrowsOut)
export const MemoryStick = wrap(PhosphorMemory)
export const MessageCircleQuestionMark = wrap(PhosphorChatCircleDots)
export const MessageSquare = wrap(PhosphorChatTeardropText)
export const MessageSquarePlus = wrap(PhosphorChatTeardropText)
export const MessageSquareText = wrap(PhosphorChatTeardropText)
export const Mic = wrap(PhosphorMicrophone)
export const Minimize2 = wrap(PhosphorArrowsIn)
export const Minus = wrap(PhosphorMinus)
export const MinusCircle = wrap(PhosphorMinusCircle)
export const Monitor = wrap(PhosphorMonitor)
export const MonitorSmartphone = wrap(PhosphorDevices)
export const MonitorUp = wrap(PhosphorMonitorArrowUp)
export const Moon = wrap(PhosphorMoon)
export const MoreHorizontal = wrap(PhosphorDotsThree)
export const MoreVertical = wrap(PhosphorDotsThreeVertical)
export const MousePointer2 = wrap(PhosphorCursor)
export const MoveDown = wrap(PhosphorArrowDown)
export const MoveRight = wrap(PhosphorArrowRight)
export const MoveUp = wrap(PhosphorArrowUp)
export const Network = wrap(PhosphorNetwork)
export const NotebookText = wrap(PhosphorNotebook)
export const OctagonX = wrap(PhosphorXCircle)
export const OctagonXIcon = wrap(PhosphorXCircle)
export const Package = wrap(PhosphorPackage)
export const PackageCheck = wrap(PhosphorPackage)
export const Palette = wrap(PhosphorPalette)
export const PanelBottomClose = wrap(PhosphorCaretDoubleDown)
export const PanelLeft = wrap(PhosphorSidebar)
export const PanelLeftClose = wrap(PhosphorSidebar)
export const PanelLeftOpen = wrap(PhosphorSidebar)
export const PanelRight = wrap(PhosphorSidebar)
export const PanelRightClose = wrap(PhosphorSidebar)
export const PanelsTopLeft = wrap(PhosphorSquaresFour)
export const PanelTopOpen = wrap(PhosphorCaretDoubleUp)
export const Paperclip = wrap(PhosphorPaperclip)
export const Pause = wrap(PhosphorPause)
export const Pencil = wrap(PhosphorPencilSimple)
export const PencilLine = wrap(PhosphorPencilSimpleLine)
export const Pilcrow = wrap(PhosphorParagraph)
export const Pin = wrap(PhosphorPushPin)
export const PinOff = wrap(PhosphorPushPinSlash)
export const Play = wrap(PhosphorPlay)
export const PlayCircle = wrap(PhosphorPlayCircle)
export const Plug = wrap(PhosphorPlug)
export const PlugZap = wrap(PhosphorPlugsConnected)
export const Plus = wrap(PhosphorPlus)
export const Quote = wrap(PhosphorQuotes)
export const Radar = wrap(PhosphorBroadcast)
export const Radio = wrap(PhosphorRadio)
export const RefreshCcw = wrap(PhosphorArrowsCounterClockwise)
export const RefreshCw = wrap(PhosphorArrowsClockwise)
export const Regex = wrap(PhosphorCode)
export const Replace = wrap(PhosphorArrowsLeftRight)
export const ReplaceAll = wrap(PhosphorArrowsLeftRight)
export const Rocket = wrap(PhosphorRocket)
export const RotateCcw = wrap(PhosphorArrowCounterClockwise)
export const RotateCw = wrap(PhosphorArrowClockwise)
export const Rows2 = wrap(PhosphorRows)
export const Save = wrap(PhosphorFloppyDisk)
export const Search = wrap(PhosphorMagnifyingGlass)
export const SearchIcon = wrap(PhosphorMagnifyingGlass)
export const Send = wrap(PhosphorPaperPlaneTilt)
export const SendHorizontal = wrap(PhosphorPaperPlaneTilt)
export const Server = wrap(PhosphorHardDrives)
export const ServerCog = wrap(PhosphorHardDrives)
export const ServerOff = wrap(PhosphorHardDrives)
export const Settings = wrap(PhosphorGearSix)
export const Settings2 = wrap(PhosphorFaders)
export const Shapes = wrap(PhosphorShapes)
export const Share2 = wrap(PhosphorShareNetwork)
export const ShieldAlert = wrap(PhosphorShieldWarning)
export const ShieldCheck = wrap(PhosphorShieldCheck)
export const ShieldQuestion = wrap(PhosphorShield)
export const Sigma = wrap(PhosphorSigma)
export const SlidersHorizontal = wrap(PhosphorSlidersHorizontal)
export const Smartphone = wrap(PhosphorDeviceMobile)
export const Sparkle = wrap(PhosphorSparkle)
export const Sparkles = wrap(PhosphorSparkle)
export const Square = wrap(PhosphorSquare)
export const SquareChevronRight = wrap(PhosphorCaretRight)
export const SquareCode = wrap(PhosphorCodeBlock)
export const SquareSplitVertical = wrap(PhosphorSplitVertical)
export const SquareTerminal = wrap(PhosphorTerminalWindow)
export const Star = wrap(PhosphorStar)
export const StickyNote = wrap(PhosphorNote)
export const Strikethrough = wrap(PhosphorTextStrikethrough)
export const Sun = wrap(PhosphorSun)
export const Table = wrap(PhosphorTable)
export const Table2 = wrap(PhosphorTable)
export const Tag = wrap(PhosphorTag)
export const Terminal = wrap(PhosphorTerminal)
export const TerminalSquare = wrap(PhosphorTerminalWindow)
export const TextCursorInput = wrap(PhosphorTextbox)
export const TicketCheck = wrap(PhosphorTicket)
export const Timer = wrap(PhosphorTimer)
export const Trash = wrap(PhosphorTrash)
export const Trash2 = wrap(PhosphorTrash)
export const TriangleAlert = wrap(PhosphorWarning)
export const TriangleAlertIcon = wrap(PhosphorWarning)
export const Undo2 = wrap(PhosphorArrowUUpLeft)
export const UndoDot = wrap(PhosphorArrowUUpLeft)
export const Unlink = wrap(PhosphorLinkBreak)
export const Unplug = wrap(PhosphorPlugs)
export const Upload = wrap(PhosphorUploadSimple)
export const UploadCloud = wrap(PhosphorCloudArrowUp)
export const Usb = wrap(PhosphorUsb)
export const UserCog = wrap(PhosphorUserGear)
export const UserMinus = wrap(PhosphorUserMinus)
export const UserPlus = wrap(PhosphorUserPlus)
export const UserRound = wrap(PhosphorUser)
export const Users = wrap(PhosphorUsers)
export const Volume1 = wrap(PhosphorSpeakerLow)
export const Waypoints = wrap(PhosphorPath)
export const WholeWord = wrap(PhosphorTextT)
export const Workflow = wrap(PhosphorTreeStructure)
export const WrapText = wrap(PhosphorTextAlignLeft)
export const Wrench = wrap(PhosphorWrench)
export const X = wrap(PhosphorX)
export const XCircle = wrap(PhosphorXCircle)
export const XIcon = wrap(PhosphorX)
export const Zap = wrap(PhosphorLightning)
export const ZoomIn = wrap(PhosphorMagnifyingGlassPlus)
export const ZoomOut = wrap(PhosphorMagnifyingGlassMinus)
