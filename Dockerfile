# --- Этап 1: Base ---
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends tini openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Этап 2: Build ---
FROM base AS build-stage
ENV NODE_ENV=production
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .

RUN DATABASE_URL="postgresql://docker:build@localhost:5432/build" pnpm --filter @simple-coffeeshop/db generate && \
  pnpm build

# --- Этап 3: Isolate ---
FROM build-stage AS isolate
ARG PKG_NAME=@simple-coffeeshop/api
RUN pnpm --filter ${PKG_NAME} --prod --legacy deploy /app/deployed

WORKDIR /app/deployed

# [EVA_FIX]: Исправляем пути. В изолированном пакете схема лежит внутри node_modules.
# Проверяем наличие папки node_modules/@simple-coffeeshop/db для безопасности.
RUN if [ -d "./node_modules/@simple-coffeeshop/db" ]; then \
  DATABASE_URL="postgresql://docker:build@localhost:5432/build" ./node_modules/.bin/prisma generate \
  --schema ./node_modules/@simple-coffeeshop/db/prisma/schema/schema.prisma; \
  fi

# --- Этап 4: Runner ---
FROM base AS runner
WORKDIR /app
COPY --from=isolate /app/deployed ./

# [EVA_FIX]: Исправляем PATH для бинарников (sirv для web и др.)
ENV PATH="/app/node_modules/.bin:$PATH"
ENV NODE_ENV=production

USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]
