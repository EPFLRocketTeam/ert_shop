#!/bin/sh
set -e
# Only the server container prepares the database, so server + worker don't race.
if [ "$MEDUSA_WORKER_MODE" != "worker" ]; then
  echo "Running database migrations..."
  npx medusa db:migrate

  # First start: seeds region/shipping/sample product. Later starts: no-op that
  # just re-exports the publishable key for the storefront.
  echo "Seeding (skipped automatically if already done)..."
  npx medusa exec ./src/scripts/seed.js

  # Use Stripe (only) in all regions as soon as a Stripe key is configured.
  npx medusa exec ./src/scripts/sync-payment-providers.js

  # Optional: create the first admin user from env (ignored if it exists).
  if [ -n "$MEDUSA_ADMIN_EMAIL" ] && [ -n "$MEDUSA_ADMIN_PASSWORD" ]; then
    npx medusa user -e "$MEDUSA_ADMIN_EMAIL" -p "$MEDUSA_ADMIN_PASSWORD" >/dev/null 2>&1 \
      && echo "Admin user $MEDUSA_ADMIN_EMAIL created." \
      || echo "Admin user $MEDUSA_ADMIN_EMAIL already exists (or could not be created)."
  fi
fi
exec npx medusa start
