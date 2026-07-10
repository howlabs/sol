import type { SourceControlAiSettings } from '../../../../shared/source-control-ai-types'
import { SearchableSetting } from './SearchableSetting'
import { SettingsSwitchRow } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'

type HostedReviewDefaultKey = keyof NonNullable<SourceControlAiSettings['prCreationDefaults']>

const KEYWORDS = [
  'hosted review',
  'pull request',
  'merge request',
  'pr',
  'draft',
  'template',
  'generate',
  'open'
]

function getHostedReviewDefaultRows(): {
  key: HostedReviewDefaultKey
  label: string
  description: string
}[] {
  return [
    {
      key: 'draft',
      label: translate(
        'auto.components.settings.CommitMessageAiPane.6ba48f07a4',
        'Draft by default'
      ),
      description: translate(
        'auto.components.settings.CommitMessageAiPane.e001734396',
        'Create hosted reviews as drafts unless changed in the composer.'
      )
    },
    {
      key: 'useTemplate',
      label: translate(
        'auto.components.settings.CommitMessageAiPane.d8b6764d79',
        'Use review template when available'
      ),
      description: translate(
        'auto.components.settings.CommitMessageAiPane.6278c0ce43',
        'Prefer repository pull request templates when no description is set.'
      )
    },
    {
      key: 'generateDetailsOnOpen',
      label: translate(
        'auto.components.settings.CommitMessageAiPane.d5f0de6309',
        'Generate details when opening Create PR'
      ),
      description: translate(
        'auto.components.settings.CommitMessageAiPane.b27b0809f3',
        'Run hosted-review detail generation once when the composer opens.'
      )
    },
    {
      key: 'openAfterCreate',
      label: translate(
        'auto.components.settings.CommitMessageAiPane.7662715213',
        'Open hosted review after creation'
      ),
      description: translate(
        'auto.components.settings.CommitMessageAiPane.b125eabffa',
        'Open the created hosted review in your browser after submit.'
      )
    }
  ]
}

export function HostedReviewCreationDefaults({
  prDefaults,
  onPrDefaultChange
}: {
  prDefaults: NonNullable<SourceControlAiSettings['prCreationDefaults']>
  onPrDefaultChange: (key: HostedReviewDefaultKey, value: boolean) => void
}): React.JSX.Element {
  return (
    <SearchableSetting
      key="pr-creation-defaults"
      title={translate(
        'auto.components.settings.CommitMessageAiPane.2dafc7646e',
        'Hosted-review creation defaults'
      )}
      description={translate(
        'auto.components.settings.CommitMessageAiPane.e9d46a544d',
        'Defaults used when the hosted-review composer opens.'
      )}
      keywords={KEYWORDS}
    >
      {/* Why: form-list only — no nested card around switch rows; SettingsSection
          is already the page surface. */}
      <div className="space-y-1">
        <p className="text-[11px] leading-snug text-muted-foreground">
          {translate(
            'auto.components.settings.CommitMessageAiPane.347094560b',
            'Used by repositories that inherit global hosted-review defaults.'
          )}
        </p>
        {getHostedReviewDefaultRows().map((row) => (
          <SettingsSwitchRow
            key={row.key}
            label={row.label}
            description={row.description}
            ariaLabel={row.label}
            checked={prDefaults[row.key] === true}
            onChange={() => onPrDefaultChange(row.key, prDefaults[row.key] !== true)}
          />
        ))}
      </div>
    </SearchableSetting>
  )
}
