#!/usr/bin/env node

// Why: previously built the macOS Computer Use native provider. That feature
// was removed; this script remains as a no-op so `build:native` and
// `build:release` still work without updating every call site.
if (process.platform !== 'darwin') {
  console.log(`[native-build] no macOS native build required on ${process.platform}`)
  process.exit(0)
}

console.log('[native-build] no native builds to run')
process.exit(0)
