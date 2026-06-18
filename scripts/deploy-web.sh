#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SSH_TARGET="${SSH_TARGET:-clueroom}"
REMOTE_WEB_ROOT="${REMOTE_WEB_ROOT:-/opt/clueroom/web}"
PUBLIC_URL="${PUBLIC_URL:-https://www.clueroom.xyz}"
REMOTE_BUNDLE="/tmp/clueroom-web-dist.tgz"

export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.clueroom.xyz}"
export VITE_ENABLE_DEV_LOGIN="${VITE_ENABLE_DEV_LOGIN:-false}"

log() {
  printf '\n==> %s\n' "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1" >&2
    exit 1
  fi
}

has_google_client_id() {
  if [[ -n "${VITE_GOOGLE_CLIENT_ID:-}" || -n "${VITE_GOOGLE_SERVER_CLIENT_ID:-}" ]]; then
    return 0
  fi

  for env_file in .env.production .env; do
    if [[ -f "$env_file" ]] && grep -Eq '^(VITE_GOOGLE_CLIENT_ID|VITE_GOOGLE_SERVER_CLIENT_ID)=' "$env_file"; then
      return 0
    fi
  done

  return 1
}

require_command npm
require_command tar
require_command scp
require_command ssh
require_command git

ensure_latest_checkout() {
  if [[ "${SKIP_GIT_UPDATE:-}" == "1" ]]; then
    log "Skip git update because SKIP_GIT_UPDATE=1"
    return
  fi

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "ERROR: this script must be run inside a git checkout." >&2
    exit 1
  fi

  local dirty
  dirty="$(git status --porcelain --untracked-files=normal)"
  if [[ -n "$dirty" ]]; then
    cat >&2 <<'EOF'
ERROR: local working tree is not clean.

Commit, stash, or remove local changes before production deploy.
This prevents deploying unreviewed local files by accident.

Current changes:
EOF
    echo "$dirty" >&2
    exit 1
  fi

  local upstream
  upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
  if [[ -z "$upstream" ]]; then
    echo "ERROR: current branch has no upstream tracking branch." >&2
    echo "Set upstream first, for example: git branch --set-upstream-to=origin/main" >&2
    exit 1
  fi

  log "Fetch latest git state"
  git fetch --prune

  local local_rev remote_rev base_rev
  local_rev="$(git rev-parse HEAD)"
  remote_rev="$(git rev-parse "$upstream")"
  base_rev="$(git merge-base HEAD "$upstream")"

  if [[ "$local_rev" == "$remote_rev" ]]; then
    echo "Already up to date with $upstream ($local_rev)"
    return
  fi

  if [[ "$local_rev" == "$base_rev" ]]; then
    log "Fast-forward pull from $upstream"
    git pull --ff-only
    return
  fi

  if [[ "$remote_rev" == "$base_rev" ]]; then
    cat >&2 <<EOF
ERROR: local branch is ahead of $upstream.

Push and review the local commits first, then deploy from the remote latest branch.
If this is an intentional emergency local deploy:
  SKIP_GIT_UPDATE=1 bash scripts/deploy-web.sh
EOF
    exit 1
  fi

  cat >&2 <<EOF
ERROR: local branch and $upstream have diverged.

Resolve the git state manually before production deploy.
EOF
  exit 1
}

ensure_latest_checkout

if ! has_google_client_id; then
  cat >&2 <<'EOF'
ERROR: Google web OAuth client id is not configured.

Create .env.production or export VITE_GOOGLE_CLIENT_ID before deploying.
Example:
  cp .env.example .env.production
  # then verify VITE_GOOGLE_CLIENT_ID is correct

To intentionally deploy without Google login:
  ALLOW_MISSING_GOOGLE_CLIENT_ID=1 bash scripts/deploy-web.sh
EOF

  if [[ "${ALLOW_MISSING_GOOGLE_CLIENT_ID:-}" != "1" ]]; then
    exit 1
  fi
fi

log "Install clean dependencies"
npm ci

log "Lint"
npm run lint

log "Build"
npm run build

TMP_BUNDLE="${TMPDIR:-/tmp}/clueroom-web-dist-$(date +%Y%m%d_%H%M%S).tgz"
trap 'rm -f "$TMP_BUNDLE"' EXIT

log "Package dist"
tar -C dist -czf "$TMP_BUNDLE" .

log "Upload bundle to $SSH_TARGET"
scp "$TMP_BUNDLE" "$SSH_TARGET:$REMOTE_BUNDLE"

log "Activate release on $SSH_TARGET"
ssh "$SSH_TARGET" "REMOTE_WEB_ROOT='$REMOTE_WEB_ROOT' REMOTE_BUNDLE='$REMOTE_BUNDLE' bash -s" <<'REMOTE'
set -Eeuo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
RELEASE_DIR="$REMOTE_WEB_ROOT/releases/$TS"

sudo mkdir -p "$RELEASE_DIR"
sudo tar -xzf "$REMOTE_BUNDLE" -C "$RELEASE_DIR"
sudo chown -R www-data:www-data "$RELEASE_DIR"
sudo ln -sfn "$RELEASE_DIR" "$REMOTE_WEB_ROOT/current"

sudo nginx -t
sudo systemctl reload nginx

echo "Activated: $RELEASE_DIR"
ls -l "$REMOTE_WEB_ROOT/current"
REMOTE

if command -v curl >/dev/null 2>&1; then
  log "Verify public URL"
  curl -fsSI "$PUBLIC_URL" | head -n 5
fi

log "Done"
