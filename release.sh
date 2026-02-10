#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Ultra Code Fence — Release Script
# ──────────────────────────────────────────────
# Usage:  ./release.sh
#
# Reads the current version from package.json,
# tags it, and pushes to trigger the release
# workflow on GitHub.
#
# Version bumping is handled by deploy.sh — run
# that first if you need a new version number.
# ──────────────────────────────────────────────

# Ensure we're on main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "Error: Must be on main branch (currently on '$BRANCH')"
    exit 1
fi

# Ensure working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: Working tree has uncommitted changes. Commit or stash them first."
    exit 1
fi

# Read version from package.json
VERSION=$(node -e "console.log(require('./package.json').version)")

# Check tag doesn't exist locally
if git tag -l "$VERSION" | grep -q .; then
    echo "Error: Tag ${VERSION} already exists locally."
    exit 1
fi

# Check tag doesn't exist on remote
if git ls-remote --tags origin "refs/tags/${VERSION}" | grep -q .; then
    echo "Error: Tag ${VERSION} already exists on remote."
    exit 1
fi

echo "Releasing Ultra Code Fence v${VERSION}"
echo "──────────────────────────────────────"

echo "→ Pushing latest commits..."
git push origin main

echo "→ Creating tag ${VERSION}..."
git tag "$VERSION"

echo "→ Pushing tag..."
git push origin "$VERSION"

echo "──────────────────────────────────────"
echo "Done! Release workflow will publish at:"
echo "https://github.com/RachelAmbler/ultra-code-fence/releases"
