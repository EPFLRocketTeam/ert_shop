#!/bin/sh
set -e
# Only the server container runs migrations, so server + worker don't race.
if [ "$MEDUSA_WORKER_MODE" != "worker" ]; then
  echo "Running database migrations..."
  npx medusa db:migrate
fi
exec npx medusa start
