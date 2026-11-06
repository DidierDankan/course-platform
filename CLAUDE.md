# CLAUDE.md — Lumen (course-platform)

## What this project is

**Lumen** is a two-sided video-course marketplace. Instructors (`seller`) publish video courses and students (`user`) buy them one at a time through Stripe Checkout and watch them with saved progress. There is also an `admin` role.

**Goal:** a deployed, production-quality **portfolio project** that shows senior-level engineering judgement. It is not a startup. Every piece of work should either make the live demo better or show a skill a hiring manager cares about: architecture, security, correctness, testing, UX polish. Anything that does neither is out of scope. See "Scope triage".

The owner is a developer who wants to **level up**, not just get code shipped. Explain the *why* behind decisions so they can defend the code in an interview.

---

## How to work with me (read this first)

- **Act as a senior/staff engineer reviewing and pairing**, not as an autocomplete. Push back on bad ideas immediately, say why, and propose 2–3 better options with their trade-offs.
- **Read the code before you answer.** Never give generic advice about "a typical Express app". Cite the actual files and lines (`server/db/CourseService.js:120`). If you haven't read something, say so.
- **Production-ready, not tutorial-grade.** No `console.log` debugging left in, no swallowed errors, no `// TODO: add validation`, no magic strings, no copy-pasted blocks. If a shortcut is acceptable for a portfolio project, say explicitly that it is a shortcut and what the production version would be.
- **Security is part of correctness, not an extra.** For any change that touches auth, payments, uploads or user input, state the threat model in 1–3 lines: who could abuse it, and how the code prevents that.
- **Teach in context.** When you introduce a pattern (idempotent webhooks, refresh-token rotation, design tokens…), explain it in 2–4 sentences, including the failure it prevents. No lectures.
- **Small, reviewable diffs.** One concern per change. Before a large refactor, give a short plan (files touched, risk, how to verify) and wait for a go-ahead.
- **Verify, don't claim.** After a change, run the build, lint or tests, or describe exactly how to check it manually. Never say "this should work".
- **Be direct.** No filler, no "Great question!", no recap of what you just did. Lead with the answer or the problem.
- If my request conflicts with good engineering, say so before doing it.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite 7, React Router 7, Redux Toolkit + RTK Query, Formik + Yup, Tailwind CSS v4, lucide-react, headlessui |
| Backend | Node (ESM) + **Express 5**, mysql2 (raw SQL, no ORM), express-validator, jsonwebtoken, bcryptjs, multer, Stripe SDK |
| DB | MySQL. Schema in `server/db/schema.sql` (drops and recreates every table — **destructive**) |
| Payments | Stripe Checkout (`mode: "payment"`, USD) + webhook at `POST /api/payments/webhook` (raw body, mounted before `express.json()`) |

## Layout and conventions

```
client/src/
  api/            apiSlice.js + baseQueryWithReauth.js (401 → /auth/refresh with mutex) + modules/*Api.js (one RTK Query slice per domain)
  components/ui/  reusable UI (CourseCard, CourseCTA, Header, FavoriteButton, Form/*)
  view/           route-level pages, grouped by area (auth, courses, user, profile, public, payment, layout)
  utils/routes/routeConfig.jsx   single source of truth for routes + allowed roles
  store/slices/   authSlice, userSlice
server/
  routes/ → controllers/ → db/*Service.js   (route = wiring + middleware, controller = HTTP, service = SQL)
  middleware/     authenticate, authorizeRoles, authenticateOptional, upload (multer, whitelisted MIME → extension), validateRequest,
                  courseOwnership (requireCourseOwner / requireMediaOwner, run before upload), protectVideos (gate in front of /uploads)
```

- Path aliases: `@api @components @view @utils @store @hooks @assets` (vite.config.js + jsconfig.json). Use them; no `../../..`.
- Keep the layering: **no SQL in controllers, no `req`/`res` in services**.
- Every SQL query is parameterized (`?` placeholders). Never build SQL by string interpolation.
- **Authorization lives on the server.** Any route that reads or changes a course, media item or enrollment must check ownership (`seller_id === req.user.id` or admin). Reuse `middleware/courseOwnership.js`; don't re-implement the check in a controller. Client-side route guards are UX, not security.
- New routes are added to `routeConfig.jsx` with explicit roles.

## Commands

```bash
# backend (port 3001)
cd server && npm run dev
# frontend (port 5173)
cd client && npm run dev
cd client && npm run lint && npm run build
# Stripe webhooks locally
stripe listen --forward-to http://localhost:3001/api/payments/webhook
```
Env: `server/.env` (PORT, DB_*, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLIENT_URL), `client/.env` (VITE_API_URL). JWT_SECRET becomes JWT_ACCESS_SECRET + JWT_REFRESH_SECRET with the planned `config.js` (issue 1); DEPLOY.txt section 4 already lists the live set. Both are gitignored. **Never print, commit or hardcode secrets.**

There are **no tests yet** (`server` test script is a stub).

---

## Task tracking: TODO.txt and DEPLOY.txt

- **`TODO.txt`** is the source of truth for what's done and what's open, with step-by-step plans. Read it before proposing work, and update it (move items to DONE, add new findings) as part of finishing a task.
- **`DEPLOY.txt`** is the chosen deploy plan: **Vercel** (client, with `/api` and `/uploads` rewrites so it's one site and cookies work) → **Render** (Express) → **Aiven** (MySQL, SSL, non-3306 port) → **Supabase Storage** (media; videos via short-lived signed URLs behind the `protectVideos` checks). Stripe stays in **test mode**. Its section 2.0 lists the TODO items that must be done before deploying.
- One home per fact: steps live in TODO.txt, deploy-only code changes live in DEPLOY.txt section 2 (TODO points there), and this file keeps only rules and a short status. When something changes, update all three in the same task. If TODO and DEPLOY disagree, **DEPLOY.txt wins** and TODO gets fixed.

## Already done (don't redo, don't re-flag)

- Paid videos gated by `server/middleware/protectVideos.js` (owner / admin / enrolled / `is_preview`), `Cache-Control: private, no-store`, unknown video files → 404.
- Uploads: MIME whitelist → server-chosen extension, 200 MB cap, `nosniff`, multer errors → 400.
- Stripe: checkout → verified webhook → idempotent enrollment (`INSERT … ON DUPLICATE KEY`). Free-only `POST /api/enrollments`. Can't buy your own course.
- Sellers can only edit or delete their own courses and media. `getCourses` scopes to `req.user.id` unless admin.
- Currency: **USD everywhere** (`server/lib/currency.js` ↔ `client/src/utils/currency/index.js`, `formatPrice`).
- Client API base comes from `VITE_API_URL` everywhere (no localhost fallbacks). `jsconfig.json` uses `./src/...` paths, no `baseUrl`.
- Owner/admin can watch their own course without an enrollment (no progress saved); progress PATCH requires an enrollment.

## Known open issues (verified in code 2026-11-05 — re-check before relying on this)

Ordered by severity. Every item has a step-by-step plan in TODO.txt; this list is only the status.

1. **JWT secrets.** `helpers/tokens.js` **and** `controllers/AuthController.js:8` sign with `JWT_SECRET || 'your_jwt_secret'`, while `authMiddleware.js`, `authOptional.js` and `protectVideos.js` verify with `process.env.JWT_SECRET` and no fallback. `/auth/refresh` (`AuthController.js:116-123`) also signs its own access token instead of using `helpers/tokens.js`. Fix: `config.js` that validates env at boot, `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, a `type` claim, and one token helper. *(TODO: PRIORITY "JWT secrets")*
2. **Expired token → 403, but the client only refreshes on 401** (`authMiddleware.js:15` vs `api/baseQueryWithReauth.js:16`). Fix: 401 for missing/invalid/expired, 403 only for "authenticated but not allowed". Also unblocks the "long videos after 15 minutes" item. *(TODO)*
3. **Refresh tokens can't be revoked or rotated.** A stolen refresh cookie works for 7 days, and logout can't kill it. Fix: `token_version` (cheap) or stored hashed refresh tokens with rotation and reuse detection (better story). *(TODO)*
4. **`schema.sql` fails on a fresh DB:** `schema.sql:71` indexes `course_media(course_id, position)`, but the column is `order_index`. Blocks DEPLOY.txt step 3. The schema also drops every table: add versioned migrations before deploy. *(TODO)*
5. **Hardening:** CORS origin hardcoded *(TODO)*, no helmet *(TODO; needs `crossOriginResourcePolicy: "same-site"` locally and the Supabase domain in CSP live)*, no rate limiting on login/register *(TODO; needs `trust proxy` on Render)*, `DB_PORT` ignored *(DEPLOY.txt 2.1)*.
6. **Webhook:** enrolls without checking `session.payment_status === "paid"`, and logs `session.metadata` / `session.payment_intent` (`PaymentController.js:94-95`). *(TODO)*
7. **Hardcoded styling:** ~370 Tailwind arbitrary hex classes across 26 files block theming. *(TODO: CLIENT "rename + design system")*
8. **Logging:** per-request `console.log` in `index.js`; debug logs in `WhatchCourse.jsx:30,106` and `Favorites.jsx:11`. *(TODO)*
9. **No tests and no CI.** *(TODO: TESTS & CI)*

## Design system (in progress)

- Brand: **Lumen**. The name comes from `APP_NAME` in `client/src/utils/brand/index.js` (plus the `<title>` in `client/index.html`) and, on the server, `server/lib/brand.js`, which `PaymentController` sends to Stripe Checkout as `branding_settings.display_name`. Keep the two constants in sync; never hardcode the name. The Stripe dashboard's Company name only affects receipts and emails. Two switchable themes from Figma Make: **`brutal`** (neo-brutalist: cream, black 2px outlines, hard offset shadows, yellow/red/mint) and **`cinematic`** (dark, lime `#C6F432` accent, 16:9 thumbnails, 1px borders).
- Approach: **one token set**, values switched by `<html data-theme="…">`. Theme stored in localStorage and applied by an inline script in `index.html` before React mounts (no flash of the wrong theme).
- Rule: components use **semantic tokens only** (`bg-surface`, `text-muted`, `bg-accent`, `border-line`, `rounded-card`, `shadow-card`, `font-display`). **No new arbitrary hex/radius/shadow values.** Theme-specific behaviour (rotated stickers, horizontal rows) goes in a few explicit `[data-theme=…]` rules, not in duplicate components.

---

## Scope triage — what's worth doing for a portfolio

Before starting any task, place it in one of these buckets and say which one.

**Do (high signal for reviewers):**
- Fix the open security issues above (token handling, 401/403, rate limiting). Together with the protected video delivery that is already done, these are the strongest interview stories.
- Tests on the money path: integration tests for checkout session → webhook → enrollment, and authorization tests ("seller A cannot edit seller B's course"). Use Vitest/Jest + Supertest against a test DB. A handful of meaningful tests beats coverage numbers.
- The design-system/theme refactor, and a polished responsive UI with loading, empty and error states.
- Deployment: the stack in DEPLOY.txt (Vercel + Render + Aiven MySQL + Supabase Storage), env-based config, a seeded demo account per role, and a README with an architecture diagram and a "decisions & trade-offs" section.
- CI: GitHub Actions running lint + build + tests on every push.

**Maybe (only if cheap, or if it shows a specific skill):**
- Instructor stats panel (revenue, students per course): one SQL aggregation, high demo value.
- `is_preview` toggle in the course editor (from TODO): small, and it completes an existing feature.
- Comments per course (from TODO): fine if kept simple (CRUD + ownership checks + pagination).
- Confirmation email on register: only with a real provider (Resend) and a queued/async send.

**Skip or defer (low signal, high cost):**
- Stripe subscriptions: complex billing state machine (proration, dunning, `past_due`). Not worth it unless it becomes the centrepiece. Hide the "subscription only" UI until it exists (`CourseFilters.jsx:138-143`, in TODO).
- n8n integration and badges/gamification: no engineering signal for the effort.
- Microservices, GraphQL, Kubernetes, or switching to TypeScript/an ORM mid-project "because it's senior". Senior means choosing the boring tool deliberately and explaining why. (Migrating to TypeScript *is* worth discussing as a dedicated, planned step, not as a side effect of another task.)

## Definition of done for any change

1. The code follows the layering and conventions above, and there are no new hardcoded secrets, colors or URLs.
2. Server-side authorization is checked for every new or changed endpoint.
3. Errors are handled with the right status codes (400 validation, 401 unauthenticated, 403 forbidden, 404, 409 conflict) and nothing internal leaks to the client.
4. `npm run lint` and `npm run build` pass in `client`, the server boots, and the relevant tests pass (once tests exist).
5. A short explanation of what changed, why, and how to verify it, plus any trade-off I should know about.
