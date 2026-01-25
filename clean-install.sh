#!/bin/bash

# ============================================================================
# Ultra Code Fence - Clean Install
# ============================================================================
# Removes old dependencies and reinstalls fresh

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${SCRIPT_DIR}"

echo "Cleaning old dependencies..."
rm -rf node_modules package-lock.json

echo "Installing fresh dependencies..."
npm install

echo "✓ Clean install complete!"
echo
echo "Run ./deploy.sh or ./quick-deploy.sh to build and deploy."
