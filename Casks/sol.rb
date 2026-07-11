cask "sol" do
  arch arm: "arm64", intel: "x64"

  version "1.3.24"
  sha256 arm:   "fc707f290ff3b631b7b7947bf339885b61a43d2e89475997c125b61268ed4966",
         intel: "5f677c13a08f7a5740442e29d388285a86488c8c1f7aa5f10a8721a2c6ede8e4"

  url "https://github.com/howlabs/sol/releases/download/v#{version}/sol-macos-#{arch}.dmg",
      verified: "github.com/howlabs/sol/"
  name "Sol"
  desc "IDE for orchestrating AI coding agents across terminals and worktrees"
  homepage "https://github.com/howlabs/sol"

  livecheck do
    url :url
    strategy :github_latest
  end

  # Why: electron-updater (src/main/updater.ts) handles in-place updates by
  # writing a new Sol.app into /Applications. Marking the cask auto_updates
  # tells Homebrew not to compete with the in-app updater — `brew upgrade`
  # becomes a no-op unless the user passes --greedy, and brew's version
  # metadata stays aligned with whatever the app has swapped itself to.
  auto_updates true
  conflicts_with cask: "sol@rc"
  depends_on macos: :big_sur

  app "Sol.app"

  # Why: expose the bundled `sol` CLI on PATH at install time (Homebrew symlinks
  # this into its already-on-PATH bin dir). Without it, the CLI is only registered
  # by the in-app "Install CLI" action, which a headless host can never trigger —
  # so `sol serve` on a server would be unreachable from the shell. The shim
  # resolves the real app by walking symlinks, so the Homebrew symlink works.
  binary "#{appdir}/Sol.app/Contents/Resources/bin/sol"

  # Why: Sol writes user data under ~/.sol (worktrees, agent state) and
  # Electron's standard userData directories. Zap removes everything the app
  # creates during normal use so `brew uninstall --zap` is a clean slate.
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
