import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import type { AiVaultSession } from '../../shared/ai-vault-types'
import type { ExecutionHostId } from '../../shared/execution-host'
import type {
  FileWithMtime,
  ResumableSessionParseState,
  SessionAccumulator
} from './session-scanner-types'
import {
  accumulatorFoldResumeState,
  addPreviewContent,
  createAccumulator,
  sessionIdFromFileName,
  updateTimeline
} from './session-scanner-accumulator'
import {
  asRecord,
  extractMessageText,
  extractString,
  parseJsonObject,
  tokenTotal
} from './session-scanner-values'

type ParserSessionOptions = {
  executionHostId?: ExecutionHostId
  executionHostPlatform?: NodeJS.Platform | null
}

// Agents whose transcripts are append-only message-graph JSONL (session +
// model_change + message records).
export type MessageGraphAgent = 'openclaw' | 'pi'

export async function parseMessageGraphSessionFile(
  agent: MessageGraphAgent,
  file: FileWithMtime,
  platform: NodeJS.Platform = process.platform
): Promise<AiVaultSession | null> {
  const lines = createInterface({
    input: createReadStream(file.path, { encoding: 'utf-8' }),
    crlfDelay: Infinity
  })
  return parseMessageGraphSessionLines({ agent, file, lines, platform })
}

export async function parseMessageGraphSessionContent(
  agent: MessageGraphAgent,
  file: FileWithMtime,
  content: string,
  platform: NodeJS.Platform = process.platform,
  options: ParserSessionOptions = {}
): Promise<AiVaultSession | null> {
  return parseMessageGraphSessionLines({
    agent,
    file,
    lines: content.split(/\r?\n/),
    platform,
    options
  })
}

function consumeMessageGraphRecordLine(accumulator: SessionAccumulator, line: string): void {
  const record = parseJsonObject(line)
  if (!record) {
    return
  }
  updateTimeline(accumulator, extractString(record.timestamp))
  if (record.type === 'session') {
    const sessionId = extractString(record.id)
    if (sessionId) {
      accumulator.sessionId = sessionId
    }
    accumulator.cwd = extractString(record.cwd) ?? accumulator.cwd
    return
  }
  if (record.type === 'model_change') {
    // Why: Pi writes `modelId`; prefer either so an in-progress session shows
    // its model before the first assistant reply lands.
    accumulator.model =
      extractString(record.modelId) ?? extractString(record.model) ?? accumulator.model
    return
  }
  if (record.type !== 'message') {
    return
  }
  const message = asRecord(record.message)
  const role = extractString(message?.role)
  if (role === 'user' || role === 'assistant') {
    accumulator.messageCount++
    if (role === 'user') {
      accumulator.title ??= extractMessageText(message)
    } else {
      accumulator.model = extractString(message?.model) ?? accumulator.model
      accumulator.totalTokens += tokenTotal(message?.usage)
    }
    addPreviewContent(accumulator, role, message?.content, record.timestamp)
  }
}

export function createMessageGraphSessionResumeState(
  agent: MessageGraphAgent,
  file: FileWithMtime
): ResumableSessionParseState {
  return accumulatorFoldResumeState(
    createAccumulator({ agent, file, sessionId: sessionIdFromFileName(file.path) }),
    consumeMessageGraphRecordLine
  )
}

async function parseMessageGraphSessionLines(args: {
  agent: MessageGraphAgent
  file: FileWithMtime
  lines: AsyncIterable<string> | Iterable<string>
  platform: NodeJS.Platform
  options?: ParserSessionOptions
}): Promise<AiVaultSession | null> {
  const state = createMessageGraphSessionResumeState(args.agent, args.file)
  for await (const line of args.lines) {
    state.consumeLine(line)
  }
  return state.finalize(args.platform, args.options)
}
