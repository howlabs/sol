import { ipcMain } from 'electron'
import { networkInterfaces } from 'node:os'
import type { RuntimeAccessGrant } from '../../shared/runtime-access-grants'
import { isTailnetIPv4Address } from '../../shared/tailnet-address'
import type { DeviceEntry } from '../runtime/device-registry'
import type { OrcaRuntimeRpcServer } from '../runtime/runtime-rpc'

export type NetworkInterface = {
  name: string
  address: string
}

// Why: the WebSocket transport advertises 0.0.0.0 as its endpoint, which isn't
// connectable from remote clients. Enumerate non-internal IPv4 addresses so the
// user can pick LAN vs Tailscale when generating a runtime pairing URL.
function getNetworkInterfaces(): NetworkInterface[] {
  const result: NetworkInterface[] = []
  const interfaces = networkInterfaces()
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) {
      continue
    }
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        result.push({ name, address: addr.address })
      }
    }
  }
  return result.sort(
    (a, b) => Number(isTailnetIPv4Address(b.address)) - Number(isTailnetIPv4Address(a.address))
  )
}

function getDefaultPairingAddress(): string | null {
  const ifaces = getNetworkInterfaces()
  return ifaces.length > 0 ? ifaces[0]!.address : null
}

function toRuntimeAccessGrant(device: DeviceEntry): RuntimeAccessGrant {
  return {
    deviceId: device.deviceId,
    name: device.name,
    createdAt: device.pairedAt,
    lastSeenAt: device.lastSeenAt > 0 ? device.lastSeenAt : null
  }
}

// Why: runtime pairing (CLI/web) remains a product surface. Phone-companion
// QR/device APIs were removed with the Mobile companion cut.
export function registerRuntimePairingHandlers(rpcServer: OrcaRuntimeRpcServer): void {
  ipcMain.handle(
    'runtimePairing:listNetworkInterfaces',
    (): { interfaces: NetworkInterface[] } => ({
      interfaces: getNetworkInterfaces()
    })
  )

  ipcMain.handle(
    'runtimePairing:getRuntimePairingUrl',
    async (_event, args?: { address?: string; rotate?: boolean }) => {
      const ip = args?.address ?? getDefaultPairingAddress()
      if (!ip) {
        return { available: false as const }
      }

      const offer = rpcServer.createPairingOffer({
        address: ip,
        rotate: args?.rotate,
        name: `Runtime ${new Date().toLocaleDateString()}`,
        scope: 'runtime'
      })
      if (!offer.available) {
        return { available: false as const }
      }

      return {
        available: true as const,
        pairingUrl: offer.pairingUrl,
        webClientUrl: offer.webClientUrl,
        endpoint: offer.endpoint,
        deviceId: offer.deviceId
      }
    }
  )

  ipcMain.handle('runtimePairing:listRuntimeAccessGrants', () => {
    const registry = rpcServer.getDeviceRegistry()
    if (!registry) {
      return { grants: [] }
    }
    // Why: generated web/runtime links are bearer credentials even before a
    // client first connects, so pending runtime grants must stay revocable.
    return {
      grants: registry
        .listDevices()
        .filter((d) => d.scope === 'runtime')
        .sort((a, b) => b.pairedAt - a.pairedAt)
        .map(toRuntimeAccessGrant)
    }
  })

  ipcMain.handle('runtimePairing:revokeRuntimeAccess', (_event, args: { deviceId: string }) => {
    const registry = rpcServer.getDeviceRegistry()
    if (!registry) {
      return { revoked: false }
    }
    return { revoked: rpcServer.revokeRuntimeAccess(args.deviceId) }
  })

  ipcMain.handle('runtimePairing:isWebSocketReady', () => {
    return {
      ready: rpcServer.getWebSocketEndpoint() !== null,
      endpoint: rpcServer.getWebSocketEndpoint()
    }
  })
}
