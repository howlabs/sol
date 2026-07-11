/**
 * Pi-compatible agent kinds. Pi consumes the `PI_CODING_AGENT_DIR` env contract
 * and Orca's managed extension installer targets `~/.pi/agent`.
 */
export type PiAgentKind = 'pi'

/**
 * True when `agentType` names a Pi-compatible (goal/mission) kind. These agents
 * emit milestone `agent_end` events between steps while still working, so they
 * are treated differently from agents that only signal completion at turn end.
 */
export function isPiCompatibleAgentType(
  agentType: string | null | undefined
): agentType is PiAgentKind {
  return agentType === 'pi'
}

/**
 * Identify the Pi-compatible agent kind a launch command targets.
 * Always returns 'pi' — OMP launch support was removed from the catalog.
 */
export function detectPiAgentKindFromCommand(_command: string | undefined): PiAgentKind {
  return 'pi'
}
