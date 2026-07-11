const { chmodSync, existsSync, readdirSync } = require('node:fs')
const { join, resolve } = require('node:path')
const electronBuilderNativeRebuild = require('./scripts/electron-builder-native-rebuild.cjs')
const { verifyPackagedDaemonEntryBoots } = require('./scripts/verify-packaged-daemon-entry.cjs')
const {
  createPackagedRuntimeNodeModuleResources,
  prunePackagedRuntimeNodeModules,
  verifyPackagedMainRuntimeDeps
} = require('./packaged-runtime-node-modules.cjs')

const isMacRelease = process.env.ORCA_MAC_RELEASE === '1'
const isLinuxArm64Release = process.env.ORCA_LINUX_ARM64_RELEASE === '1'
// Why: SSH relay deploy resolves bundles from process.resourcesPath in packaged
// apps. Keeping relay assets as extraResources makes them real directories
// instead of paths hidden inside app.asar.
const relayExtraResource = {
  from: 'out/relay',
  to: 'relay'
}
// Why: the main bundle, packaged CLI, and SSH paths all execute from package
// directories where pnpm's symlink farm is absent. Copy the exact runtime
// dependency closure to Resources/node_modules so bare require() calls do not
// fall through to a developer checkout's node_modules.
const packagedRuntimeNodeModuleResources = createPackagedRuntimeNodeModuleResources()

const commonExtraResources = [relayExtraResource, ...packagedRuntimeNodeModuleResources]

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.howlabs.sol',
  productName: 'Sol',
  directories: {
    buildResources: 'resources/build'
  },
  files: [
    '!**/.vscode/*',
    // Why: these repo-only inputs are either bundled into out/ or copied via
    // extraResources. Shipping them in app.asar bloats the desktop bundle.
    '!src{,/**/*}',
    '!config{,/**/*}',
    '!docs{,/**/*}',
    '!mobile{,/**/*}',
    '!native{,/**/*}',
    '!skills{,/**/*}',
    '!tests{,/**/*}',
    '!Casks{,/**/*}',
    '!{AGENTS.md,CLAUDE.md,DEVELOPING.md,bundle-size-progress.md}',
    '!out/**/*.test.js',
    '!electron.vite.config.{js,ts,mjs,cjs}',
    '!{.eslintcache,eslint.config.mjs,.prettierignore,.prettierrc.yaml,CHANGELOG.md,README.md}',
    '!{.env,.env.*,.npmrc,pnpm-lock.yaml}',
    '!tsconfig.json'
  ],
  // Why: the CLI entry-point lives in out/cli/ but imports shared modules
  // from out/shared/ and local hook mutators from out/main/. These paths must be
  // unpacked so that Node's require() can resolve the cross-directory imports
  // when the CLI runs outside the asar archive.
  // Why: daemon-entry.js is forked as a separate Node.js process and must be
  // accessible on disk (not inside the asar archive) for child_process.fork().
  // Why: the CLI is compiled by tsc (not bundled), so its runtime imports
  // resolve at runtime via Node's normal module lookup. The shim launches
  // the CLI with ELECTRON_RUN_AS_NODE, which bypasses Electron's asar
  // integration — dependencies inside the asar archive are invisible to
  // require(). Unpack CLI runtime deps so they resolve from
  // app.asar.unpacked/node_modules/.
  // Why: remote runtime connections use WebSocket + E2EE from the packaged CLI
  // before the GUI process starts, so those deps need the same treatment.
  // Why: out/package.json pins compiled output to CommonJS so parent
  // package.json files with type=module cannot change the packaged CLI loader.
  asarUnpack: [
    'out/package.json',
    'out/cli/**',
    'out/shared/**',
    'out/main/agent-hooks/**',
    'out/main/antigravity/**',
    'out/main/claude/**',
    'out/main/codex/**',
    'out/main/copilot/**',
    'out/main/cursor/**',
    'out/main/droid/**',
    'out/main/gemini/**',
    'out/main/grok/**',
    'out/main/hermes/**',
    'out/main/win32-utils.js',
    'out/main/daemon-entry.js',
    'out/main/parcel-watcher-process-entry.js',
    'out/main/chunks/**',
    'resources/**',
    'node_modules/ws/**',
    'node_modules/tweetnacl/**',
    'node_modules/zod/**',
    'node_modules/yaml/**'
  ],
  afterPack: async (context) => {
    const resourcesDir =
      context.electronPlatformName === 'darwin'
        ? join(
            context.appOutDir,
            `${context.packager.appInfo.productFilename}.app`,
            'Contents',
            'Resources'
          )
        : join(context.appOutDir, 'resources')
    if (!existsSync(resourcesDir)) {
      return
    }
    prunePackagedRuntimeNodeModules(resourcesDir, context.electronPlatformName, context.arch)
    verifyPackagedMainRuntimeDeps(resourcesDir)
    // Why: boot the packaged daemon-entry under plain Node, but only for the
    // slice matching the packaging host's arch — daemon-entry.js is JS, yet it
    // require()s the native (N-API) node-pty for the TARGET arch, which the host
    // Node cannot load cross-arch. `Arch` enum: ia32=0, x64=1, armv7l=2,
    // arm64=3, universal=4 (universal contains the host slice, so run it).
    const archEnumByNodeArch = { ia32: 0, x64: 1, armv7l: 2, arm64: 3 }
    const hostArchEnum = archEnumByNodeArch[process.arch]
    if (context.arch === hostArchEnum || context.arch === 4) {
      verifyPackagedDaemonEntryBoots(resourcesDir)
    } else {
      console.log(
        `[verify-packaged-daemon-entry] skipped cross-arch slice (target ${context.arch}, host ${process.arch})`
      )
    }
    chmodUnixCliLaunchers(resourcesDir, context.electronPlatformName)
    for (const filename of readdirSync(resourcesDir)) {
      if (!filename.startsWith('agent-browser-')) {
        continue
      }
      // Why: the upstream package has inconsistent executable bits across
      // platform binaries (notably darwin-x64). child_process.execFile needs
      // the copied binary to be executable in packaged apps.
      chmodSync(join(resourcesDir, filename), 0o755)
    }
  },
  win: {
    executableName: 'Sol',
    // Why: Windows installers are signed after electron-builder packaging by
    // SignPath, so the packager cannot infer the updater publisherName.
    signtoolOptions: {
      publisherName: 'SignPath Foundation'
    },
    extraResources: [
      ...commonExtraResources,
      {
        from: 'resources/win32/bin/sol.cmd',
        to: 'bin/sol.cmd'
      },
      {
        from: 'node_modules/agent-browser/bin/agent-browser-win32-x64.exe',
        to: 'agent-browser-win32-x64.exe'
      }
    ]
  },
  nsis: {
    artifactName: 'sol-windows-setup.${ext}',
    shortcutName: '${productName}',
    uninstallDisplayName: '${productName}',
    createDesktopShortcut: 'always',
    // Why: on a real uninstall, stop and remove the relocated terminal daemon
    // (which lives outside the install dir under LOCALAPPDATA by design). Guarded
    // by ${isUpdated} inside so it never runs during an update's uninstallOldVersion.
    include: resolve(__dirname, 'nsis', 'daemon-host-uninstall.nsh')
  },
  mac: {
    icon: 'resources/build/icon.icns',
    entitlements: 'resources/build/entitlements.mac.plist',
    entitlementsInherit: 'resources/build/entitlements.mac.plist',
    extendInfo: {
      NSAppleEventsUsageDescription:
        'Sol allows terminal-launched developer tools to automate local apps when you request it.',
      NSBluetoothAlwaysUsageDescription:
        'Sol allows terminal-launched developer tools to access Bluetooth devices when you request it.',
      NSBluetoothPeripheralUsageDescription:
        'Sol allows terminal-launched developer tools to access Bluetooth devices when you request it.',
      NSCameraUsageDescription: "Application requests access to the device's camera.",
      NSLocationUsageDescription:
        'Sol allows terminal-launched developer tools to access location when you request it.',
      NSLocalNetworkUsageDescription:
        'Sol allows terminal-launched developer tools to discover and connect to local development servers when you request it.',
      NSMicrophoneUsageDescription: "Application requests access to the device's microphone.",
      NSAudioCaptureUsageDescription:
        'Sol allows terminal-launched developer tools to capture desktop audio when you request it.',
      NSBonjourServices: ['_http._tcp', '_https._tcp'],
      NSDocumentsFolderUsageDescription:
        "Application requests access to the user's Documents folder.",
      NSDownloadsFolderUsageDescription:
        "Application requests access to the user's Downloads folder."
    },
    // Why: local macOS validation builds should launch without Apple release
    // credentials. Hardened runtime + notarization stay enabled only on the
    // explicit release path so production artifacts remain strict while dev
    // artifacts do not fail with broken ad-hoc launch behavior.
    hardenedRuntime: isMacRelease,
    notarize: isMacRelease,
    extraResources: [
      ...commonExtraResources,
      {
        from: 'resources/darwin/bin/sol',
        to: 'bin/sol'
      },
      {
        from: 'node_modules/agent-browser/bin/agent-browser-darwin-${arch}',
        to: 'agent-browser-darwin-${arch}'
      }
    ],
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ]
  },
  // Why: release builds should fail if signing is unavailable instead of
  // silently downgrading to ad-hoc artifacts that look shippable in CI logs.
  forceCodeSigning: isMacRelease,
  dmg: {
    artifactName: 'sol-macos-${arch}.${ext}'
  },
  linux: {
    // Why: Ubuntu desktop ships GNOME Orca as the `orca` package and /usr/bin/orca.
    // The Linux installer should not claim those system package/file names.
    executableName: 'sol',
    // Why: the icns source lets electron-builder emit standard hicolor PNG
    // sizes; a single 1024px PNG is ignored by some Linux docks/launchers.
    icon: 'resources/build/icon.icns',
    desktop: {
      entry: {
        // Why: Electron reports WM_CLASS=orca for the visible Linux window;
        // GNOME docks need an exact match to group it with orca-ide.desktop.
        StartupWMClass: 'sol'
      }
    },
    extraResources: [
      ...commonExtraResources,
      {
        from: 'resources/linux/bin/sol',
        to: 'bin/sol'
      },
      {
        from: 'node_modules/agent-browser/bin/agent-browser-linux-${arch}',
        to: 'agent-browser-linux-${arch}'
      }
    ],
    target: ['AppImage', 'deb'],
    maintainer: 'howlabs',
    category: 'Utility'
  },
  appImage: {
    artifactName: isLinuxArm64Release ? 'sol-linux-arm64.${ext}' : 'sol-linux.${ext}'
  },
  deb: {
    packageName: 'sol',
    artifactName: 'sol_${version}_${arch}.${ext}',
    // Why: xvfb lets the bundled `orca serve` CLI run browser panes on a headless
    // Linux host — Chromium needs a display server even for offscreen rendering,
    // and serve starts Xvfb itself when present (see ensure-virtual-display.ts).
    depends: [
      'python3',
      'python3-gi',
      'gir1.2-atspi-2.0',
      'at-spi2-core',
      'xdotool',
      'xclip',
      'xvfb'
    ],
    // Why: symlink the bundled CLI onto PATH at install time so `orca-ide serve`
    // works on a headless host. The in-app CLI registration (CliInstaller) is
    // GUI-triggered and can never run on a server, so without this the CLI is
    // unreachable from the shell on exactly the hosts that need it.
    afterInstall: 'resources/linux/packaging/after-install.sh',
    afterRemove: 'resources/linux/packaging/after-remove.sh'
  },
  rpm: {
    packageName: 'sol',
    artifactName: 'sol-${version}.${arch}.${ext}',
    // Why: see deb depends. RPM distros ship Xvfb as xorg-x11-server-Xvfb (there
    // is no `xvfb` package), so the name differs from the deb here.
    depends: [
      'python3',
      'python3-gobject',
      'at-spi2-core',
      'xdotool',
      'xclip',
      'xorg-x11-server-Xvfb'
    ],
    // Why: same headless CLI-on-PATH registration as deb; rpm runs these via fpm.
    afterInstall: 'resources/linux/packaging/after-install.sh',
    afterRemove: 'resources/linux/packaging/after-remove.sh'
  },
  beforeBuild: electronBuilderNativeRebuild,
  // Why: must be true so that electron-builder rebuilds native modules
  // (node-pty) for each target architecture when producing dual-arch macOS
  // builds (x64 + arm64). With npmRebuild disabled, CI on an arm64 runner
  // packages arm64 binaries into the x64 DMG, causing "posix_spawnp failed"
  // on Intel Macs. The beforeBuild hook performs Orca's targeted rebuild and
  // returns false so electron-builder does not rebuild optional cpu-features.
  npmRebuild: true,
  publish: {
    provider: 'github',
    owner: 'howlabs',
    repo: 'sol',
    releaseType: 'release'
  }
}

function chmodUnixCliLaunchers(resourcesDir, electronPlatformName) {
  if (electronPlatformName === 'win32') {
    return
  }
  for (const launcherName of ['sol', 'orca-ide']) {
    const launcherPath = join(resourcesDir, 'bin', launcherName)
    if (!existsSync(launcherPath)) {
      continue
    }
    // Why: packaged Unix installs expose these extraResources as public shell
    // commands, and source/packager mode drift must not ship a non-executable CLI.
    chmodSync(launcherPath, 0o755)
  }
}


