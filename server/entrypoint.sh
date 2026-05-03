#!/bin/sh
# Entrypoint script for HMR backend
# Waits for PostgreSQL to be ready before starting the application

set -e

# Ensure Python can find user-installed packages
export PYTHONPATH="${HOME}/.local/lib/python3.11/site-packages:${PYTHONPATH}"

echo "Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be ready (max 60 attempts = 60 seconds)
attempt=0
max_attempts=60
while [ $attempt -lt $max_attempts ]; do
  if python -c "import psycopg2; conn = psycopg2.connect(host='${DB_HOST:-postgres}', port='${DB_PORT:-5432}', user='${DB_USER:-hmr}', password='${DB_PASSWORD:-hmr_secret}', dbname='${DB_NAME:-hmr_db}'); conn.close()" 2>/dev/null; then
    echo "PostgreSQL is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "PostgreSQL is unavailable - attempt $attempt/$max_attempts - sleeping"
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "ERROR: PostgreSQL did not become ready in time"
  exit 1
fi

# Execute the main command
exec "$@"