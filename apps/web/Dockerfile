# Build context is the repo root (npm workspaces need the root lockfile and
# the sibling workspace package.json files to install correctly).
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

COPY apps/web apps/web
# next.config.ts aliases @autoroom/api/client to the API's source directly
# (same trick apps/admin/Dockerfile uses for its own Vite alias) — only the
# client module is needed for the partner portal, not the whole API build.
COPY apps/api/src apps/api/src

# Baked in at build time: the partner-portal login talks to the API straight
# from the browser (not through this server's own request handling), so a
# NEXT_PUBLIC_ var is the only way for that fetch to know the API's public
# origin — Next inlines it into the client bundle during `next build`, not at
# container start.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace apps/web

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Next's standalone output mirrors the monorepo path it was built from and
# bundles only the production deps it actually traced — copy it, then add
# back the static assets and public folder it deliberately excludes.
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
# Alpine's default resolves "localhost" oddly for the standalone server's
# bind address — pin it to all interfaces so the host can reach the container.
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
