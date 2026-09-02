# Build context is the repo root — see apps/api/Dockerfile for why.
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

COPY apps/admin apps/admin
# vite.config.ts aliases @autoroom/api/client to the API's source directly —
# only the client module is needed, not the whole API build.
COPY apps/api/src apps/api/src

# Baked in at build time: a Vite SPA has no server to read env vars from at
# request time, so the API and public-site origins must be known before
# `vite build` runs.
ARG VITE_API_URL
ARG VITE_WEB_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEB_URL=$VITE_WEB_URL
RUN npm run build --workspace apps/admin

FROM nginx:1.27-alpine AS runtime
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
# Built with base '/admin/', so its own asset URLs are absolute paths under
# /admin/ — but this container is proxied at its root by the host nginx
# (which strips the /admin/ prefix), so the files are served from here too.
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
