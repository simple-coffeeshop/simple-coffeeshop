# --- Этап 1: Base (Общие системные зависимости) ---
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Установка системных библиотек, необходимых для Prisma и Argon2
RUN apt-get update && apt-get install -y --no-install-recommends \
  tini \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Этап 2: Build (Установка зависимостей и сборка) ---
FROM base AS build-stage
ENV NODE_ENV=production
# Инструменты сборки для нативных модулей (argon2)
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

# Генерация Prisma Client и сборка всех пакетов
# Используем dummy URL, так как при генерации реальное подключение не требуется
RUN DATABASE_URL="postgresql://docker:build@localhost:5432/build" pnpm --filter @simple-coffeeshop/db generate && \
  pnpm build

# --- Этап 3: Isolate (Создание легковесного окружения для API) ---
FROM build-stage AS isolate
ARG PKG_NAME=@simple-coffeeshop/api
RUN pnpm --filter ${PKG_NAME} --prod --legacy deploy /app/deployed

WORKDIR /app/deployed

# [EVA_FIX]: Подготавливаем окружение для рантайма
# 1. Схема в изолированном билде лежит внутри node_modules пакета db.
# 2. Нам ОЧЕНЬ нужен маркер pnpm-workspace.yaml для работы findProjectRoot().
RUN cp /app/pnpm-workspace.yaml ./ && \
  if [ -d "./node_modules/@simple-coffeeshop/db" ]; then \
  DATABASE_URL="postgresql://docker:build@localhost:5432/build" \
  ./node_modules/.bin/prisma generate \
  --schema ./node_modules/@simple-coffeeshop/db/prisma/schema/schema.prisma; \
  fi

# --- Этап 4: Runner (Финальный образ) ---
FROM base AS runner
WORKDIR /app
COPY --from=isolate /app/deployed ./

# Исправляем PATH для удобного запуска бинарников
ENV PATH="/app/node_modules/.bin:$PATH"
ENV NODE_ENV=production

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
# Запуск основного приложения (packages/api/dist/index.js)
CMD ["node", "dist/index.js"]

# --- Этап 5: Web Runner (Nginx) ---
# [EVA_FIX]: Этот этап используется только для сборки фронтенд-образа
FROM nginx:alpine AS runner-web
# Копируем билд фронтенда из этапа isolate
COPY --from=isolate /app/deployed/dist /usr/share/nginx/html
# Копируем конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
