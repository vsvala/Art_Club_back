# Docker

## Image details

| Detail       | Value                                      |
| ------------ | ------------------------------------------ |
| Base image   | `node:22-alpine`                           |
| Published to | `ghcr.io/vsvala/artclub-backend:latest`    |
| Port         | `3001`                                     |
| Dependencies | Production only (`npm install --omit=dev`) |
| Entrypoint   | `node index.js`                            |

The `docker-publish` CI job bundles the latest frontend build artifact (downloaded from the [Art_Club frontend repo](https://github.com/vsvala/Art_Club)) into the image before pushing, so the single image serves both the API and the React frontend.

## Pull from GHCR

```bash
docker pull ghcr.io/vsvala/artclub-backend:latest
```

## Run from GHCR

```bash
docker run -p 3001:3001 \
  -e MONGODB_URI=<your-mongodb-uri> \
  -e SECRET=<your-jwt-secret> \
  -e CLOUDINARY_CLOUD_NAME=<name> \
  -e CLOUDINARY_API_KEY=<key> \
  -e CLOUDINARY_API_SECRET=<secret> \
  ghcr.io/vsvala/artclub-backend:latest
```

The app will be available at `http://localhost:3001`.

## Build locally

```bash
docker build -t artclub-backend .
docker run -p 3001:3001 \
  -e MONGODB_URI=<your-mongodb-uri> \
  -e SECRET=<your-jwt-secret> \
  artclub-backend
```

## .dockerignore

The following paths are excluded from the image context:

- `node_modules` — reinstalled inside the image
- `coverage` — test artefacts
- `.git` — version control history
- `z_plans` — local planning notes
- `*.md` — documentation files
