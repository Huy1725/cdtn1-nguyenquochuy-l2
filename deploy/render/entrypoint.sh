#!/bin/bash
# Container entrypoint of the Render demo image: start MySQL, wait until the app account can log in,
# then start the Node app. Secrets (DB_PASSWORD, JWT_SECRET) come from the platform's environment variables.
set -euo pipefail

: "${DB_PASSWORD:?DB_PASSWORD is not set - add it in the Render dashboard (Environment)}"
: "${JWT_SECRET:?JWT_SECRET is not set - add it in the Render dashboard (Environment)}"

DB_USER="${DB_USER:-app}"
DB_NAME="${DB_NAME:-warranty_l2}"
[[ "$DB_USER" =~ ^[A-Za-z0-9_]+$ && "$DB_USER" != "root" ]] \
  || { echo "DB_USER may contain only letters, digits and _ and must not be root" >&2; exit 1; }
[[ "$DB_NAME" == "warranty_l2" ]] \
  || { echo "This image contains the database warranty_l2, so DB_NAME must be warranty_l2" >&2; exit 1; }
# The password is written into one-line SQL below, so quote characters are refused instead of escaped.
[[ "$DB_PASSWORD" != *"'"* && "$DB_PASSWORD" != *"\\"* ]] \
  || { echo "DB_PASSWORD must not contain ' or \\" >&2; exit 1; }

# The database runs inside this container, so the app always talks to 127.0.0.1.
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER DB_NAME

# --init-file runs once while MySQL starts (before it accepts connections): give root a random password that
# nobody ever sees, and create the app account with the minimum rights (no DDL, no other databases).
INIT_FILE="$(mktemp)"
chmod 600 "$INIT_FILE"
ROOT_PASSWORD="$(head -c 32 /dev/urandom | base64 | tr -d '\n')"
{
  echo "ALTER USER 'root'@'localhost' IDENTIFIED BY '${ROOT_PASSWORD}';"
  echo "CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';"
  echo "ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';"
  echo "GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';"
} > "$INIT_FILE"
unset ROOT_PASSWORD

mysqld --init-file="$INIT_FILE" &
MYSQLD_PID=$!

ready=0
for _ in $(seq 1 120); do
  if MYSQL_PWD="$DB_PASSWORD" mysql -h 127.0.0.1 -P 3306 -u "$DB_USER" -e "SELECT 1" "$DB_NAME" >/dev/null 2>&1; then
    ready=1
    break
  fi
  kill -0 "$MYSQLD_PID" 2>/dev/null || { echo "mysqld stopped unexpectedly" >&2; exit 1; }
  sleep 2
done
rm -f "$INIT_FILE"
[[ "$ready" == 1 ]] || { echo "MySQL was not ready after 240 seconds" >&2; exit 1; }
echo "MySQL is ready (database ${DB_NAME}, account ${DB_USER})"

cd /app
node src/server.js &
NODE_PID=$!
# On SIGTERM (Render stops the instance) let Node close its connections first.
trap 'kill -TERM "$NODE_PID" 2>/dev/null || true' TERM INT

# Leave as soon as either process ends, so the platform restarts the whole container.
status=0
wait -n "$NODE_PID" "$MYSQLD_PID" || status=$?
kill -TERM "$NODE_PID" "$MYSQLD_PID" 2>/dev/null || true
wait || true
exit "$status"
