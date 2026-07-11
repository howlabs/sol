#!/bin/bash
# Why: remove the PATH symlink that after-install.sh created, but only if it
# still points into a Sol install dir — never delete an unrelated
# /usr/bin/sol a user or other package may own.
set -e

link="/usr/bin/sol"

if [ -L "$link" ]; then
  target="$(readlink "$link" || true)"
  case "$target" in
    /opt/Sol/*|/opt/sol/*)
      rm -f "$link"
      ;;
  esac
fi

exit 0
