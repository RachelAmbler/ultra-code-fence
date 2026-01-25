#!/bin/bash

# ============================================================================
# Ultra Code Fence - Quick Rebuild & Deploy (no version bump)
# ============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load configuration
if [ ! -f "${SCRIPT_DIR}/local.env" ]; then
    echo "Error: local.env not found. Run: cp local.env.example local.env"
    exit 1
fi

source "${SCRIPT_DIR}/local.env"

if [ -z "$VAULT_PATH" ]; then
    echo "Error: VAULT_PATH not set in local.env"
    exit 1
fi

PLUGIN_NAME="ultra-code-fence"
PLUGIN_DIR="${VAULT_PATH}/.obsidian/plugins/${PLUGIN_NAME}"

cd "${SCRIPT_DIR}"

echo "Building..."
npm run build

echo "Deploying..."
mkdir -p "${PLUGIN_DIR}"
cp main.js manifest.json "${PLUGIN_DIR}/"
cp src/styles.css "${PLUGIN_DIR}/"

VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "✓ Deployed v${VERSION} to vault. Reload Obsidian (Cmd+R) to pick up changes."
