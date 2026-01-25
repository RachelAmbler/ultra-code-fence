#!/bin/bash

# ============================================================================
# Ultra Code Fence - Build & Deploy Script
# ============================================================================
#
# Version scheme: YEAR.MONTH.BUILD
#   - YEAR:  Current year (auto-set)
#   - MONTH: Current month (auto-set)
#   - BUILD: Auto-increments on every deploy (resets on year/month change)
#
# ============================================================================

set -e  # Exit on any error

# Get script directory (where the source files are)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

# ----------------------------------------------------------------------------
# Load Configuration from local.env
# ----------------------------------------------------------------------------

if [ ! -f "${SCRIPT_DIR}/local.env" ]; then
    echo -e "${RED}Error: local.env not found${NC}"
    echo
    echo "Please create local.env from the template:"
    echo "  cp local.env.example local.env"
    echo "  # Then edit local.env with your vault path"
    exit 1
fi

source "${SCRIPT_DIR}/local.env"

if [ -z "$VAULT_PATH" ]; then
    echo -e "${RED}Error: VAULT_PATH not set in local.env${NC}"
    exit 1
fi

if [ ! -d "$VAULT_PATH" ]; then
    echo -e "${RED}Error: Vault path does not exist: ${VAULT_PATH}${NC}"
    exit 1
fi

# Configuration
PLUGIN_NAME="ultra-code-fence"
PLUGIN_DIR="${VAULT_PATH}/.obsidian/plugins/${PLUGIN_NAME}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Ultra Code Fence - Build & Deploy${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# ----------------------------------------------------------------------------
# Step 1: Version Management
# ----------------------------------------------------------------------------

# Get current date components
CURRENT_YEAR=$(date +%Y)
CURRENT_MONTH=$(date +%-m)  # No leading zero

# Read current version from manifest.json
CURRENT_VERSION=$(grep '"version"' "${SCRIPT_DIR}/manifest.json" | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo -e "${YELLOW}Current version:${NC} ${CURRENT_VERSION}"

# Parse version components (YEAR.MONTH.BUILD)
IFS='.' read -r OLD_YEAR OLD_MONTH OLD_BUILD <<< "$CURRENT_VERSION"

# Default BUILD to 0 if not present
if [ -z "$OLD_BUILD" ]; then
    OLD_BUILD=0
fi

# Check if year/month has changed - if so, reset build number
if [ "$CURRENT_YEAR" != "$OLD_YEAR" ] || [ "$CURRENT_MONTH" != "$OLD_MONTH" ]; then
    echo -e "${YELLOW}New month detected - resetting build number${NC}"
    NEW_BUILD=1
else
    NEW_BUILD=$((OLD_BUILD + 1))
fi

# Construct new version
NEW_VERSION="${CURRENT_YEAR}.${CURRENT_MONTH}.${NEW_BUILD}"

echo -e "${GREEN}New version:${NC} ${NEW_VERSION}"

# Update version files
echo -e "${YELLOW}Updating version files...${NC}"

# Update manifest.json
sed -i '' "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" "${SCRIPT_DIR}/manifest.json"

# Update package.json
sed -i '' "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" "${SCRIPT_DIR}/package.json"

# Update versions.json - replace entire content with just current version
MIN_APP_VERSION=$(grep '"minAppVersion"' "${SCRIPT_DIR}/manifest.json" | sed 's/.*"minAppVersion": "\([^"]*\)".*/\1/')
cat > "${SCRIPT_DIR}/versions.json" << VERSIONS_EOF
{
	"${NEW_VERSION}": "${MIN_APP_VERSION}"
}
VERSIONS_EOF

echo -e "${GREEN}✓ Version files updated${NC}"
echo

# ----------------------------------------------------------------------------
# Step 2: Install Dependencies (if needed)
# ----------------------------------------------------------------------------

cd "${SCRIPT_DIR}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

echo

# ----------------------------------------------------------------------------
# Step 3: Build the Plugin
# ----------------------------------------------------------------------------

echo -e "${YELLOW}Building plugin...${NC}"
npm run build

if [ -f "${SCRIPT_DIR}/main.js" ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed - main.js not found${NC}"
    exit 1
fi

echo

# ----------------------------------------------------------------------------
# Step 4: Deploy to Vault
# ----------------------------------------------------------------------------

echo -e "${YELLOW}Deploying to vault...${NC}"
echo -e "  Target: ${PLUGIN_DIR}"

# Create plugin directory if it doesn't exist
mkdir -p "${PLUGIN_DIR}"

# Copy required files
cp "${SCRIPT_DIR}/main.js" "${PLUGIN_DIR}/"
cp "${SCRIPT_DIR}/manifest.json" "${PLUGIN_DIR}/"
cp "${SCRIPT_DIR}/src/styles.css" "${PLUGIN_DIR}/"

echo -e "${GREEN}✓ Files copied:${NC}"
echo "    - main.js"
echo "    - manifest.json"
echo "    - styles.css"

echo

# ----------------------------------------------------------------------------
# Done!
# ----------------------------------------------------------------------------

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Deployment complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo
echo -e "Plugin ${GREEN}v${NEW_VERSION}${NC} deployed to:"
echo -e "  ${PLUGIN_DIR}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Open Obsidian"
echo "  2. Go to Settings → Community plugins"
echo "  3. Find 'Ultra Code Fence' and enable it"
echo "  4. If already enabled, toggle it off and on to reload"
echo
echo -e "Or press ${YELLOW}Cmd+R${NC} in Obsidian to reload and pick up changes."
echo
