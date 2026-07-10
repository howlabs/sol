import { useEffect, useRef, useState } from 'react'
import type { GlobalSettings } from '../../../../shared/types'
import { Button } from '../ui/button'
import { BellRing } from '@/lib/icons'
import { useAppStore } from '@/store'
import { NotificationSoundSection } from './NotificationSoundSection'
import {
  createNotificationVolumeDraftState,
  resolveNotificationVolumeDraftState,
  sendNotificationSettingsTestNotification
} from './notification-settings-copy'
import { SearchableSetting } from './SearchableSetting'
import { SettingsRow, SettingsSwitchRow } from './SettingsFormControls'
import { getNotificationsPaneSearchEntries } from './notifications-search'
import { translate } from '@/i18n/i18n'
export { getNotificationsPaneSearchEntries } from './notifications-search'
export {
  createNotificationVolumeDraftState,
  resolveNotificationVolumeDraftState,
  sendNotificationSettingsTestNotification
} from './notification-settings-copy'

type NotificationsPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void | Promise<void>
}

export function NotificationsPane({
  settings,
  updateSettings
}: NotificationsPaneProps): React.JSX.Element {
  const notificationSettings = settings.notifications
  const notificationSettingsRef = useRef(notificationSettings)
  const searchEntries = getNotificationsPaneSearchEntries()
  const byTitle = (title: string) =>
    searchEntries.find((entry) => entry.title === title) ?? {
      title,
      description: '',
      keywords: [] as string[]
    }
  const enableSearch = byTitle('Enable Notifications')
  const agentCompleteSearch = byTitle('Agent Task Complete')
  const terminalBellSearch = byTitle('Terminal Bell')
  const suppressSearch = byTitle('Suppress While Focused')
  const testSearch = byTitle('Send Test Notification')

  const updateNotificationSettings = async (
    updates: Partial<GlobalSettings['notifications']>
  ): Promise<void> => {
    const nextNotifications = {
      ...notificationSettingsRef.current,
      ...updates
    }
    notificationSettingsRef.current = nextNotifications
    await updateSettings({
      notifications: {
        ...nextNotifications
      }
    })
  }

  useEffect(() => {
    notificationSettingsRef.current = notificationSettings
  }, [notificationSettings])

  const [volumeDraftState, setVolumeDraftState] = useState(() =>
    createNotificationVolumeDraftState(notificationSettings.customSoundVolume)
  )
  const resolvedVolumeDraftState = resolveNotificationVolumeDraftState(
    volumeDraftState,
    notificationSettings.customSoundVolume
  )
  if (resolvedVolumeDraftState !== volumeDraftState) {
    setVolumeDraftState(resolvedVolumeDraftState)
  }
  const volumeDraft = resolvedVolumeDraftState.draft
  const setVolumeDraft = (value: number): void => {
    setVolumeDraftState((current) => ({
      ...resolveNotificationVolumeDraftState(current, notificationSettings.customSoundVolume),
      draft: value
    }))
  }

  const handleVolumeCommit = (value: number): void => {
    if (notificationSettingsRef.current.customSoundVolume !== value) {
      void updateNotificationSettings({ customSoundVolume: value })
    }
  }

  const handleSendTestNotification = async (): Promise<void> => {
    useAppStore.getState().recordFeatureInteraction('notifications')
    await sendNotificationSettingsTestNotification(notificationSettings, volumeDraft)
  }

  return (
    <div className="space-y-1">
      <SearchableSetting
        title={enableSearch.title}
        description={enableSearch.description}
        keywords={enableSearch.keywords}
      >
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.NotificationsPane.841c8c549f',
            'Enable Notifications'
          )}
          description={translate(
            'auto.components.settings.NotificationsPane.deff6d30da',
            'Native system notifications for background events.'
          )}
          checked={notificationSettings.enabled}
          onChange={() => {
            if (!notificationSettings.enabled) {
              useAppStore.getState().recordFeatureInteraction('notifications')
            }
            void updateNotificationSettings({ enabled: !notificationSettings.enabled })
          }}
        />
      </SearchableSetting>

      <SearchableSetting
        title={agentCompleteSearch.title}
        description={agentCompleteSearch.description}
        keywords={agentCompleteSearch.keywords}
      >
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.NotificationsPane.ca76d06fd2',
            'Agent Task Complete'
          )}
          description={translate(
            'auto.components.settings.NotificationsPane.55f901a59b',
            'A coding agent finishes and becomes idle.'
          )}
          checked={notificationSettings.agentTaskComplete}
          disabled={!notificationSettings.enabled}
          onChange={() =>
            void updateNotificationSettings({
              agentTaskComplete: !notificationSettings.agentTaskComplete
            })
          }
        />
      </SearchableSetting>

      <SearchableSetting
        title={terminalBellSearch.title}
        description={terminalBellSearch.description}
        keywords={terminalBellSearch.keywords}
      >
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.NotificationsPane.591fe605b9',
            'Terminal Bell'
          )}
          description={translate(
            'auto.components.settings.NotificationsPane.b6fc369244',
            'A background terminal emits a bell character.'
          )}
          checked={notificationSettings.terminalBell}
          disabled={!notificationSettings.enabled}
          onChange={() =>
            void updateNotificationSettings({
              terminalBell: !notificationSettings.terminalBell
            })
          }
        />
      </SearchableSetting>

      <NotificationSoundSection
        notificationSettings={notificationSettings}
        notificationsEnabled={notificationSettings.enabled}
        volumeDraft={volumeDraft}
        onVolumeDraftChange={setVolumeDraft}
        onVolumeCommit={handleVolumeCommit}
        onUpdateNotificationSettings={updateNotificationSettings}
      />

      <SearchableSetting
        title={suppressSearch.title}
        description={suppressSearch.description}
        keywords={suppressSearch.keywords}
      >
        <SettingsSwitchRow
          label={translate(
            'auto.components.settings.NotificationsPane.00cd406dbb',
            'Suppress While Focused'
          )}
          description={translate(
            'auto.components.settings.NotificationsPane.2772d2f257',
            'Skip notifications when the triggering worktree is already visible.'
          )}
          checked={notificationSettings.suppressWhenFocused}
          disabled={!notificationSettings.enabled}
          onChange={() =>
            void updateNotificationSettings({
              suppressWhenFocused: !notificationSettings.suppressWhenFocused
            })
          }
        />
      </SearchableSetting>

      <SearchableSetting
        title={testSearch.title}
        description={testSearch.description}
        keywords={testSearch.keywords}
      >
        <SettingsRow
          label={translate(
            'auto.components.settings.NotificationsPane.906b4afebf',
            'Send Test Notification'
          )}
          description={translate(
            'auto.components.settings.NotificationsPane.testDescription',
            'Preview the current sound and system notification delivery.'
          )}
          control={
            <Button
              variant="outline"
              size="sm"
              disabled={!notificationSettings.enabled}
              onClick={() => void handleSendTestNotification()}
              className="gap-1.5"
            >
              <BellRing className="size-3.5" />
              {translate('auto.components.settings.NotificationsPane.testAction', 'Send test')}
            </Button>
          }
        />
      </SearchableSetting>
    </div>
  )
}
