#!/bin/env bash

set -e

echo "[INIT-DB]: Starting database initialization..."

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
  echo "[INIT-DB]: Multiple databases requested: $POSTGRES_MULTIPLE_DATABASES"

  for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
    # Валидация: проверка на существование БД перед созданием
    DB_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname = '$db'")

    if [ "$DB_EXISTS" != "1" ]; then
      echo "[INIT-DB]: Creating database '$db'..."
      psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
                CREATE DATABASE "$db";
EOSQL
      echo "[INIT-DB]: Database '$db' created successfully."
    else
      echo "[INIT-DB]: Database '$db' already exists, skipping."
    fi
  done
else
  echo "[INIT-DB]: No additional databases to create."
fi

echo "[INIT-DB]: Initialization complete."
