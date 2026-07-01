# Security Notes

These maintenance notes are intentionally kept outside the main README so the portfolio-focused overview stays compact.

## Vulnerability Audit

```bash
# Check PRODUCTION vulnerabilities (most important)
npm audit --omit=dev

# Check everything including dev dependencies
npm audit
```

> `npm audit` also shows vulnerabilities in dev dependencies (jest, eslint) that do not affect production. Always check separately with `--omit=dev`.

## Automatic Fixes

```bash
# Fix safe updates automatically (no breaking changes)
npm audit fix

# Preview what --force would do BEFORE running it
npm audit fix --force --dry-run

# WARNING: --force can cause unexpected downgrades
# Only run if you know what you're doing
npm audit fix --force
```

## Checking for Outdated Packages

```bash
npm outdated
```

| Column | Meaning |
| --- | --- |
| Current | Currently installed version |
| Wanted | Maximum allowed version per package.json |
| Latest | Latest available version on npm |

## Updating Packages

```bash
# Update all packages within allowed ranges (no major bumps)
npm update

# Update a single package to latest
npm install packagename@latest

# Check what is installed
npm ls packagename
```

## Recommended Maintenance Routine

| Interval | Action |
| --- | --- |
| Monthly | `npm audit --omit=dev` — check production vulnerabilities |
| Quarterly | `npm outdated` — consider updates |
| Major updates | Always do in a separate branch, test thoroughly |

## Project-Specific Notes

**`.npmrc` — `legacy-peer-deps=true`**

Required because `multer-storage-cloudinary@4` declares support only for `cloudinary@v1`, even though `cloudinary@v2` works fine. Without this flag, `npm install` fails with a peer dependency error.

**`package.json` — `overrides.tar`**

Forces the `tar` package to the safe v7 version throughout the dependency tree. Reason: the `bcrypt` → `@mapbox/node-pre-gyp` chain otherwise pulls in a vulnerable version of `tar` for which no fix exists in the 6.x line.

**Jest vulnerabilities**

`npm audit` reports ~17 moderate-severity vulnerabilities inside Jest's internal dependencies (`babel-plugin-istanbul` → `js-yaml`). These are known issues and do not affect production. `npm audit --omit=dev` → 0 vulnerabilities.