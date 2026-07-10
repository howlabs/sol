import { useId, useState } from 'react'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import { parseAgentDefaultEnvDraft, stringifyAgentDefaultEnvDraft } from './agent-default-env-draft'
import { SettingsInputWithResetRow } from './settings-input-with-reset-row'

function resetLabel(): string {
  return translate('auto.components.settings.AgentsPane.5200dac9da', 'Reset')
}

type AgentCommandOverrideInputProps = {
  defaultCmd: string
  cmdOverride: string | undefined
  onSaveOverride: (value: string) => void
}

export function AgentCommandOverrideInput({
  defaultCmd,
  cmdOverride,
  onSaveOverride
}: AgentCommandOverrideInputProps): React.JSX.Element {
  const draftSeed = cmdOverride ?? defaultCmd
  const [cmdDraft, setCmdDraft] = useState(draftSeed)

  const commitCmd = (): void => {
    const trimmed = cmdDraft.trim()
    if (!trimmed || trimmed === defaultCmd) {
      onSaveOverride('')
      setCmdDraft(defaultCmd)
    } else {
      onSaveOverride(trimmed)
    }
  }

  return (
    <SettingsInputWithResetRow
      label={translate('auto.components.settings.AgentsPane.2e45ca29b6', 'Command')}
      value={cmdDraft}
      placeholder={defaultCmd}
      showReset={Boolean(cmdOverride)}
      resetLabel={resetLabel()}
      onValueChange={setCmdDraft}
      onCommit={commitCmd}
      onReset={() => {
        onSaveOverride('')
        setCmdDraft(defaultCmd)
      }}
      onEscape={() => setCmdDraft(draftSeed)}
    />
  )
}

type AgentDefaultArgsInputProps = {
  defaultArgs: string
  argsOverride: string
  onSaveArgs: (value: string) => void
}

export function AgentDefaultArgsInput({
  defaultArgs,
  argsOverride,
  onSaveArgs
}: AgentDefaultArgsInputProps): React.JSX.Element {
  const draftSeed = argsOverride
  const [argsDraft, setArgsDraft] = useState(draftSeed)

  const commitArgs = (): void => {
    onSaveArgs(argsDraft.trim())
  }

  return (
    <SettingsInputWithResetRow
      label={translate('auto.components.settings.AgentsPane.cfb3f35775', 'Arguments')}
      value={argsDraft}
      placeholder={
        defaultArgs ||
        translate('auto.components.settings.AgentsPane.6f99bf5dd0', 'No default arguments')
      }
      showReset={argsOverride !== defaultArgs}
      resetLabel={resetLabel()}
      onValueChange={setArgsDraft}
      onCommit={commitArgs}
      onReset={() => {
        onSaveArgs(defaultArgs)
        setArgsDraft(defaultArgs)
      }}
      onEscape={() => setArgsDraft(draftSeed)}
    />
  )
}

type AgentDefaultEnvInputProps = {
  defaultEnv: Record<string, string>
  envOverride: Record<string, string>
  onSaveEnv: (value: Record<string, string>) => void
}

export function AgentDefaultEnvInput({
  defaultEnv,
  envOverride,
  onSaveEnv
}: AgentDefaultEnvInputProps): React.JSX.Element {
  const defaultEnvText = stringifyAgentDefaultEnvDraft(defaultEnv)
  const draftSeed = stringifyAgentDefaultEnvDraft(envOverride)
  const [envDraft, setEnvDraft] = useState(draftSeed)
  const [envDraftTooLarge, setEnvDraftTooLarge] = useState(false)
  const envDraftErrorId = useId()

  const commitEnv = (): void => {
    const parsedDraft = parseAgentDefaultEnvDraft(envDraft)
    setEnvDraftTooLarge(parsedDraft.tooLarge)
    if (parsedDraft.tooLarge) {
      return
    }
    onSaveEnv(parsedDraft.env)
  }

  const field = (
    <SettingsInputWithResetRow
      label={translate('auto.components.settings.AgentsPane.8fbe1f37c1', 'Environment')}
      value={envDraft}
      placeholder={
        defaultEnvText ||
        translate('auto.components.settings.AgentsPane.2d133152fa', 'No default environment')
      }
      invalid={envDraftTooLarge}
      describedBy={envDraftTooLarge ? envDraftErrorId : undefined}
      showReset={draftSeed !== defaultEnvText}
      resetLabel={resetLabel()}
      onValueChange={(value) => {
        setEnvDraft(value)
        if (envDraftTooLarge) {
          setEnvDraftTooLarge(false)
        }
      }}
      onCommit={commitEnv}
      onReset={() => {
        onSaveEnv(defaultEnv)
        setEnvDraft(defaultEnvText)
        setEnvDraftTooLarge(false)
      }}
      onEscape={() => {
        setEnvDraft(draftSeed)
        setEnvDraftTooLarge(false)
      }}
      inputClassName={cn(envDraftTooLarge && 'border-destructive/50 bg-destructive/5')}
    />
  )

  if (!envDraftTooLarge) {
    return field
  }

  return (
    <div className="space-y-1">
      {field}
      <p id={envDraftErrorId} className="text-[11px] text-destructive">
        {translate(
          'auto.components.settings.AgentsPane.3f1bdf3cb4',
          'Environment text is too large to parse safely.'
        )}
      </p>
    </div>
  )
}
