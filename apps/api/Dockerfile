# Build context is the repo root (npm workspaces need the root lockfile and
# the sibling workspace package.json files to install correctly).
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
RUN npm ci

COPY apps/api apps/api
RUN npm run db:generate --workspace apps/api
RUN npm run build --workspace apps/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# npm workspaces hoist shared deps to the root node_modules; the generated
# Prisma client lives there too.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY apps/api/package.json ./apps/api/package.json
# prisma/seed.ts imports from ../src (it isn't compiled — tsconfig.build.json
# only includes src/**/*.ts) and is run directly via tsx, so the source has
# to be here too, not just the compiled dist.
COPY --from=builder /app/apps/api/src ./apps/api/src

WORKDIR /app/apps/api
EXPOSE 4000

# `migrate deploy` applies committed migrations and fails on drift — the same
# command CI proves against an empty database. Safe to re-run on every
# restart: it is a no-op once the schema is up to date.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
