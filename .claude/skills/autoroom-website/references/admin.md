# Admin panel + backend — AutoRoom

The admin panel is the **back office** that owns all data the public Next.js site
shows. Build it **before** the public pages, and within it build **auth + roles +
settings first** (Phase A below).

## Architecture / Ճարտարապետություն

```
            ┌───────────────────────────┐
            │   PostgreSQL (Prisma)      │
            └────────────▲──────────────┘
                         │ Prisma ORM + migrations
            ┌────────────┴──────────────┐
            │  Node.js API (Express+TS)  │  ← auth (JWT), RBAC, REST, uploads
            └───▲──────────────────▲─────┘
                │ public read API   │ admin read/write API (auth required)
   ┌────────────┴──────┐   ┌────────┴───────────────┐
   │ Next.js public    │   │ React admin SPA (Vite) │
   │ site (this skill) │   │ roles + settings + CRUD│
   └───────────────────┘   └────────────────────────┘
```

**Stack (assumptions — swappable, stated up front):**
- Backend: **Node.js + TypeScript + Express + Prisma + PostgreSQL**, JWT auth
  (access + refresh), `bcrypt` password hashing, `zod` request validation, file
  uploads to S3-compatible storage (car/handover photos, docs, logos).
- DB **migrations**: Prisma Migrate (`prisma migrate dev/deploy`). Every schema
  change ships as a migration; never edit the DB by hand.
- Admin frontend: **React + TypeScript + Vite + React Router + TanStack Query**,
  a table-friendly UI kit (MUI or shadcn/ui). Optionally `refine.dev` to
  accelerate CRUD — note it but don't require it.
- The public Next.js site consumes the same API (read-only endpoints); it does
  not talk to the DB directly.

---

## Phase A (FIRST) — Auth, Roles, Admin shell, Settings

### A1. Authentication — login / logout / registration
- **Registration** (`POST /auth/register`): email, password, name. First-ever
  user becomes `super_admin`; subsequent self-registrations are created as
  `pending` and must be approved/role-assigned by an admin (public site visitors
  are NOT users — leads are separate). Configurable: registration can be
  invite-only (a setting).
- **Login** (`POST /auth/login`): email + password → access token (short-lived)
  + refresh token (httpOnly cookie). `bcrypt.compare`. Rate-limit + lockout after
  N failures.
- **Logout** (`POST /auth/logout`): invalidate refresh token / clear cookie.
- **Refresh** (`POST /auth/refresh`): rotate refresh token.
- **Password reset** (`POST /auth/forgot`, `POST /auth/reset`): emailed token.
- **Me** (`GET /auth/me`): current user + role + permissions.
- Admin frontend: `/login`, `/register`, `/forgot-password` screens; auth context;
  protected routes; auto-refresh; redirect unauthenticated → `/login`.

### A2. Roles & permissions (RBAC)
Roles (seed on migrate):
- `super_admin` — everything, incl. user & role management, settings.
- `admin` — all content + orders + leads; manage managers/editors; not billing/
  role definitions.
- `manager` (sales/CRM) — leads, partners, bookings, orders (view + advance
  status), no settings/users.
- `content_editor` — cars, machinery, offers, FAQ, branches, team, media; no
  leads/orders/settings.
- `partner` — **portal only** (own orders), never sees the admin.
Implement as a **permissions matrix** (`role × resource × action`
[create/read/update/delete/publish]) checked by middleware, so roles are
data-driven and editable by `super_admin` (see A2 UI). Guard both API (middleware)
and admin UI (hide/disable actions the role lacks).

### A3. Admin shell (React)
- App layout: sidebar nav (grouped: Cars, USA, Offers, Leads, Partners, Orders,
  Content, Settings, Users), top bar (user menu, logout, environment), breadcrumb.
- Reusable **DataTable** (server-side pagination, sort, filter, search), **Form**
  wrapper (zod-validated), **ImageUploader** (multi, album-aware), **StatusBadge**,
  confirm-dialogs, toast notifications, role-gated action buttons.
- Dashboard landing: counts (new leads, active orders, cars by status) + recent
  activity. (Mirrors the partner-portal dashboard but company-wide.)

### A4. Settings module (editable / whitelabel) ⭐
A single **Settings** area where `super_admin`/`admin` configure the site without
code. Stored as typed settings records (grouped JSON), read by BOTH the admin and
the public site (public reads a cached, read-only `GET /settings/public`).
- **Branding / whitelabel:** brand name, logo (light/dark), favicon, **accent
  color** + theme tokens, default font — these override `design-tokens.md` at
  runtime so the whole site can be re-skinned from the panel.
- **Contacts:** phones, email, working hours, social links, messenger links
  (WhatsApp/Viber/Telegram).
- **Branches:** managed here (also its own resource) — see data model.
- **Finance:** `CalculatorConfig` (term months, nominal rate, effective-rate
  range, KASKO disclaimer), banks list (name, logo, loan URL, in-house flag).
- **Feature toggles:** enable/disable sections (e.g. machinery, blog, quiz),
  registration invite-only on/off, maintenance mode.
- **Localization:** default locale, enable second locale later.
Every setting change is validated, versioned (audit who/when), and takes effect
on the public site via the cached public-settings endpoint.

---

## Phase B onward — Domain data model & CRUD

Prisma models (fields summarized; each is an admin CRUD resource with a migration):

- **User** `{ id, email, passwordHash, name, role, status(pending|active|
  disabled), lastLoginAt }`
- **Setting** `{ key, group, valueJson, updatedBy, updatedAt }` (+ audit rows)
- **Car** `{ id, slug, origin(china|usa), make, model, year, trim,
  powertrain(EV|Hybrid|Benzin), range, battery, engine, drivetrain, transmission,
  seats, warranty, vin?, lotNumber?, mileage?, price, oldPrice?,
  estFinalPriceAM?, condition(in_stock|on_order|on_road|auction), statusBadge?
  (na_navum|poti|customs), deliveryEtaDays?, location?, damageHistory?,
  financingAvailable(bool), featured(bool), colors: Json (order-only, name+hex+
  imageRef), priceJourney: Json (4 breakdown chips), publishedAt? }`
- **CarImage** `{ id, carId, album(exterior|interior|details|video|auction|
  receipt|handover), url, order }`
- **Machinery** `{ id, slug, manufacturer, model, year, engine, power, weight,
  operatingHours, fuel, dimensions, loadCapacity, price, deliveryEtaDays,
  condition('order'), images(album) }`
- **AuctionListing** `{ id, carId?, platform(copart|iaai|manheim), lot,
  currentBid, auctionEndsAt, damageType, mileage, savingsVsMarket,
  viewOnlyLink?, estFinalPriceAM }` (Manheim: no viewOnlyLink → contact-only)
- **Offer** `{ id, name, bannerUrl, description, startsAt, endsAt,
  status(current|past), discount?, participatingCarIds: Json, directions: Json }`
- **Lead** `{ id, type(universal|quiz|per_car|auction_contact|contact_form|
  partner_booking), name, phone, interest?, budget?, financing?, timing?,
  channel?, comment?, carRef?(name+vin), quizAnswers?: Json, recommendations?:
  Json, sourcePage, sourceCta, locale, device, status(new|contacted|won|lost),
  assignedUserId?, createdAt }`
- **Partner** `{ id, company?, contactName, phone, email?, activityField, userId?
  (portal login), status(lead|active), createdAt }`
- **Booking** `{ id, partnerId?, name, phone, email?, company?, activityField,
  date, timeSlot, format(online|office|other), otherAddress?, status(pending|
  confirmed|done|cancelled) }`
- **Availability** `{ id, date, slots: Json (slot→open/taken) }` (drives booking chips)
- **Order** `{ id, orderNumber, carId, partnerId?/customerId?, country,
  branchId?, containerNumber?, shipName?, trackingLink?, currentStage, notices:
  Json }`
- **OrderStage** `{ id, orderId, stage(order_created|payment_confirmed|purchased|
  at_warehouse|loading|on_road|arrived|handed_over), date, done(bool) }`
- **Document** `{ id, orderId, type(invoice|contract|other), url, uploadedBy }`
- **Payment** `{ id, orderId, date, description, amount, stage }`
- **Branch** `{ id, name, city, address, phone, hours, lat?, lng?, mapUrl?,
  photoUrl }`
- **Faq** `{ id, topic(china|usa), question, answer, order, published }`
- **TeamMember** `{ id, name, role, photoUrl, socialUrl?, order }`
- **Media** `{ id, kind(founder|customer_story|guide_reel), title, videoUrl,
  posterUrl, meta: Json }`
- **Bank** `{ id, name, logoUrl, loanUrl?, inHouse(bool), order }`

### Admin resources map to public surfaces
- Cars/Machinery/Auctions → China + USA + Machinery pages.
- Featured flag + Offers → Homepage Featured + `/offers`.
- Leads → CRM inbox (all popups/forms land here with hidden context intact).
- Partners/Bookings/Availability → `/partners` + booking popup + portal accounts.
- Orders (+ stages/docs/payments/photos) → **partner portal car detail** (the
  Gyumri handover album is uploaded by staff here when the container opens).
- Faq/Branch/TeamMember/Media/Bank/CalculatorConfig → their public sections + Settings.

---

## Cross-cutting

- **Validation** with zod on every write; consistent error shape.
- **Uploads:** presigned URLs; images optimized; albums enforce allowed values.
- **Audit log** for settings, role changes, order-stage advances (who/when).
- **Seed script:** first `super_admin`, default roles/permissions, default
  settings (branding/contacts/calculator), the 3 branches, bank list.
- **Migrations are the source of truth** — every model/enum change = a new Prisma
  migration checked into git.
- **Security:** httpOnly refresh cookie, CSRF protection on cookie auth, rate
  limiting, RBAC on every admin route, no public write endpoints except lead
  creation (`POST /leads`, unauthenticated, rate-limited).
