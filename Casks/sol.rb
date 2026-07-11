cask "sol" do
  arch arm: "arm64", intel: "x64"

  version "0.1.1"
  sha256 arm:   "0000000000000000000000000000000000000000000000000000000000000000",
         intel: "0000000000000000000000000000000000000000000000000000000000000000"

  url "https://github.com/howlabs/sol/releases/download/v#{version}/sol-macos-#{arch}.dmg",
      verified: "github.com/howlabs/sol/"
  name "Sol"
  desc "Minimal IDE for AI agent development across terminals and worktrees"
  homepage "https://github.com/howlabs/sol"

  livecheck do
    url :url
    strategy :github_latest
  end

  # Why: electron-updater handles in-place updates. auto_updates keeps brew
  # from competing with the in-app updater unless the user passes --greedy.
  auto_updates true
  conflicts_with cask: "sol@rc"
  depends_on macos: :big_sur

  app "Sol.app"

  # Why: expose the bundled CLI on PATH at install time (Homebrew bin symlink).
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
