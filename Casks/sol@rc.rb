cask "sol@rc" do
  arch arm: "arm64", intel: "x64"

  version "0.1.1"
  sha256 arm:   "0000000000000000000000000000000000000000000000000000000000000000",
         intel: "0000000000000000000000000000000000000000000000000000000000000000"

  url "https://github.com/howlabs/sol/releases/download/v#{version}/sol-macos-#{arch}.dmg",
      verified: "github.com/howlabs/sol/"
  name "Sol (RC)"
  desc "Release-candidate build of Sol, the minimal IDE for AI agent development"
  homepage "https://github.com/howlabs/sol"

  livecheck do
    url "https://github.com/howlabs/sol/releases"
    regex(/v?(\d+(?:\.\d+)+(?:-rc\.\d+)?)/i)
  end

  auto_updates true
  conflicts_with cask: "sol"
  depends_on macos: :big_sur

  app "Sol.app"

  binary "#{appdir}/Sol.app/Contents/Resources/bin/sol"

  zap trash: [
    "~/.sol",
    "~/Library/Application Support/Sol",
    "~/Library/Caches/com.howlabs.sol",
    "~/Library/Caches/com.howlabs.sol.ShipIt",
    "~/Library/HTTPStorages/com.howlabs.sol",
    "~/Library/Preferences/com.howlabs.sol.plist",
    "~/Library/Saved Application State/com.howlabs.sol.savedState",
  ]
end
