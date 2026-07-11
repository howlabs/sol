import { isClaudeHeadlessOneShotCommand } from './claude-headless-command'
import type { TuiAgent } from './types'

export function isHeadlessOneShotAgentCommand(agent: TuiAgent, tokens: readonly string[]): boolean {
  return agent === 'claude' && isClaudeHeadlessOneShotCommand(tokens)
}

type AgentCommandRecognition = { agent: TuiAgent } | null

export function filterHeadlessOneShotAgentCommand<T extends AgentCommandRecognition>(
  recognition: T,
  tokens: readonly string[]
): T | null {
  if (recognition && isHeadlessOneShotAgentCommand(recognition.agent, tokens)) {
    return null
  }
  return recognition
}
