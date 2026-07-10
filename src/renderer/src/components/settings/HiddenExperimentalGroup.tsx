import { translate } from '@/i18n/i18n'
import { SettingsSwitchRow } from './SettingsFormControls'

// Why: anything in this group is deliberately unfinished or staff-only. The
// orange treatment (header tint, label colors) is the shared visual signal
// for hidden-experimental items so future entries inherit the same
// affordance without another round of styling decisions.
export function HiddenExperimentalGroup(): React.JSX.Element {
  return (
    <section className="mt-3 space-y-1 rounded-lg border border-orange-500/40 bg-orange-500/5 p-3">
      <div className="space-y-0.5 pb-1">
        <h4 className="text-xs font-semibold text-orange-500 dark:text-orange-300">
          {translate(
            'auto.components.settings.HiddenExperimentalGroup.3e9e827ca5',
            'Hidden experimental'
          )}
        </h4>
        <p className="text-[11px] leading-snug text-orange-500/80 dark:text-orange-300/80">
          {translate(
            'auto.components.settings.HiddenExperimentalGroup.232cf83de8',
            'Unlisted toggles for internal testing. Nothing here is supported.'
          )}
        </p>
      </div>

      <div className="rounded-md border border-orange-500/30 bg-orange-500/10 px-3">
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.HiddenExperimentalGroup.d0f914a528',
            'Placeholder toggle'
          )}
          description={translate(
            'auto.components.settings.HiddenExperimentalGroup.1014ddbfaf',
            'Does nothing today. Reserved as the first slot for hidden experimental options.'
          )}
          checked={false}
          disabled
          ariaLabel={translate(
            'auto.components.settings.HiddenExperimentalGroup.d0f914a528',
            'Placeholder toggle'
          )}
          onChange={() => undefined}
        />
      </div>
    </section>
  )
}
