#!/usr/bin/env bash
# loadbearing installer.
#   ./install.sh check                 -> validate the pack (files present, JSON valid, hook tests pass)
#   ./install.sh <project-dir>         -> install loadbearing into a project's .claude/ (Claude Code, project-level)
#
# The recommended way to use loadbearing in Claude Code is as a plugin (see README).
# This script is the no-marketplace fallback and the clean-clone self-check.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"

# Validate a JSON file. Pass the path as argv (portable: works on Linux/macOS and
# Git Bash on Windows, where argv paths are auto-converted but in-string paths are not).
valid_json() { node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$1" 2>/dev/null; }

check() {
  local ok=1
  for f in .claude-plugin/plugin.json hooks/hooks.json hooks/perf-scan.js hooks/detectors.js rules/performance.md; do
    if [ -f "$HERE/$f" ]; then echo "  ok   $f"; else echo "  MISS $f"; ok=0; fi
  done
  if valid_json "$HERE/.claude-plugin/plugin.json"; then echo "  ok   plugin.json is valid JSON"; else echo "  FAIL plugin.json invalid"; ok=0; fi
  if valid_json "$HERE/hooks/hooks.json"; then echo "  ok   hooks.json is valid JSON"; else echo "  FAIL hooks.json invalid"; ok=0; fi
  if node "$HERE/hooks/test/run-tests.js" >/dev/null 2>&1; then echo "  ok   hook detector tests pass"; else echo "  FAIL hook tests"; ok=0; fi
  echo ""
  if [ "$ok" = 1 ]; then echo "loadbearing: pack is healthy on this clone."; return 0; else echo "loadbearing: pack has problems (see above)."; return 1; fi
}

install_into() {
  local target="$1"
  [ -d "$target" ] || { echo "target dir not found: $target"; exit 1; }
  local cdir="$target/.claude"
  mkdir -p "$cdir/skills" "$cdir/commands" "$cdir/agents" "$cdir/loadbearing"
  cp -R "$HERE/skills/." "$cdir/skills/"
  cp -R "$HERE/commands/." "$cdir/commands/"
  cp -R "$HERE/agents/." "$cdir/agents/"
  cp -R "$HERE/rules" "$HERE/hooks" "$cdir/loadbearing/"
  echo "loadbearing content copied into $cdir"
  echo ""
  echo "Last step (safe, manual): add the write-time hook to $cdir/settings.json :"
  echo ""
  echo '  "hooks": { "PostToolUse": [ { "matcher": "Write|Edit|MultiEdit",'
  echo '    "hooks": [ { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/loadbearing/hooks/perf-scan.js\"" } ] } ] }'
  echo ""
  echo "Then restart Claude Code. Skills, commands, and the perf-reviewer agent load automatically."
}

case "${1:-}" in
  check) check ;;
  "") echo "usage: ./install.sh check   |   ./install.sh <project-dir>"; exit 1 ;;
  *) install_into "$1" ;;
esac
