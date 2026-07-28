# @autoroom/api

Node.js + TypeScript + Express + Prisma + PostgreSQL backend. Owns all data the
public site and the admin panel show — see
`.claude/skills/autoroom-website/references/admin.md` for the full spec and
`ADMIN-TASKS.md` for the build order.

## Getting started

```bash
cp apps/api/.env.example apps/api/.env   # then edit if you want a fixed admin password
npm run db:up                            # Postgres via docker compose (host port 55432)
npm run db:migrate                       # prisma migrate dev
npm run db:seed                          # roles, permissions, super_admin, settings, branches, banks
npm run dev:api                          # http://localhost:4000
curl http://localhost:4000/health
```

The seed prints a generated `super_admin` password once if
`SEED_SUPER_ADMIN_PASSWORD` is empty. It is not stored in plain text anywhere —
copy it, or set the variable before seeding.

> Host port **55432**, not 5432: a second local Postgres on the default port
> answers with `password authentication failed for user "autoroom"`, which reads
> like a credentials bug rather than a port clash.

## Endpoints

| Method | Path                      | Guard                | Notes                                                              |
| ------ | ------------------------- | -------------------- | ------------------------------------------------------------------ |
| GET    | `/health`                 | —                    | 503 when Postgres is unreachable                                   |
| POST   | `/auth/register`          | rate limit           | First-ever user → active super_admin (201); others → pending (202) |
| POST   | `/auth/login`             | rate limit + lockout | Access token in the body, refresh + CSRF cookies in headers        |
| POST   | `/auth/refresh`           | CSRF                 | Rotates the refresh token; replay revokes the whole family         |
| POST   | `/auth/logout`            | CSRF                 | 204                                                                |
| POST   | `/auth/forgot`            | rate limit           | Always 202 — never reveals whether an address is registered        |
| POST   | `/auth/reset`             | rate limit           | Single-use token; revokes every session and clears a lockout       |
| GET    | `/auth/me`                | bearer               | User + role + permission strings                                   |
| GET    | `/permissions`            | `roles:READ`         | Full catalogue, for rendering the matrix as a grid                 |
| GET    | `/roles`, `/roles/:key`   | `roles:READ`         |                                                                    |
| PUT    | `/roles/:key/permissions` | `roles:UPDATE`       | Replaces the grant set wholesale; `super_admin` is immutable       |
| GET    | `/users`                  | `users:READ`         | `?status=PENDING&take=&skip=`                                      |
| POST   | `/users/:id/approve`      | `users:UPDATE`       | Activates a pending account and assigns a role                     |
| PATCH  | `/users/:id/role`         | `users:UPDATE`       | Granting/removing `admin` or `super_admin` needs `roles:UPDATE`    |
| PATCH  | `/users/:id/status`       | `users:UPDATE`       | Disabling revokes the account's sessions immediately               |

Permission checks read the grants stored in the database on every request, so a
`super_admin` editing a role changes what its holders can do on their next call
— no re-login, no deploy.

## Layout

| Path                      | Purpose                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| `src/app.ts`              | Express app factory; middleware order is the contract routes slot into   |
| `src/server.ts`           | Port binding and graceful shutdown                                       |
| `src/config/env.ts`       | zod-validated environment, parsed once at startup                        |
| `src/lib/errors.ts`       | `AppError` + the single `{ error: { code, message } }` response shape    |
| `src/lib/tokens.ts`       | Access-token signing; opaque refresh tokens hashed at rest               |
| `src/lib/cookies.ts`      | The httpOnly refresh cookie and its readable CSRF partner                |
| `src/middleware/`         | Auth, RBAC, CSRF, rate limiting, error translation, zod validation       |
| `src/services/session.ts` | Refresh-session issue / rotate / revoke, incl. replay detection          |
| `src/rbac/permissions.ts` | The `role × resource × action` matrix, shared by the seed and the guards |
| `src/client/`             | Typed API client consumed by the site and the admin SPA                  |
| `prisma/schema.prisma`    | Schema; migrations are the source of truth and are never edited in place |
| `prisma/seed.ts`          | Idempotent seed                                                          |

## Consuming the API

```ts
import { createApiClient } from '@autoroom/api/client';

const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL! });
const health = await api.health();
```

The client depends only on `fetch`, so it works in a React Server Component, the
browser and the admin SPA. Requires `npm run build --workspace apps/api` first,
since the export resolves to `dist/`.

## Scripts

| Script               | Does                                     |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | `tsx watch src/server.ts`                |
| `npm run build`      | Compile to `dist/` with declarations     |
| `npm run db:migrate` | Create/apply a dev migration             |
| `npm run db:deploy`  | Apply pending migrations (CI/production) |
| `npm run db:seed`    | Run the seed (safe to re-run)            |
| `npm run db:studio`  | Prisma Studio                            |
