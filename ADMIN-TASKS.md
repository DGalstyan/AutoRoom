# AutoRoom — admin panel & backend task prompts / Ադմին-պանելի առաջադրանքներ

Build order: **the admin panel + backend come first**, and within them **auth →
roles → admin shell → settings** come before any domain CRUD, and all of that
comes before the public site (`AGENT-TASKS.md`). Public pages read from this
backend, so it must exist first.

Stack: backend = **Node.js + TypeScript + Express + Prisma + PostgreSQL**; admin =
**React + TypeScript + Vite + TanStack Query**. Full spec: skill
`references/admin.md`. Agents: `backend-api`, `admin-frontend`.

Format per task: agent · Prompt (paste) · Done when.

---

## Phase A — Auth, Roles, Admin shell, Settings (FIRST) / Առաջինը

> **A0 — Backend project + DB + migrations + seed** · `backend-api`
> Prompt: "Initialize the Node.js + TypeScript + Express backend with Prisma +
> PostgreSQL per `references/admin.md`. Create the initial Prisma schema for User,
> Setting, and the role/permission tables, run the first `prisma migrate`, and
> write a seed that creates the first `super_admin`, the default roles + permission
> matrix, and default settings (branding, contacts, calculator, banks) + the 3
> branches. Add `.env.example`, zod, error handling, and a typed API client output."
> Done when: `prisma migrate dev` + seed run clean; `GET /health` works; super_admin exists.

> **A1 — Auth API (login/logout/registration)** · `backend-api`
> Prompt: "Implement auth per `references/admin.md` A1: `POST /auth/register`
> (first user → super_admin; others → `pending`; respect invite-only setting),
> `POST /auth/login` (bcrypt, access token + httpOnly refresh cookie, rate-limit +
> lockout), `POST /auth/logout`, `POST /auth/refresh` (rotate), `POST /auth/forgot`
> + `POST /auth/reset`, `GET /auth/me`. Add CSRF protection for cookie auth."
> Done when: full register→login→refresh→logout cycle works; reset issues + consumes a token; lockout triggers.

> **A2 — RBAC middleware + role management** · `backend-api`
> Prompt: "Implement the data-driven `role × resource × action` permission matrix
> and Express middleware guarding admin routes (roles: super_admin, admin, manager,
> content_editor, partner). Add endpoints for super_admin to view/edit role
> permissions and to approve/assign roles to `pending` users."
> Done when: forbidden actions return 403; super_admin can change a role's permissions and it takes effect.

> **A3 — Settings API (editable / whitelabel)** · `backend-api`
> Prompt: "Implement the Settings module per `references/admin.md` A4: typed,
> grouped settings (branding/whitelabel, contacts, finance/calculator, banks,
> feature toggles, localization), validated + audited (who/when), plus a cached
> read-only `GET /settings/public` for the public site."
> Done when: settings read/write with audit rows; public endpoint returns branding/contacts; invalid values rejected.

> **A4 — Admin auth screens + context (React)** · `admin-frontend`
> Prompt: "Build the React admin auth per `references/admin.md`: `/login`,
> `/register`, `/forgot-password` screens, auth context using `GET /auth/me`,
> access-token handling with silent refresh, protected routes (redirect to
> `/login`), and logout. English UI."
> Done when: can register/login/logout; refresh keeps the session; protected routes gate correctly.

> **A5 — Admin shell + RBAC UI + reusable primitives** · `admin-frontend`
> Prompt: "Build the admin layout (grouped sidebar, top bar with user menu/logout,
> breadcrumbs) and reusable DataTable (server pagination/sort/filter/search),
> zod-validated Form, album-aware ImageUploader (presigned), StatusBadge, confirm
> dialogs, toasts. Hide/disable nav + actions per the current role's permissions."
> Done when: shell renders; a demo resource lists in DataTable; role-gated items hide for lower roles.

> **A6 — Settings UI (whitelabel)** · `admin-frontend`
> Prompt: "Build the Settings screens: branding (brand name, logo light/dark,
> favicon, accent color/theme tokens, font — with live preview), contacts/socials/
> messengers, feature toggles, localization.
> Persist via the settings API; changes reflect on reload."
> Done when: editing branding/contacts saves and re-renders; feature toggles flip; values validated.

> **A7 — Dashboard** · `admin-frontend`
> Prompt: "Build the admin dashboard: company-wide counts (new leads, active
> orders, cars by status) + recent activity, reading real endpoints."
> Done when: dashboard shows live counts and recent items.

## Phase B — Catalog resources / Կատալոգ

> **B1 — Cars API + migration** · `backend-api`
> Prompt: "Add Car + CarImage models/migration and CRUD per `references/admin.md`
> (origin china|usa, all specs, condition, colors JSON, priceJourney JSON, image
> albums, featured, publishedAt) with server-side pagination/filter/sort and RBAC."
> Done when: cars CRUD works incl. album images and featured flag; migration committed.

> **B2 — Cars admin screens** · `admin-frontend`
> Prompt: "Build Cars CRUD screens: list (DataTable, filters by origin/condition/
> featured), create/edit form, image-album uploader (exterior/interior/details/
> video/auction/receipt/handover), order-only color editor (name+hex+image),
> price-journey editor (4 chips), featured toggle, publish."
> Done when: a car can be created end-to-end and appears via the public read API.

> **B3 — Machinery + Auctions** · `backend-api` + `admin-frontend`
> Prompt: "Add Machinery and AuctionListing models/migrations + CRUD (Manheim =
> no viewOnlyLink → contact-only), and their admin screens."
> Done when: machinery + auction listings manageable; platform rules enforced.

> **B4 — Offers / Ակցիաներ** · `backend-api` + `admin-frontend`
> Prompt: "Add Offer model/migration + CRUD (current/past, banner, deadline,
> participating cars/directions, discount) and admin screens with a current/past
> filter."
> Done when: offers CRUD works; status current/past drives public rendering.

## Phase C — CRM, Partners, Orders / CRM, Գործընկերներ, Պատվերներ

> **C1 — Leads API (+ public POST)** · `backend-api`
> Prompt: "Add Lead model/migration + `POST /leads` (public, unauthenticated,
> rate-limited) capturing all popup/form types with hidden context (sourcePage,
> sourceCta, car+VIN, timestamp, locale, device), quiz answers/recommendations;
> plus authenticated list/filter/assign/status endpoints."
> Done when: a public lead submit persists with full context; managers can filter/assign/update status.

> **C2 — Leads CRM inbox (React)** · `admin-frontend`
> Prompt: "Build the Leads inbox: DataTable filtered by type/source/status/date,
> detail drawer showing the hidden context + car reference, assign-to-manager, and
> status transitions (new→contacted→won/lost)."
> Done when: managers work leads end-to-end from the inbox.

> **C3 — Partners + Bookings + Availability** · `backend-api` + `admin-frontend`
> Prompt: "Add Partner, Booking, Availability models/migrations + CRUD. Booking
> slots come from Availability (taken/open). Admin: partners list, bookings
> calendar/list with confirm/cancel, availability/slot editor. Link a partner to a
> portal user account."
> Done when: a booking ties to a slot; availability edits change open slots; partner can be granted portal access.

> **C4 — Orders (timeline, docs, payments, photos)** · `backend-api` + `admin-frontend`
> Prompt: "Add Order, OrderStage, Document, Payment models/migrations + CRUD.
> Admin: order detail with a **stage timeline editor** (advance stage + set date),
> delivery data (container/ship/tracking), documents upload, photo albums
> (auction/receipt auto, **Gyumri handover uploaded by staff when container
> opens**), payments ledger, and action notices. These feed the partner portal."
> Done when: advancing a stage + uploading handover photos + adding a payment all reflect on the partner portal car detail.

## Phase D — Content resources / Բովանդակություն

> **D1 — FAQ / Branches / Team / Media / Banks** · `backend-api` + `admin-frontend`
> Prompt: "Add Faq (topic china|usa), Branch, TeamMember, Media (founder/customer_
> story/guide_reel), Bank models/migrations + CRUD and admin screens. Branch +
> Bank + CalculatorConfig also surface in Settings."
> Done when: each content type is editable and drives its public section (Homepage FAQ aggregates china+usa)."

## Phase E — Handoff to public site

> **E1 — Public read API + typed client** · `backend-api`
> Prompt: "Expose read-only public endpoints (cars, machinery, auctions, offers,
> featured, faq, branches, team, media, banks, settings/public) with caching, and a
> typed client the Next.js site imports."
> Done when: the public site can fetch all it needs read-only; no write access exposed.

> **E2 — Wire public site to the API** · `frontend-builder`
> Prompt: "Replace the public site's mock data (`lib/mockCars.ts` etc.) with the
> `backend-api` public client; read branding/contacts/calculator from
> `GET /settings/public` so the whitelabel settings drive the live site."
> Done when: public pages render from real data; changing branding in admin re-skins the site.

---

## Suggested end-to-end order

1. **Phase A** (auth → roles → shell → settings → dashboard) — this is your "first."
2. **Phase B** (cars/machinery/auctions/offers) so there's catalog data.
3. **Phase C** (leads/partners/orders) — the operational core.
4. **Phase D** (content) + **Phase E** (public API + wiring).
5. Then build the public pages from `AGENT-TASKS.md`, now backed by real data.

Run `backend-api` and `admin-frontend` in lockstep per phase; agree endpoint
shapes before the frontend consumes them.
