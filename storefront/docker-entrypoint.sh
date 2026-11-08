#!/bin/sh
set -e
YARN="node .yarn/releases/yarn-4.12.0.cjs"

# 1. Publishable API key: from env if given, otherwise from the file the
#    backend writes on start (shared volume), waiting for it if needed.
if [ -z "$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" ] && [ -n "$PUBLISHABLE_KEY_FILE" ]; then
  echo "Waiting for the backend to export the publishable key ($PUBLISHABLE_KEY_FILE)..."
  i=0
  while [ ! -s "$PUBLISHABLE_KEY_FILE" ]; do
    i=$((i + 1))
    if [ "$i" -gt 120 ]; then echo "Timed out waiting for $PUBLISHABLE_KEY_FILE"; exit 1; fi
    sleep 5
  done
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="$(cat "$PUBLISHABLE_KEY_FILE")"
  export NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
fi

# 2. Build (needs the backend reachable). Skipped on a plain restart if the
#    build inputs didn't change.
STAMP="$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY|$NEXT_PUBLIC_BASE_URL|$NEXT_PUBLIC_STRIPE_KEY|$NEXT_PUBLIC_DEFAULT_REGION|$MEDUSA_BACKEND_URL"
if [ ! -f .next/BUILD_ID ] || [ "$(cat .next/.env-stamp 2>/dev/null)" != "$STAMP" ]; then
  echo "Building the storefront..."
  $YARN build
  printf '%s' "$STAMP" > .next/.env-stamp
fi

exec $YARN start
