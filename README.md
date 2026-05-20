# Team Task Manager

Production-style full-stack app for managing team projects and tasks with **JWT auth**, **MongoDB**, and **role-based access** (Admin / Member). Built for portfolios and placement-ready demos.

## Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router |
| Backend  | Node.js 18+, Express, Mongoose                    |
| Auth     | JWT (stored in `localStorage`)                   |

## Features

- **Auth**: signup / login, bcrypt password hashing, protected routes
- **RBAC**: Admins create projects, manage members, create/delete tasks; members see assigned work and update task status
- **Projects**: user-scoped list, detail page, member search + invite (admin)
- **Tasks**: title, description, status (`todo` \| `in-progress` \| `done`), due date, assignee, search + status filter, pagination-ready API
- **Dashboard**: totals, completed, pending, **overdue** (due &lt; today and not done)
- **UI**: sidebar layout, responsive, toasts, loading states, **dark mode**, optional **Kanban** drag-and-drop

## Repository layout

```text
backend/     # Express API (Railway)
frontend/    # Vite SPA (Vercel)
package.json # Optional root: `npm run dev` runs API + web
```

## Prerequisites

- Node.js **18+**
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

## Quick start (local)

### 1. MongoDB

Start MongoDB locally or copy an Atlas connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET

npm install
npm run dev
```

API defaults to **http://localhost:5001** (5001 avoids macOS AirPlay using port 5000). Health check: `GET /api/health`.

**First admin** (promotes/creates user with `role: admin`):

```bash
# In backend/.env set:
# ADMIN_EMAIL=you@company.com
# ADMIN_PASSWORD=SecurePass123
# ADMIN_NAME=Admin

npm run seed:admin
```

Public signup always creates **member** accounts.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Optional: VITE_API_URL=http://localhost:5001 (or leave unset — Vite proxies /api)

npm install
npm run dev
```

App: **http://localhost:5173**. The Vite dev server proxies `/api` to the backend.

### 4. Run both from repo root (optional)

```bash
npm install          # installs concurrently
npm run install:all  # installs backend + frontend deps
npm run dev          # API + web together
```

## Environment variables

### `backend/.env`

| Variable       | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `PORT`         | Server port (Railway sets this automatically)            |
| `MONGODB_URI`  | Mongo connection string                                   |
| `JWT_SECRET`   | Strong secret for signing tokens                          |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`)                             |
| `CORS_ORIGIN`  | Allowed browser origins, comma-separated                  |

### `frontend` (Vercel / `.env.local`)

| Variable       | Description                                      |
| -------------- | ------------------------------------------------ |
| `VITE_API_URL` | Backend base URL (e.g. `https://your-api.up.railway.app`). Leave empty in dev if using Vite proxy. |

## Deployment

### Railway (API)

1. New project → deploy from GitHub (or CLI), root directory **`backend`**.
2. Add **MongoDB** plugin or set `MONGODB_URI`.
3. Variables: `JWT_SECRET`, `CORS_ORIGIN` (your Vercel URL(s)).

### Vercel (frontend)

1. Import repo, root directory **`frontend`**.
2. Set `VITE_API_URL` to your Railway API URL (no trailing slash).

## API overview

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/auth/register` | Creates **member** |
| POST | `/api/auth/login` | Returns JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Stats + recent tasks |
| GET | `/api/users/search?q=` | Admin: search users to invite |
| CRUD | `/api/projects` | Create admin-only; list scoped to membership |
| CRUD | `/api/projects/:projectId/tasks` | Create/delete admin; update per RBAC |

Full validation uses **express-validator** on the server; forms validate on the client before submit.

## Scripts

| Command | Where | Purpose |
| ------- | ----- | ------- |
| `npm run dev` | `backend` | API with `node --watch` |
| `npm run start` | `backend` | Production server |
| `npm run seed:admin` | `backend` | Create/promote admin |
| `npm run dev` | `frontend` | Vite dev server |
| `npm run build` | `frontend` | Production build |

## License

MIT — use freely in interviews and portfolios.
