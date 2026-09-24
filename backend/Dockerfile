# backend/Dockerfile
# Multi-stage production container build (SRS Module 25)

# ─── Stage 1: Build & Dependencies ──────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install system utilities needed for native builds
RUN apk add --no-cache openssl libc6-compat

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev for building)
RUN npm ci

# Generate Prisma Client for target architecture
RUN npx prisma generate

# ─── Stage 2: Production Runtime ────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache openssl libc6-compat curl

# Run as non-root unprivileged user
USER node

# Copy built dependencies and generated Prisma client
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node . .

EXPOSE 5000

# Health check probe against SLA/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/index.js"]
