#!/bin/bash
# Build-time only (called from deploy/render/Dockerfile): create the MySQL data directory and load the schema and
# the sample data into it, in the same order as the initdb mounts of docker-compose.yml.
set -euo pipefail

DATADIR=/opt/mysql-data   # must match datadir in mysql.cnf
SOCKET=/tmp/bake.sock

mkdir -p "$DATADIR"
chown mysql:mysql "$DATADIR"

# --initialize-insecure: inside this image layer the MySQL account root has an empty password.
# entrypoint.sh gives root a random password at every start, and MySQL listens on 127.0.0.1 only.
mysqld --initialize-insecure --user=mysql

mysqld --user=mysql --skip-networking --socket="$SOCKET" &
MYSQLD_PID=$!

for _ in $(seq 1 120); do
  mysqladmin --socket="$SOCKET" -uroot ping --silent 2>/dev/null && break
  kill -0 "$MYSQLD_PID" 2>/dev/null || { echo "mysqld stopped during the build" >&2; exit 1; }
  sleep 1
done
mysqladmin --socket="$SOCKET" -uroot ping --silent

mysql --socket="$SOCKET" -uroot -e "CREATE DATABASE warranty_l2"
for file in /app/migrations/*.sql /app/seeds/*.sql; do
  echo "loading $file"
  mysql --socket="$SOCKET" -uroot warranty_l2 < "$file"
done

mysqladmin --socket="$SOCKET" -uroot shutdown
wait "$MYSQLD_PID"
chown -R mysql:mysql "$DATADIR"
echo "data directory ready: $(du -sh "$DATADIR" | cut -f1)"
