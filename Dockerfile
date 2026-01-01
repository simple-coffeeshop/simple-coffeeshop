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
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .

# [EVA_FIX]: DATABASE_URL заглушка для генерации типов
RUN DATABASE_URL="postgresql://docker:build@localhost:5432/build" pnpm --filter @simple-coffeeshop/db generate && \
  pnpm build

# --- Этап 3: Isolate ---
FROM build-stage AS isolate
ARG PKG_NAME=@simple-coffeeshop/api
# В v10 нужен --legacy
RUN pnpm --filter ${PKG_NAME} --prod --legacy deploy /app/deployed

# --- Этап 4: Runner ---
FROM base AS runner
WORKDIR /app
COPY --from=isolate /app/deployed ./
ENV NODE_ENV=production
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
# [EVA_FIX]: В изолированном образе запускаем напрямую
CMD ["node", "dist/index.js"]
