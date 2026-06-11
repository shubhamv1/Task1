# ProjectHub – Internal Project Management System

Real-time collaborative project & task management tool built with the MERN stack.

---

## Architecture Overview

```
React (Vite + Zustand + Socket.IO client)
        ↕ HTTPS / WSS
Nginx (reverse proxy + SSL termination + static file serving)
        ↕
Node.js + Express + Socket.IO  ←→  Redis (pub/sub adapter)
        ↕
MongoDB
```

- **Frontend**: React 18, Vite, Zustand, Tailwind CSS, Socket.IO client
- **Backend**: Node.js, Express, Mongoose, Socket.IO, JWT auth
- **Infra**: Redis (Socket.IO scaling), MongoDB, Nginx, Docker Compose, GitHub Actions

---

## Design Decisions & Trade-offs

| Decision | Choice | Why |
|---|---|---|
| State management | Zustand | No boilerplate, built-in persist, ~1kB; Redux adds 40kB and 3× files for no benefit at this scale |
| Real-time | Socket.IO rooms | Scoped to project room; REST handles mutations, Socket handles push-only |
| Auth | Stateless JWT | No session store; horizontally scalable without sticky sessions |
| Redis | Socket.IO adapter | Ensures socket events reach clients on any backend instance |
| Folder structure | Service-layer | Controllers stay thin (HTTP in/out); all business logic in services; testable in isolation |

---

## API List

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project detail |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| GET | `/api/projects/:pid/tasks` | List tasks |
| POST | `/api/projects/:pid/tasks` | Create task |
| PUT | `/api/projects/:pid/tasks/:tid` | Update task |
| DELETE | `/api/projects/:pid/tasks/:tid` | Delete task |

---

## Socket Events

| Direction | Event | Payload | Description |
|---|---|---|---|
| Client → Server | `join-project` | `projectId: string` | Subscribe to project room |
| Client → Server | `leave-project` | `projectId: string` | Unsubscribe from project room |
| Server → Client | `task:created` | `Task` object | Broadcast when a task is created |
| Server → Client | `task:updated` | `Task` object | Broadcast when a task is updated |
| Server → Client | `task:deleted` | `{ _id: string }` | Broadcast when a task is deleted |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (or Atlas URI)
- Redis running locally (optional — falls back to in-memory if unavailable)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGODB_URI, JWT_SECRET, etc.
npm install
npm run dev
# → http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### With Docker Compose (MongoDB + Redis only)

```bash
docker-compose up -d mongodb redis
# then run backend and frontend manually as above
```

---

## Deployment Steps

### Using free services (Render + Netlify)

**Backend (Render):**
1. Push repo to GitHub
2. Create new Web Service on Render pointing to `/backend`
3. Set build command: `npm install`, start command: `node server.js`
4. Add all environment variables from `.env.example`

**Frontend (Netlify):**
1. Connect repo to Netlify
2. Base directory: `frontend`, build command: `npm run build`, publish: `dist`
3. Add env vars: `VITE_API_URL=https://your-render-url/api`, `VITE_SOCKET_URL=https://your-render-url`
4. Add `_redirects` file: `/* /index.html 200`

### Using a VM (DigitalOcean / Hetzner / Vultr)

```bash
# On server
git clone <repo> /var/www/project-management
cd /var/www/project-management/backend
npm ci --production
cp .env.example .env && nano .env

# Start with PM2
pm2 start server.js --name project-management-api
pm2 save && pm2 startup

# Nginx
sudo cp nginx/nginx.conf /etc/nginx/sites-available/project-management
sudo ln -s /etc/nginx/sites-available/project-management /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL with Certbot
sudo certbot --nginx -d your-domain.com
```

---

## CI/CD Branching Strategy

- `main` — production; protected; merge via PR only
- `develop` — integration branch; CI runs on push
- `feature/*` — individual features; PR into develop
- `hotfix/*` — urgent fixes; PR directly into main

GitHub Actions runs: lint → build → deploy (backend via SSH, frontend via SCP) on push to `main`.

---

## URLs

| Service | URL |
|---|---|
| Frontend | `https://your-domain.com` |
| Backend API | `https://your-domain.com/api` |
| Health check | `https://your-domain.com/api/health` (returns `{"status":"ok"}`) |

---

## AI Usage Declaration

This project was built with AI assistance (Claude Code). All code has been reviewed and can be explained line-by-line. Key areas to understand before the Loom video:

- `socketHandler.js` — JWT middleware in Socket.IO, Redis adapter fallback, room-based broadcasting
- `taskController.js` — how `getIO().to(projectId).emit(...)` ties REST mutations to real-time push
- `taskStore.js` — `applySocket*` methods that update Zustand state from socket events without HTTP
- `api.js` interceptors — automatic token injection and 401 redirect
