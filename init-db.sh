#!/bin/bash
set -e

echo "[INIT-DB]: Starting database initialization..."

# Проверяем наличие переменной
if [ -z "$POSTGRES_MULTIPLE_DATABASES" ]; then
  echo "[INIT-DB]: No additional databases requested."
  exit 0
fi

# Парсим список
for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
  db=$(echo "$db" | xargs)
  if [ -z "$db" ]; then continue; fi

  echo "[INIT-DB]: Checking database '$db'..."

  # [EVA_FIX]: Добавлен флаг -d postgres.
  # Это предотвращает попытку psql подключиться к несуществующей базе 'user'.
  DB_EXISTS=$(psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$db'")

  if [ "$DB_EXISTS" != "1" ]; then
    echo "[INIT-DB]: Creating database '$db'..."
    # [EVA_FIX]: Здесь также указываем -d postgres для выполнения команды CREATE
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<-EOSQL
            CREATE DATABASE "$db";
            GRANT ALL PRIVILEGES ON DATABASE "$db" TO "$POSTGRES_USER";
EOSQL
    echo "[INIT-DB]: Database '$db' created successfully."
  else
    echo "[INIT-DB]: Database '$db' already exists, skipping."
  fi
done

echo "[INIT-DB]: Initialization complete."
