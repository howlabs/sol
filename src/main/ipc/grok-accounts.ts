import { ipcMain } from 'electron'
import type { GrokAccountService } from '../grok-accounts/service'
import type { GrokDeviceCodeInfo } from '../../shared/types'
import { getGrokAccountStatus } from '../grok-accounts/status'

const GROK_DEVICE_CODE_CHANNEL = 'grokAccounts:deviceCode'

export function registerGrokAccountHandlers(grokAccounts: GrokAccountService): void {
  ipcMain.handle('grokAccounts:getStatus', () =>
    getGrokAccountStatus(grokAccounts.getActiveGrokHomePath() ?? undefined)
  )
  ipcMain.handle('grokAccounts:list', () => grokAccounts.listAccounts())
  ipcMain.handle('grokAccounts:add', async (event) => {
    const onDeviceCode = (info: GrokDeviceCodeInfo) =>
      event.sender.send(GROK_DEVICE_CODE_CHANNEL, info)
    return grokAccounts.addAccount(onDeviceCode)
  })
  ipcMain.handle('grokAccounts:reauthenticate', async (event, args: { accountId: string }) => {
    const onDeviceCode = (info: GrokDeviceCodeInfo) =>
      event.sender.send(GROK_DEVICE_CODE_CHANNEL, info)
    return grokAccounts.reauthenticateAccount(args.accountId, onDeviceCode)
  })
  ipcMain.handle('grokAccounts:remove', (_event, args: { accountId: string }) =>
    grokAccounts.removeAccount(args.accountId)
  )
  ipcMain.handle('grokAccounts:select', (_event, args: { accountId: string | null }) =>
    grokAccounts.selectAccount(args.accountId)
  )
  ipcMain.handle('grokAccounts:cancelPendingLogin', () => grokAccounts.cancelPendingLogin())
}
