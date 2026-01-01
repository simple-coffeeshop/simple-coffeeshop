# --- Этап 1: Базовый образ ---
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Системные зависимости для рантайма и билда
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
  tini \
  openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Этап 2: Установка зависимостей и сборка ---
FROM base AS build-stage
ENV CI=true

# Зависимости для компиляции нативных модулей (argon2 и т.д.)
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY apps/web/package.json ./apps/web/

# Устанавливаем все зависимости
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

# Генерация Prisma Client и билд проекта
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm --filter @simple-coffeeshop/db generate && \
  pnpm build

# --- Этап 3: Изоляция пакета (Deploy) ---
# [EVA_FIX]: В pnpm v10 флаг --legacy необходим для деплоя без принудительного 'injected' режима
FROM build-stage AS isolate
RUN pnpm --filter @simple-coffeeshop/api --prod --legacy deploy /app/deployed

# --- Этап 4: Финальный образ (Runner) ---
FROM base AS runner
WORKDIR /app

# Копируем результат деплоя
COPY --from=isolate /app/deployed ./

# [EVA_CHECK]: Prisma Client. 
# pnpm deploy копирует физические файлы, поэтому симлинки на .prisma превратятся в реальные папки.
ENV NODE_ENV=production
USER node

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]
