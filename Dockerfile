# ── Cowork WebSocket Server ──────────────────────────────────────────
# Builds inside the monorepo root so pnpm workspace links resolve.
# Uses tsx at runtime because @cowork/shared exposes raw .ts files.

FROM node:20-slim AS builder

RUN corepack enable pnpm

# Build tools for uWebSockets.js native compilation
RUN apt-get update && \
    apt-get install -y python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace plumbing first (Docker layer cache)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy only the packages the server needs
COPY packages/shared/ packages/shared/
COPY apps/server/ apps/server/

# Install all deps (including devDeps for tsx)
RUN pnpm install --frozen-lockfile

# ── Runtime ──────────────────────────────────────────────────────────
FROM node:20-slim

RUN corepack enable pnpm

# uWebSockets.js needs libc at runtime, node:20-slim already has it
WORKDIR /app

COPY --from=builder /app/ /app/

ENV PORT=3333
EXPOSE 3333

CMD ["npx", "tsx", "apps/server/src/index.ts"]
