# AI Content Moderation Platform
###### *— Moazam Saif*

A full-stack platform that screens user-submitted images against six moderation
categories using Gemini 2.5 Flash, with a configurable policy engine, a user
appeal workflow, and an admin analytics dashboard.

---

## Tech Stack

| Layer       | Technology                                  |
|-------------|----------------------------------------------|
| Backend     | Node.js, Express, MongoDB (Atlas), Mongoose  |
| Auth        | JWT in an HttpOnly cookie, bcrypt            |
| AI          | Gemini 2.5 Flash (Google AI Studio)          |
| Image storage | Cloudinary                                 |
| Frontend    | React, Vite, Tailwind CSS, Recharts          |
| Containerization | Docker, docker-compose, nginx           |

---

## 1. Setup Instructions

### Prerequisites

- Docker Desktop, **or** Node.js 20+ if running without Docker
- A MongoDB Atlas cluster
- A Gemini API key — [aistudio.google.com](https://aistudio.google.com)
- A Cloudinary account (free tier) — [cloudinary.com](https://cloudinary.com)

### Option A — Run with Docker (recommended)

1. Clone/copy the project. Confirm this structure exists:
   ```
   content-moderation-platform/
   ├── docker-compose.yml
   ├── backend/   (Dockerfile, src/, package.json)
   └── frontend/  (Dockerfile, nginx.conf, src/, package.json)
   ```

2. Create a `.env` file in the **project root** (copy from `.env.example`)
   and fill in all values — see [Environment Variables](#2-environment-variables) below.

3. From the project root:
   ```bash
   docker compose up --build
   ```

4. Open **http://localhost:3000**. Log in with the `ADMIN_EMAIL` /
   `ADMIN_PASSWORD` you set in `.env` — this account is created automatically
   on first boot.

   For convenience, the currently deployed admin account is:
   - **Email:** `admin@example.com`
   - **Password:** `admin@123`

To stop: `docker compose down`
To rebuild after code changes: `docker compose up --build`

### Option B — Run locally without Docker

```bash
# Backend
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev             # http://localhost:5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

The Vite dev server proxies `/api` to `http://localhost:5000` automatically
(configured in `vite.config.js`), so no extra setup is needed for local
development.

---

## 2. Environment Variables

### Backend (`backend/.env` for local dev, or project-root `.env` for Docker)

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on. Default `5000`. |
| `NODE_ENV` | `development` or `production`. |
| `MONGO_URI` | MongoDB Atlas connection string, including the database name (e.g. `.../content_moderation?retryWrites=true&w=majority`). |
| `JWT_SECRET` | Long random string (32+ chars) used to sign auth tokens. |
| `GEMINI_API_KEY` | API key from Google AI Studio, used for image screening. |
| `CLOUDINARY_CLOUD_NAME` | From your Cloudinary dashboard. |
| `CLOUDINARY_API_KEY` | From your Cloudinary dashboard. |
| `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard. |
| `FRONTEND_URL` | Origin allowed by CORS, e.g. `http://localhost:3000`. |
| `ADMIN_EMAIL` | Email for the auto-created default admin account. |
| `ADMIN_PASSWORD` | Password for the default admin account (min 8 characters). |

> The default admin account is created (or an existing matching user promoted
> to admin) automatically every time the server starts — no manual database
> editing is required to access the admin panel.

### Frontend

No `.env` is required for the frontend. The API base URL is `/api` in both
dev (proxied by Vite) and production (proxied by nginx to the backend
container), so nothing needs to be configured per environment.

---

## 3. Key Architecture Decisions

**Policy snapshots.** Every submission copies all six active policy documents
into an immutable `PolicySnapshot` at the moment of screening. Verdicts
reference this snapshot rather than the live `Policy` collection. This means
admins can change thresholds or enforcement behavior at any time without
retroactively altering past verdicts — satisfying the requirement that
"policy changes apply to submissions made after the change."

**Images as the verdict-bearing entity, not Submissions.** A `Submission` is
a thin grouping container for one upload request. Each `Image` inside it is
screened independently and carries its own `outcome`, full `categoryResults`
breakdown, and appeal state. This mirrors the spec directly: *"Each image is
screened independently and receives its own verdict."*

**Outcome priority: Blocked > Flagged > Approved.** If any enabled category
is configured as `auto_block` and its confidence meets the threshold, the
image is immediately `blocked`, regardless of any `flag_review` results from
other categories. Otherwise, any `flag_review` trigger sets the outcome to
`flagged`. With no triggers, the image is `approved`.

**Denormalized appeal state on Image.** `appealId` and `appealStatus` are
stored directly on the `Image` document (in addition to the full record in
the `Appeal` collection) so submission lists and history views can show
appeal status without an extra join per row.

**Single JWT in an HttpOnly cookie.** Authentication uses one signed JWT
(7-day expiry) stored in an HttpOnly, SameSite=Strict cookie — no refresh
token pair. This is XSS-resistant (JavaScript cannot read the cookie) and
CSRF-resistant (SameSite blocks cross-origin submission), while keeping the
auth flow simple and auditable for a project of this scope.

**Rate limiting against the Gemini free-tier RPM cap.** Gemini 2.5 Flash's
free tier allows roughly 10 requests per minute. `gemini.service.js` enforces
a self-imposed floor of 7.5 seconds between consecutive calls (~8 RPM) via a
promise-chain serializer: every call appends to a shared queue and only fires
once the previous call's gap has elapsed, regardless of how many submissions
are in flight concurrently. This avoids `429` rate-limit errors entirely
rather than retrying after the fact. As a direct consequence, the maximum
images per submission is capped at **5** — a 5-image batch takes at
most ~37.5 seconds worst case, which is an acceptable, honest trade-off for
free-tier usage rather than risking throttling or ToS-adjacent burst
behavior.

**Resilience against Gemini free-tier instability.** The free tier can also
return malformed JSON or fail intermittently even within the rate limit. The
moderation pipeline catches errors per image, not per submission — a single
failed image falls back to a conservative `flagged` outcome (queued for
human review) rather than crashing the whole batch. The Gemini prompt also
sets `temperature: 0.1` and explicitly forbids markdown fences in the
response, and the service strips any accidental code-fence wrapping before
parsing, to reduce malformed-output retries against the free tier's lower
request budget.

**Gemini called once per image, covering all enabled categories.** Rather
than one API call per category, a single structured prompt asks for a JSON
verdict across every enabled category in one request. This minimizes calls
against Gemini's free tier and ensures all category results for one image
are evaluated from the same model call.

**Images stored on Cloudinary, not local disk.** Uploaded buffers are
streamed directly to Cloudinary (no temp files written to the server) and
only the resulting secure URL + public ID are persisted in MongoDB. This
keeps the backend container stateless and avoids losing images on redeploy,
which would happen with local disk storage on most hosting platforms.

**Admin analytics via MongoDB aggregation pipelines.** All dashboard metrics
(verdict distribution, volume over time, per-category violations, appeal
resolution rate, top users) are computed live with `$group`/`$match` pipelines
on the existing collections — no separate analytics store or batch job.

---

## API Overview

Full route list:

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

POST   /api/submissions
GET    /api/submissions
GET    /api/submissions/:id

GET    /api/images/:id

POST   /api/appeals
GET    /api/appeals/my
GET    /api/appeals/:id

GET    /api/admin/appeals
GET    /api/admin/appeals/:id
PATCH  /api/admin/appeals/:id

GET    /api/admin/policies
PATCH  /api/admin/policies/:category

GET    /api/admin/images
PATCH  /api/admin/images/:id/verdict

GET    /api/admin/analytics/overview
GET    /api/admin/analytics/volume
GET    /api/admin/analytics/categories
GET    /api/admin/analytics/appeals
GET    /api/admin/analytics/users
```

All `/api/admin/*` routes require the authenticated user to have `role: 'admin'`.
