# CLAUDE.md — Lumen (course-platform)

## What this project is

**Lumen** is a two-sided video-course marketplace. Instructors (`seller`) publish video courses and students (`user`) buy them one at a time through Stripe Checkout and watch them with saved progress. There is also an `admin` role.

**Goal:** a deployed, production-quality **portfolio project** that shows senior-level engineering judgement. It is not a startup. Every piece of work should either make the live demo better or show a skill a hiring manager cares about: architecture, security, correctness, testing, UX polish. Anything that does neither is out of scope. See "Scope triage".

Every change comes with its reasoning: the trade-offs considered and why this option won.

---

## How to work with me (read this first)

- **Act as a senior/staff engineer reviewing and pairing**, not as an autocomplete. Push back on bad ideas immediately, say why, and propose 2–3 better options with their trade-offs.
- **Read the code before you answer.** Never give generic advice about "a typical Express app". Cite the actual files and lines (`server/db/CourseService.js:120`). If you haven't read something, say so.
- **Production-ready, not tutorial-grade.** No `console.log` debugging left in, no swallowed errors, no `// TODO: add validation`, no magic strings, no copy-pasted blocks. If a shortcut is acceptable for a portfolio project, say explicitly that it is a shortcut and what the production version would be.
- **Security is part of correctness, not an extra.** For any change that touches auth, payments, uploads or user input, state the threat model in 1–3 lines: who could abuse it, and how the code prevents that.
- **Teach in context.** When you introduce a pattern (idempotent webhooks, refresh-token rotation, design tokens…), explain it in 2–4 sentences, including the failure it prevents. No lectures.
- **Small, reviewable diffs.** One concern per change. Before a large refactor, give a short plan (files touched, risk, how to verify) and wait for a go-ahead.
- **Verify, don't claim.** After a change, run the build, lint or tests, or describe exactly how to check it manually. Never say "this should work".
- **Never commit.** Don't run `git commit`, `git push`, or anything that stages for a commit or changes history. Leave the changes in the working tree; I review and commit them myself. At the end of a task, list the changed files and suggest a commit message.
- **Be direct.** No filler, no "Great question!", no recap of what you just did. Lead with the answer or the problem.
- If my request conflicts with good engineering, say so before doing it.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite 7, React Router 7, Redux Toolkit + RTK Query, Formik + Yup, Tailwind CSS v4, lucide-react, headlessui |
| Backend | Node (ESM) + **Express 5**, mysql2 (raw SQL, no ORM), express-validator, jsonwebtoken, bcryptjs, multer, Stripe SDK |
| DB | MySQL (InnoDB, utf8mb4). Schema = numbered files in `server/migrations`, applied once each by `npm run migrate` (records them in `schema_migrations`) |
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
- Schema changes go in a new numbered file in `server/migrations` (`002_reviews.sql`…). Never edit or delete an applied one: the runner refuses to start. There are no down migrations, and MySQL can't roll back table changes, so a file that fails halfway needs manual cleanup.
- **Authorization lives on the server.** Any route that reads or changes a course, media item or enrollment must check ownership (`seller_id === req.user.id` or admin). Reuse `middleware/courseOwnership.js`; don't re-implement the check in a controller. Client-side route guards are UX, not security.
- New routes are added to `routeConfig.jsx` with explicit roles.

## Commands

```bash
# backend (port 3001)
cd server && npm run dev
cd server && npm run migrate     # apply new files in server/migrations; safe to rerun
cd server && npm run seed:demo   # demo accounts + courses (needs DEMO_PASSWORD and .mp4 files in scripts/seed-assets)
# frontend (port 5173)
cd client && npm run dev
cd client && npm run lint && npm run build
# Stripe webhooks locally
stripe listen --forward-to http://localhost:3001/api/payments/webhook
```
Env: `server/.env` (PORT, DB_*, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLIENT_URL, optional TRUST_PROXY_HOPS), `client/.env` (VITE_API_URL). `server/config.js` validates them at boot; DEPLOY.txt section 4 lists the live set. Both are gitignored. **Never print, commit or hardcode secrets.**

There are **no tests yet** (`server` test script is a stub).

---

## Task tracking: TODO.txt and DEPLOY.txt

- **`TODO.txt`** is the source of truth for what's done and what's open, with step-by-step plans. Read it before proposing work, and update it (move items to DONE, add new findings) as part of finishing a task.
- **`DEPLOY.txt`** is the chosen deploy plan: **Vercel** (client, with `/api` and `/uploads` rewrites so it's one site and cookies work) → **Render** (Express) → **Aiven** (MySQL, SSL, non-3306 port) → **Supabase Storage** (media; videos via short-lived signed URLs behind the `protectVideos` checks). Stripe stays in **test mode**. Its section 2.0 lists the TODO items that must be done before deploying.
- One home per fact: steps live in TODO.txt, deploy-only code changes live in DEPLOY.txt section 2 (TODO points there), and this file keeps only rules and a short status. When something changes, update all three in the same task. If TODO and DEPLOY disagree, **DEPLOY.txt wins** and TODO gets fixed.
- **Session handoff = the `NOW` block at the top of TODO.txt.** Read it first in every session. At the end of every session (or before stopping mid-task) **rewrite** it, never append: date, branch, last commit, what's in progress, anything half-done or broken, the next step. Max ~12 lines. History doesn't go there; it goes in git. Plans don't go there; they stay in the TODO items it points to.
- **History = git.** Every commit has a body: why the change was made, how it was verified, and what's next if the work isn't finished. `git log` is the change log; never keep a hand-written list of changes in a file.
- Plans written in chat (e.g. a brief for the next phase) go into TODO.txt as steps before work starts. A plan that only exists in a chat is lost when the session ends.

## Already done (don't redo, don't re-flag)

- Paid videos gated by `server/middleware/protectVideos.js` (owner / admin / enrolled / `is_preview`), `Cache-Control: private, no-store`, unknown video files → 404.
- Uploads: MIME whitelist → server-chosen extension, 200 MB cap, `nosniff`, multer errors → 400.
- Stripe: checkout → verified webhook → idempotent enrollment (`INSERT … ON DUPLICATE KEY`), only when `payment_status === "paid"`. Free-only `POST /api/enrollments`. Can't buy your own course; checkout answers 409 if you already own it.
- Auth tokens: only `helpers/tokens.js` signs or verifies them, with separate access and refresh secrets, a `type` claim and a pinned algorithm. Missing, invalid or expired → 401; 403 only for authenticated but not allowed. `server/config.js` stops the server if a required variable is missing.
- Login and register are rate limited per IP (`server/middleware/rateLimitMiddleware.js`), 429 with a readable message. Counters are in memory (one server only). `TRUST_PROXY_HOPS` has to be measured on the live site.
- Helmet sets security headers on every answer (`same-site` resource policy, so local ports can share media). CORS origin comes from `CLIENT_URL`. Helmet's CSP only covers what Express serves; a CSP for the pages would go in `vercel.json`.
- Sellers can only edit or delete their own courses and media. `getCourses` scopes to `req.user.id` unless admin.
- Currency: **USD everywhere** (`server/lib/currency.js` ↔ `client/src/utils/currency/index.js`, `formatPrice`).
- Client API base comes from `VITE_API_URL` everywhere (no localhost fallbacks). `jsconfig.json` uses `./src/...` paths, no `baseUrl`.
- Owner/admin can watch their own course without an enrollment (no progress saved); progress PATCH requires an enrollment.

## Known open issues (verified in code 2026-11-05 — re-check before relying on this)

Ordered by severity. Every item has a step-by-step plan in TODO.txt; this list is only the status.

1. **Refresh tokens can't be revoked or rotated.** A stolen refresh cookie works for 7 days, and logout can't kill it. Fix: `token_version` (cheap) or stored hashed refresh tokens with rotation and reuse detection (better story). *(TODO)*
2. **Schema:** resolved in Stage 2 (2026-11-10). `schema.sql` is gone; `001_initial.sql` builds the same tables (minus reviews, comments and subscriptions) on InnoDB. Still open: bad input answers 500 instead of 400 on strict MySQL *(TODO: Stage 2b)*.
3. **Hardening:** no database SSL yet *(DEPLOY.txt 2.1)*.
4. **Hardcoded styling:** resolved in Phase 2 (2026-11-09). No arbitrary hex classes remain in `client/src`; colors live only in the theme files.
5. **No tests and no CI.** *(TODO: TESTS & CI)*
6. **Enrollment depends only on the webhook.** On Render's free plan the server sleeps, so the webhook can arrive late and the buyer returns to `/payment/success` without access. Fix: the server retrieves the session from Stripe by `session_id` on return and enrolls through the same idempotent code as the webhook. This doesn't trust the redirect, because the server asks Stripe. *(TODO: PRIORITY "check the payment when the buyer returns")*

## Design system

- Brand: **Lumen**. The name comes from `APP_NAME` in `client/src/utils/brand/index.js` (plus the `<title>` in `client/index.html`) and, on the server, `server/lib/brand.js`, which `PaymentController` sends to Stripe Checkout as `branding_settings.display_name`. Keep the two constants in sync; never hardcode the name. The Stripe dashboard's Company name only affects receipts and emails. Two switchable themes from Figma Make: **`brutal`** (neo-brutalist: cream, black 2px outlines, hard offset shadows, yellow/red/mint) and **`cinematic`** (dark, lime `#C6F432` accent, 16:9 thumbnails, 1px borders).
- Approach: **one token set**, values switched by `<html data-theme="brutal|cinematic">` (default `brutal`). Saved in localStorage key `lumen-theme` and applied by an inline script in `client/index.html` before React mounts (no flash). `client/src/hooks/useTheme.js` treats the `data-theme` attribute as the single store (`useSyncExternalStore` + one `MutationObserver`), so every component using it stays in sync; change the theme only through it (`setTheme` / `toggleTheme` / `applyTheme`). Both validate the value and fall back to `brutal`.
- Files (`client/src/styles/`): `tokens.css` (the `--lm-*` names + Tailwind mapping), `theme-brutal.css` / `theme-cinematic.css` (values only, taken from `design/*/src/index.css`), `components.css` (`@layer components`).
- Reference designs: `design/brutal` and `design/cinematic` share identical markup and class names; only values differ. Port markup as-is.
- **Component classes** use the reference names: `.button` (+ `-primary/-secondary/-ghost/-ink/-small`, `:disabled`, `.is-loading` + `.spinner`), `.course-card` / `.card-visual` / `.card-body`, `.card-label`, `.field` (+ `.has-error`), `.section-index`, `.toast`. They read `--lm-*` variables only: **no hex in `components.css`**.
- **Tailwind** stays for layout and spacing. One-off styling uses the token utilities `bg-lm-surface`, `text-lm-muted`, `border-lm-line`, `rounded-lm-card`, `shadow-lm-card`, `font-lm-display` (mapped with `@theme inline`, so they follow the theme). **No new arbitrary hex/radius/shadow values.**
- Theme differences live in theme variables (e.g. `--lm-press-transform`, `--lm-tilt-label`), not in duplicate components or `[data-theme]` selectors inside components.
- Popups use `components/ui/Modal.jsx` (native `<dialog>`, portalled to `body`). react-select can only be themed through inline styles, so it uses `components/ui/Form/selectStyles.js`, which passes `--lm-*` variables.

### Phase 2 decisions (approved)

- **Course lists:** Home is a looping carousel with arrows (and swipe on touch screens) in both themes, built with Embla. Browse and the instructor page are grids in both themes. There is no approved structural exception any more: theme differences live in variables.
- **Class names:** keep the reference names (`.button`, `.course-card`, `.field`, `.card-label`…). Don't rename them.
- **Home page:** up to **8** of the most popular courses (`sort=popular`) in the carousel, no infinite scroll, plus a "View all courses" link to `/courses`.
- **`/courses`:** keeps infinite scroll, rebuilt in Phase 2 with **RTK Query `infiniteQuery`**, with the filters stored in the URL (`useSearchParams`) so a filtered list can be shared, bookmarked and survives a reload.

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
- Stripe subscriptions: complex billing state machine (proration, dunning, `past_due`). Not worth it unless it becomes the centrepiece. The "Subscription only" filter gets removed, client and server, in Phase 2b (TODO); the `is_subscription_only` column and the enrollment guard stay.
- n8n integration and badges/gamification: no engineering signal for the effort.
- Microservices, GraphQL, Kubernetes, or switching to TypeScript/an ORM mid-project "because it's senior". Senior means choosing the boring tool deliberately and explaining why. (Migrating to TypeScript *is* worth discussing as a dedicated, planned step, not as a side effect of another task.)

## Definition of done for any change

1. The code follows the layering and conventions above, and there are no new hardcoded secrets, colors or URLs.
2. Server-side authorization is checked for every new or changed endpoint.
3. Errors are handled with the right status codes (400 validation, 401 unauthenticated, 403 forbidden, 404, 409 conflict) and nothing internal leaks to the client.
4. `npm run lint` and `npm run build` pass in `client`, the server boots, and the relevant tests pass (once tests exist).
5. A short explanation of what changed, why, and how to verify it, plus any trade-off I should know about.
6. Tracking is updated: the TODO item is ticked or moved to DONE, a suggested commit message says why + what's next (I do the committing), and the `NOW` block in TODO.txt is rewritten before the session ends.
