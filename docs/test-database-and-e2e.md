# Test Database and E2E Setup

This project uses an isolated MongoDB test database for backend integration tests.

## Scope and terminology

Current automated tests are backend API integration tests (Jest + Supertest), not full browser E2E tests.
Three test suites exist: `artwork_api.test.js`, `event_api.test.js`, `user_api.test.js`.

## Environment switching

Database selection is controlled by `NODE_ENV` in `utils/config.js`:

- `NODE_ENV=test` → use `TEST_MONGODB_URI`
- otherwise → use `MONGODB_URI`

This keeps test data separate from development and production data.

## Local test database

Define a dedicated test database URI in `.env`:

```env
TEST_MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/artclub_test
```

Run tests with:

```bash
npm test
```

The test script sets `NODE_ENV=test`, so tests automatically connect to `TEST_MONGODB_URI`.

## Test data isolation strategy

Test files reset and recreate data in `beforeEach`.
Typical pattern:

- clear collections (`deleteMany({})`)
- create only the users/documents required by that test file
- perform requests against the real Express app via Supertest

This keeps tests deterministic and independent.

Note: event tests require a user with `role: "admin"` since event endpoints are admin-gated.

## Test-mode guards in the application

When `NODE_ENV=test`, two additional behaviours apply:

**Cloudinary bypass** — artwork upload and delete skip Cloudinary entirely:
- `POST /api/artworks` uses a static placeholder image (`https://placehold.co/100x100.png`) instead of uploading
- `DELETE /api/artworks/:id` skips the Cloudinary delete call

This means tests do not need Cloudinary credentials and run without network calls to the media service.

**Login rate limiter** — `loginLimiter` is active on `POST /api/login` in all environments including test. If a test suite performs many logins in quick succession, the rate limit may trigger.

## `/api/testing` router (E2E helper)

When `NODE_ENV=test`, the app mounts a helper router at `/api/testing`:

| Endpoint | Description |
| --- | --- |
| `POST /api/testing/reset` | Deletes all artworks and users |
| `POST /api/testing/users` | Creates a user (body: `name`, `email`, `username`, `password`, `role`) |
| `POST /api/testing/artworks` | Creates an artwork directly (body: `galleryImage`, `artist`, `name`, `year`, `size`, `medium`, `likes`, `user`) |

`artwork_api.test.js` uses all three endpoints to set up and tear down test state through the HTTP API. The event and user test suites still manipulate the database directly via Mongoose models. The router is also suitable for future browser-level E2E tests (e.g. Playwright or Cypress).

## CI setup

GitHub Actions CI starts a dedicated MongoDB service container and points tests to it:

- Service: `mongo:6`
- URI: `mongodb://localhost:27017/art_club_test`

The CI job exports `TEST_MONGODB_URI` before running `npm test`.

## Running backend manually in test mode

To run the backend against the test database for manual verification:

```bash
npm run start:test
```

Note: port is read from `PORT` (not `TEST_PORT`).
