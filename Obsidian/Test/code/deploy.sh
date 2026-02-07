#!/bin/bash
set -euo pipefail

# =============================================
# Production Deployment Script
# =============================================

# -- CONFIG --
APP_NAME="myapp"
DEPLOY_DIR="/var/www/${APP_NAME}"
BACKUP_DIR="/var/backups/${APP_NAME}"
REPO_URL="git@github.com:example/${APP_NAME}.git"
BRANCH="main"
LOG_FILE="/var/log/${APP_NAME}-deploy.log"

# -- COLOURS --
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# -- FUNCTIONS --

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

warn() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

fail() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1"
    echo -e "${RED}${msg}${NC}" >&2
    echo "$msg" >> "$LOG_FILE"
    exit 1
}

# BEGIN BACKUP
create_backup() {
    log "Creating backup..."
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/${APP_NAME}-${timestamp}.tar.gz"

    mkdir -p "$BACKUP_DIR"
    tar -czf "$backup_path" -C "$(dirname "$DEPLOY_DIR")" "$(basename "$DEPLOY_DIR")" \
        || fail "Backup failed"

    log "Backup created: ${backup_path}"

    # Keep only last 5 backups
    ls -t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
}
# END BACKUP

# BEGIN DEPLOY
deploy() {
    log "Starting deployment of ${APP_NAME}..."

    # Pull latest code
    cd "$DEPLOY_DIR"
    git fetch --all --prune
    git checkout "$BRANCH"
    git reset --hard "origin/${BRANCH}"

    # Install dependencies
    log "Installing dependencies..."
    npm ci --production

    # Build
    log "Building..."
    npm run build

    # Run migrations
    log "Running migrations..."
    npm run migrate

    # Restart service
    log "Restarting ${APP_NAME}..."
    systemctl restart "$APP_NAME"

    # Health check
    log "Waiting for health check..."
    sleep 3
    if curl -sf "http://localhost:3000/health" > /dev/null; then
        log "Health check passed!"
    else
        fail "Health check failed — rolling back"
    fi
}
# END DEPLOY

# -- MAIN --

log "===== Deployment started ====="
create_backup
deploy
log "===== Deployment complete ====="
