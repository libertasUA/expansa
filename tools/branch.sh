#!/usr/bin/env sh
set -e

# Branching from whatever happened to be checked out has cost three pull requests:
# each was merged into a parent that had already been squash-merged, so the content
# never reached main. The mistake is always made at `git checkout -b`, right after
# finishing the previous branch — so this makes the correct path the shorter one.

if [ -z "$1" ]; then
  echo "usage: pnpm branch issue-<number>-<short-description>" >&2
  exit 1
fi

case "$1" in
  issue-*) ;;
  *)
    echo "Branch names are issue-<number>-<short-description> — see CLAUDE.md." >&2
    exit 1
    ;;
esac

git checkout main
git pull --ff-only
git checkout -b "$1"
