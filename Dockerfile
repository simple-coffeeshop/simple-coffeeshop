# --- Этап 1: Base (Общие системные зависимости) ---
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends tini openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Этап 2: Build-stage (Сборка всех пакетов) ---
FROM base AS build-stage
ENV NODE_ENV=production
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# [EVA_OPTIMIZATION]: Сначала копируем только конфиги для лучшего кэширования слоев
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Копируем остальной код
COPY . .

# [EVA_FIX]: DATABASE_URL заглушка для генерации типов во время билда всего монорепозитория
RUN DATABASE_URL="postgresql://docker:build@localhost:5432/build" pnpm --filter @simple-coffeeshop/db generate && \
  pnpm build

# --- Этап 3: Isolate (Изоляция конкретного приложения) ---
FROM build-stage AS isolate
ARG PKG_NAME=@simple-coffeeshop/api
# Разворачиваем приложение и его production-зависимости в отдельную папку
RUN pnpm --filter ${PKG_NAME} --prod --legacy deploy /app/deployed

# [EVA_FIX]: Принудительная перегенерация Prisma Client внутри изолированной папки.
# Это гарантирует, что клиент будет находиться в /app/deployed/node_modules/.prisma
# Шаг выполняется только если пакет содержит или зависит от packages/db
WORKDIR /app/deployed
RUN if [ -d "./packages/db" ] || [ "$PKG_NAME" = "@simple-coffeeshop/api" ]; then \
  DATABASE_URL="postgresql://docker:build@localhost:5432/build" npx prisma generate --schema ./packages/db/prisma/schema/schema.prisma; \
  fi

# --- Этап 4: Runner (Финальный минимальный образ) ---
FROM base AS runner
WORKDIR /app

# Копируем только то, что нужно для работы из изолированного слоя
COPY --from=isolate /app/deployed ./

# [EVA_FIX]: Добавляем локальные бинарники зависимостей в PATH.
# Это лечит ошибку "sirv: not found" для Web.
ENV PATH="/app/node_modules/.bin:$PATH"
ENV NODE_ENV=production

# Безопасность: запуск от не-root пользователя
USER node
EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
# CMD переопределяется в docker-compose для каждого сервиса
CMD ["node", "dist/index.js"]
