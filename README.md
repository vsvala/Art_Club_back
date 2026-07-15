# Art Club — Backend API

[![CI/CD Pipeline](https://github.com/vsvala/Art_Club_back/actions/workflows/ci.yml/badge.svg)](https://github.com/vsvala/Art_Club_back/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/vsvala/Art_Club_back/branch/master/graph/badge.svg)](https://codecov.io/gh/vsvala/Art_Club_back)

> This is the **backend** of the Art Club fullstack project.
> Frontend repository: [github.com/vsvala/Art_Club](https://github.com/vsvala/Art_Club)

**Production:** [artclub-q41z.onrender.com](https://artclub-q41z.onrender.com)

Art Club Backend is an authenticated gallery API for managing artworks, user roles, and event content. It combines secure login, image uploads, and role-based access control with a small weather integration endpoint.

The project is a practical portfolio backend for a gallery-style app where artists and admins can create, manage, and publish content. It is most interesting technically because it mixes JWT auth, Cloudinary image handling, and MongoDB-backed access rules in one small service.

REST API Node.js/Express application for the Art Club gallery service. Uses MongoDB as the database and Cloudinary for image storage. Fetches weather data via the Open-Meteo API — geocoding converts a city name to coordinates, which are then used to retrieve the current temperature.

## Highlights

- Full CI/CD pipeline: automated testing, Docker publish, Render deploy, and version tagging
- JWT authentication with role-based access control (member / admin)
- Cloudinary integration for image uploads
- Paginated artwork listing (`GET /api/artworks?page=1&limit=20`) with `total`, `hasMore` metadata
- Health check endpoint with MongoDB connection monitoring
- Third-party API integration: weather proxy via Open-Meteo (geocoding + forecast, no API key required)
- Single Docker image serves both the API and the React frontend
- Centralized error handling — all unexpected errors route through a single `errorHandler` middleware (CastError, ValidationError, TokenExpiredError, LIMIT_FILE_SIZE) with a consistent `{ error: "..." }` JSON fallback and Sentry integration
- Input validation with `express-validator` on all write endpoints (register, password change, profile update, intro, artwork creation, event creation)
- Test suite (Jest), linting (ESLint), and dependency audit on every push
- API reference, architecture diagrams, and security policy in docs/

---

## Technologies

- **Node.js** + **Express** — server
- **MongoDB** + **Mongoose** — database
- **Cloudinary** — cloud image storage
- **JWT** — user authentication
- **bcrypt** — password hashing
- **multer** — file uploads
- **express-validator** — input validation
- **Open-Meteo** — weather data (Geocoding + Forecast API, no API key required)

---

## Installation

```bash
git clone https://github.com/vsvala/Art_Club_back.git
cd Art_Club_back
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/artclub
TEST_MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/artclub_test
PORT=3003
SECRET=<jwt-secret-key>               # generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
TEST_SECRET=<jwt-secret-for-tests>    # can use the same command
CLOUDINARY_CLOUD_NAME=<cloudinary-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
SEED_ADMIN_PASSWORD=<admin-password>
SEED_MEMBER_PASSWORD=<member-password>
```

### Demo access

Demo credentials are available on request for recruiters and reviewers. Please contact me by email for access details.

---

## Running the app

```bash
# Development mode (nodemon, auto-restart)
npm run dev

# Production
npm start

# Tests
npm test

# Seed the database
npm run seed
```

---

## Testing

- Run local tests with `npm test`; Jest runs in `--runInBand` mode.
- Run `npm run test:coverage` to also generate a coverage report in `./coverage/` (open `coverage/lcov-report/index.html` for a browsable breakdown).
- Run lint checks with `npm run lint` before pushing changes.
- Test DB and integration/E2E setup details: [docs/test-database-and-e2e.md](docs/test-database-and-e2e.md).
- Coverage is uploaded to [Codecov](https://codecov.io/gh/vsvala/Art_Club_back) on every CI run — see the badge at the top of this file.
- Testing framework: [Jest](https://jestjs.io/docs/getting-started) — see the official docs for configuration, matchers, and mocking.
- API tests use [Supertest](https://github.com/forwardemail/supertest) to make HTTP requests against the Express app without a running server.

### Running individual tests

`npm test` runs all tests. When writing or debugging, it is often more practical to run only one or a few tests at a time. Jest offers several ways to do this.

**Run only specific tests with `test.only`**

Mark the tests you want to run:

```js
test.only('artworks are returned as json', async () => {
  await api
    .get('/api/artworks')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})
```

Jest will skip all other tests in the same file and run only the ones marked with `.only`. Remember to remove `.only` before committing.

**Run a single test file**

```bash
npm test -- tests/artwork_api.test.js
```

**Run tests by name pattern**

```bash
npm test -- -t "a specific artwork is within the returned artworks"
```

The pattern can match a test name or a `describe` block name, and partial matches work too:

```bash
npm test -- -t "artwork"
```

---

## CI/CD

GitHub Actions runs automatically on pushes and pull requests to `master` with the following pipeline:

| Job                 | Trigger                                           | What it does                                                                                                                                                          |
| ------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci-build-and-test` | every push / PR                                   | installs deps (`npm ci`), runs lint, runs tests with coverage against a local MongoDB service container, uploads coverage to Codecov, runs `npm audit --audit-level=high` |
| `docker-publish`    | push to `master` only (after `ci-build-and-test`) | downloads the frontend build artifact from [Art_Club](https://github.com/vsvala/Art_Club), logs in to GHCR, builds and pushes `ghcr.io/vsvala/artclub-backend:latest` |
| `deploy`            | push to `master` only (not `#skip`)               | triggers a Render deploy hook, then polls `/api/health` every 15 s for up to 20 attempts (5 min total) — fails the job if the server does not respond 200             |
| `tag_release`       | after successful `ci-build-and-test` + `deploy`   | auto-bumps the patch version tag via `anothrNick/github-tag-action`                                                                                                   |

### Health check

`GET /api/health` — returns HTTP 200 when the server is running and MongoDB is connected:

```json
{ "status": "ok", "db": "connected", "uptime": 42 }
```

If MongoDB is not connected, returns HTTP 503:

```json
{ "status": "error", "db": "disconnected" }
```

Quick test in terminal:

```bash
curl http://localhost:3003/api/health
```

### Logging

All request and error logging goes through `utils/logger.js` (wraps `console.log`/`console.error`, silent during tests).

Every HTTP request is logged by `requestLogger` middleware with method, path, status code, and response time:

```
GET /api/artworks 200 43ms
```

Password fields (`password`, `oldPassword`, `newPassword`) are masked in logs (`***`) so credentials never appear in plaintext. Errors flow through a centralized `errorHandler` middleware, which logs with `logger.error` and returns a consistent `{ error: "..." }` JSON response. Route handlers call `next(error)` — they do not log or respond directly. Unsupported file upload types are logged as errors.

### Pipeline flow

```
push to master
      │
      ▼
ci-build-and-test  ──────────────────────────────────────────────┐
      │                                                           │
      ├──► docker-publish  →  ghcr.io/vsvala/artclub-backend:latest
      │
      └──► deploy  →  Render  →  health check /api/health
                │
                ▼
           tag_release  →  auto-bump patch version tag
```

`docker-publish` runs once `ci-build-and-test` passes. `deploy` waits for both `ci-build-and-test` **and** `docker-publish` to succeed.
`tag_release` waits for both `ci-build-and-test` **and** `deploy` to succeed.

### Rollback

If a deploy fails the health check, the pipeline stops and `tag_release` is skipped. To roll back manually:

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Open the service → **Deploys** tab
3. Find the last successful deploy and click **"Rollback to this deploy"**

---

## Docker

The backend is packaged as a Docker image (`node:22-alpine`) and published automatically to `ghcr.io/vsvala/artclub-backend:latest` on every successful push to `master`. The CI pipeline bundles the latest frontend build into the image, so a single container serves both the API and the React app.

For build commands, run instructions, and image details, see [docs/docker.md](docs/docker.md).

---

## Architecture

```mermaid
graph TD
    Frontend["Frontend (React)"] --> API["Backend (Express / Node.js)"]
    API --> MongoDB[("MongoDB Atlas")]
    API --> Cloudinary["Cloudinary"]
```

Requests flow from the frontend into the Express API. Controllers handle only HTTP concerns (parsing, response); business logic lives in a dedicated service layer (`services/`). Services coordinate database access and Cloudinary side-effects, and never receive `req`/`res` objects. Weather data is proxied through the same backend so the frontend talks to one consistent API surface.

For the fuller set of flow diagrams and model notes, see [docs/architecture.md](docs/architecture.md).

---

## Scalability

### Connection pooling

Mongoose uses the MongoDB Node.js driver under the hood, which maintains a **connection pool** automatically when you call `mongoose.connect()`. A pool is a set of pre-opened database connections that are reused across requests — instead of opening and closing a connection on every query (slow), the app borrows a connection from the pool, uses it, and returns it.

**Default behaviour in this project (`app.js`):**

```js
mongoose.connect(config.MONGODB_URI); // creates a pool automatically
```

The MongoDB Node.js driver defaults are:

| Option                     | Default | Description                     |
| -------------------------- | ------- | ------------------------------- |
| `maxPoolSize`              | **100** | Max simultaneous connections    |
| `minPoolSize`              | `0`     | No idle connections kept alive  |
| `serverSelectionTimeoutMS` | `30000` | Timeout if no server found (ms) |

Source: [MongoDB Node.js driver — Connection options](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/)

For most small-to-medium apps the defaults are fine. If needed, override in `app.js`:

```js
mongoose.connect(config.MONGODB_URI, {
  maxPoolSize: 10, // cap connections for a small server
  minPoolSize: 2, // keep 2 warm so first requests are fast
  serverSelectionTimeoutMS: 5000,
});
```

### Database indexes

Explicit indexes are defined on frequently queried fields so MongoDB can resolve queries with an index scan instead of a full collection scan as the dataset grows.

| Collection | Field      | Index type | Why                                                    |
| ---------- | ---------- | ---------- | ------------------------------------------------------ |
| `artworks` | `user`     | ascending  | Filter artworks by owner (current and future queries)  |
| `artworks` | `artist`   | ascending  | Search/filter by artist name                           |
| `users`    | `role`     | ascending  | Role-based access filtering                            |
| `users`    | `username` | unique     | Login lookup — created automatically by `unique: true` |

`_id` is always indexed by MongoDB automatically.

Indexes are defined in the Mongoose schemas (`index: true` / `unique: true`) in `models/artwork.js` and `models/user.js`. Mongoose applies them on startup. To verify in the MongoDB shell:

```js
db.artworks.getIndexes();
db.users.getIndexes();
```

---

### HTTP Cache-Control headers

All GET endpoints return explicit `Cache-Control` headers so browsers and CDN proxies know what they can safely cache.

| Endpoint                    | Header                | Reason                                               |
| --------------------------- | --------------------- | ---------------------------------------------------- |
| `GET /api/artworks`         | `public, max-age=300` | Public data, same for all users                      |
| `GET /api/artworks/:id`     | `public, max-age=300` | Public data, same for all users                      |
| `GET /api/users/artists`    | `public, max-age=300` | Public data, same for all users                      |
| `GET /api/users/artist/:id` | `public, max-age=300` | Public data, same for all users                      |
| `GET /api/events`           | `private, no-cache`   | Requires login                                       |
| `GET /api/users/mypage`     | `private, no-cache`   | Returns the caller's own profile                     |
| `GET /api/users/`           | `private, no-cache`   | Admin-only, sensitive data                           |
| `GET /api/users/admin/:id`  | `private, no-cache`   | Auth-required, sensitive data                        |
| `GET /api/weather`          | `public, max-age=300` | External API — cached 5 min to reduce upstream calls |

**`public, max-age=300`** — the browser (and any CDN in front of the API) may serve a cached copy for up to 5 minutes without hitting the server.

**`private, no-cache`** — only the end-user's own browser may store the response, and it must revalidate with the server before reusing it. This prevents shared caches from accidentally serving one user's data to another.

---

## Authentication

The API uses **JWT Bearer tokens**. After login, the token must be sent with every protected request in the Authorization header:

```
Authorization: Bearer <token>
```

### Roles

| Role     | Permissions               |
| -------- | ------------------------- |
| `member` | Authenticated user routes |
| `admin`  | All routes                |

---

## API documentation

The detailed endpoint reference, request/response examples, multipart payloads, weather flow, and data model notes are available in [docs/api.md](docs/api.md).

At a glance, this API covers authentication, user management, artwork CRUD and image uploads, weather proxying, and admin-managed events.

Authentication uses JWT Bearer tokens, and access is further controlled with role-based checks for `member` and `admin` flows.

---

## Security

See [SECURITY.md](.github/SECURITY.md) for the reporting policy.

Maintenance notes, audit commands, and dependency caveats live in [docs/security-notes.md](docs/security-notes.md).

Detailed architecture diagrams and flow notes are available in [docs/architecture.md](docs/architecture.md).

### Rate limiting

The API uses [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) to protect against abuse and unintended load spikes. Limits are enforced per IP address.

| Limiter           | Route                     | Limit           |
| ----------------- | ------------------------- | --------------- |
| `apiLimiter`      | All `GET /api/*` routes   | 100 req / min   |
| `loginLimiter`    | `POST /api/login`         | 10 req / 15 min |
| `registerLimiter` | `POST /api/users`         | 10 req / 1 h    |
| `passwordLimiter` | `PUT /api/users/password` | 5 req / 15 min  |

When a limit is exceeded the API returns `429 Too Many Requests` with a JSON body:

```json
{ "error": "Too many requests, please try again later" }
```

Limiters are defined in `utils/limiters.js` and applied in `app.js`.

---

### HTTP security headers (Helmet)

The API uses [Helmet](https://helmetjs.github.io/) to set HTTP security headers on every response. Helmet is applied as the first middleware so headers are present on all routes including errors.

Key headers set by Helmet:

| Header                      | Protection                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `Content-Security-Policy`   | Restricts which scripts, styles, and resources the browser may load — mitigates XSS |
| `X-Frame-Options`           | Prevents the page from being embedded in an iframe — mitigates clickjacking         |
| `Strict-Transport-Security` | Instructs the browser to use HTTPS only                                             |
| `X-Content-Type-Options`    | Prevents the browser from guessing the content type                                 |
| `Referrer-Policy`           | Controls how much referrer information is sent to other sites                       |

To verify the headers locally:

```bash
curl -I http://localhost:3003/api/health
```

To audit the production deployment use [securityheaders.com](https://securityheaders.com).

---

## Sentry error tracking

This backend uses [Sentry](https://sentry.io) for production error visibility.

### Setup

1. Create a Node.js project in Sentry and copy the DSN.
2. Add the DSN to your environment variables:

```env
SENTRY_DSN=https://<key>@<org>.ingest.de.sentry.io/<project-id>
```

3. Install the SDK:

```bash
npm install @sentry/node --save
```

4. Initialize Sentry early in the app startup flow via [instrument.js](instrument.js) and import it first in [index.js](index.js).
5. Register the Express error handler in [app.js](app.js) after all routes and before the custom error middleware.

### Verify

For a temporary test, add a route like this in [app.js](app.js):

```js
app.get("/debug-sentry", (req, res) => {
  throw new Error("My first Sentry error!");
});
```

Then open `http://localhost:3003/debug-sentry` and confirm the event appears in the Sentry dashboard.

### Notes

- Keep the test route only while verifying the integration.
- `NODE_ENV=production` is recommended for deployed environments.
- The backend does not need frontend source maps; those are only relevant for browser bundles.

---

## Future improvements

### High priority

- **Token refresh** — implement refresh token pattern so users stay logged in securely beyond the current 10 h JWT expiry

### Production readiness

- Add audit logging for admin actions and security-relevant events (role changes, user deletions)
- Migrate JWT from `localStorage` to `httpOnly` cookies (see section below)

### JWT storage

JWT tokens are currently stored in `localStorage`, which is accessible to JavaScript and therefore vulnerable to XSS attacks. A more secure alternative is to use `httpOnly` cookies, which cannot be read by JavaScript at all.

Migrating to cookie-based auth requires changes on both sides: the backend would set and read the token via a cookie instead of the `Authorization` header, and the frontend would stop managing the token manually. This is a larger refactor and has been left as a future improvement.
