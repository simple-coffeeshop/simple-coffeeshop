# --- Этап 1: Базовый образ ---
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# [EVA_PATCH]: Добавляем tini для корректной обработки сигналов завершения
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
  tini \
  openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Этап 2: Установка зависимостей и сборка ---
FROM base AS build-stage
ENV CI=true

# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl \
  libssl-dev \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# [EVA_PATCH]: Добавляем очистку кэша Prisma после билда
RUN pnpm --filter @simple-coffeeshop/db generate && \
  pnpm build && \
  pnpm prune --prod --ignore-scripts && \
  rm -rf node_modules/.cache && \
  rm -rf packages/db/node_modules/.cache

# --- Этап 3: Финальный образ (Runner) ---
# [EVA_FIX]: Наследуемся от нашего этапа 'base', а не от чистого образа.
# Теперь tini, который мы поставили в начале, будет доступен здесь.
FROM base AS runner

# Точка входа теперь сработает, так как tini есть в образе base
ENTRYPOINT ["/usr/bin/tini", "--"]

WORKDIR /app

# Нам всё еще нужен openssl для работы Prisma в рантайме.
# В base он уже есть, но если хочешь быть уверенным — можно оставить.
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Копируем результаты сборки с правильными правами
COPY --from=build-stage --chown=node:node /app/node_modules ./node_modules
COPY --from=build-stage --chown=node:node /app/packages ./packages
COPY --from=build-stage --chown=node:node /app/apps ./apps
COPY --from=build-stage --chown=node:node /app/package.json ./package.json

# Переключаемся на пользователя node (безопасность!)
USER node

EXPOSE 3000

# pnpm уже настроен в этапе base, так что команда сработает
CMD ["pnpm", "start"]
