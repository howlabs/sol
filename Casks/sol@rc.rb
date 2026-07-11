cask "sol@rc" do
  arch arm: "arm64", intel: "x64"

  version "1.4.36-rc.3"
  sha256 arm:   "563b6b14323fc9d5489299c82442d514bc12cabffc9d06d3964ed572af4b3955",
         intel: "457088c7021f07de1a419197f7b2bd00092741ad4727d4fef3d86af38a6831e7"

  url "https://github.com/howlabs/sol/releases/download/v#{version}/sol-macos-#{arch}.dmg",
      verified: "github.com/howlabs/sol/"
  name "Sol RC"
  desc "IDE for orchestrating AI coding agents across terminals and worktrees"
  homepage "https://github.com/howlabs/sol"

  livecheck do
    url "https://github.com/howlabs/sol"
    regex(/^v?(\d+(?:\.\d+)+-rc\.\d+)$/i)
    strategy :github_releases do |json, regex|
      json.map do |release|
        next if release["draft"]
        next unless release["prerelease"]

        match = release["tag_name"]&.match(regex)
        next if match.blank?

        match[1]
      end
    end
  end

  # Why: RC installs should follow Sol's prerelease-aware updater instead of
  # waiting for Homebrew metadata churn between frequent release candidates.
  auto_updates true
  conflicts_with cask: "sol"
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
