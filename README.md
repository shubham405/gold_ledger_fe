# GoldLedger — Jewelry Shop UI

React frontend for the [**loan-management**](../loan-management) API — gold/silver pledges, customers, payments, and interest.

## Tech stack

- React 19, TypeScript, Vite
- React Router
- JWT in `localStorage`

## Quick start

```bash
npm install
cp .env.example .env    # set VITE_API_URL to your backend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or your `VITE_DEV_PORT`).

**Prerequisites:** Node.js 18+, backend and PostgreSQL running.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8080/api/v1` |
| `VITE_DEV_PORT` | Dev server port | `5173` |
| `VITE_DEV_HOST` | Bind host (`0.0.0.0` for LAN) | all interfaces |

**LAN testing:** use your machine IP in `VITE_API_URL` (e.g. `http://192.168.1.10:8080/api/v1`) and add the frontend origin to backend `CORS_ALLOWED_ORIGINS`.

API base URL is defined once in `src/config/env.ts`.

## Features

- **Dashboard** — active pledges, overdue alerts, outstanding principal
- **Customers** — borrowers with search and pagination
- **Pledges** — create, filter by status, collateral, payments, interest
- **Auth** — shop register / login (`/register`, `/login`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Deploy on Vercel

1. Import the repo in [Vercel](https://vercel.com).
2. **Root Directory:** `jewelry-loan-ui` (if the repo is the monorepo root, you can also deploy from the root — `vercel.json` at the repo root handles that).
3. **Environment variable:** `VITE_API_URL` = your production API (e.g. `https://your-api.onrender.com/api/v1`).
4. Deploy. **`vercel.json` must be committed and pushed** — Vercel only reads it from Git. Without it, reload on `/borrowers` or `/loans` returns a platform 404.

`vercel.json` rewrites all app routes to `index.html`. The build also copies `index.html` → `404.html` as a fallback. `public/_redirects` covers Netlify/Render static.

## Docker

**UI image** (nginx serves the Vite build):

```bash
docker build -t jewelry-loan-ui \
  --build-arg VITE_API_URL=http://localhost:8080/api/v1 .
docker run --rm -p 5173:80 jewelry-loan-ui
```

`VITE_API_URL` must be reachable from the **browser** (typically `http://localhost:8080/api/v1`, not a Docker internal hostname).

**Full stack (DB + API + UI):** from the parent folder:

```bash
cd ..
cp .env.example .env
docker compose up -d --build
```

## Git

Commit `.env.example`; **do not commit** `.env` (API URL and local settings).  
`node_modules/`, `dist/`, and `.env` are ignored — see `.gitignore`.

## API mapping

| UI | Backend |
|----|---------|
| Auth | `/api/v1/auth/register`, `/login`, `/me` |
| Customers | `/api/v1/borrowers` |
| Pledges | `/api/v1/loans` |
| Collateral | `/api/v1/loans/{id}/collateral` |
| Payments | `/api/v1/loans/{id}/payments` |
| Interest | `/api/v1/loans/{id}/interest` |
