# Phase 1: Planning Documents

---

## A. Functional Requirement Document (FRD)

### Core Features

| Feature | Description |
|---|---|
| Authentication | Register/login with JWT. Tokens stored client-side, sent via `Authorization: Bearer`. |
| Project Management | Create, read, update, delete projects. Owner-based access control. |
| Member Management | Project owner can add members by user ID. |
| Task Management | CRUD on tasks per project. Tasks have title, description, status, priority, assignee. |
| Real-Time Board | Task create/update/delete broadcasts instantly to all users viewing the same project via Socket.IO. |
| Drag-and-Drop | Move tasks across columns (Todo → In Progress → Done) visually. |

### User Roles & Permissions

| Action | Admin | Member (owner of project) | Member (non-owner) |
|---|---|---|---|
| Create project | ✓ | ✓ | ✓ |
| Delete/update project | ✓ | ✓ (own only) | ✗ |
| Add project members | ✓ | ✓ (own only) | ✗ |
| Create task | ✓ | ✓ | ✓ (if project member) |
| Update/delete task | ✓ | ✓ | ✓ (if project member) |
| View project/tasks | ✓ | ✓ | ✓ (if project member) |

> **Note:** "Member" is the default role. The `admin` role is assigned manually in DB for now; admin panel is out of scope.

### Assumptions

1. Single-tenant system — all users are employees of the same company.
2. Emails are unique identifiers; no email verification needed for this version.
3. File attachments on tasks are out of scope.
4. Notifications (email/push) are out of scope; real-time socket updates suffice.
5. Task ordering within columns is chronological (newest first); no manual reordering.
6. Redis is used primarily for Socket.IO multi-instance pub/sub, not as primary data cache.

### Out-of-Scope Items

- Email notifications
- File/image attachments on tasks
- Comments on tasks
- Activity/audit log
- Admin dashboard
- Mobile native app
- Time tracking
- Gantt / calendar view
- Billing / multi-tenancy

---

## B. System Design

### High-Level Architecture

```
Browser (React + Zustand)
        │
        ├─── HTTPS REST ──► Nginx Reverse Proxy ──► Node.js/Express (port 5000)
        │                                                    │
        └─── WSS (Socket.IO) ──────────────────────►        │
                                                    ├─── MongoDB (data persistence)
                                                    └─── Redis  (Socket.IO pub/sub adapter)
```

**Why this architecture?**

- **Nginx as reverse proxy**: single entry point, handles SSL termination, serves frontend static files, proxies `/api` and `/socket.io` to the Node.js process. Decouples web server from app server.
- **Redis adapter for Socket.IO**: if we horizontally scale to 2+ Node.js instances, socket events emitted by instance A must reach clients connected to instance B. Redis pub/sub solves this transparently.
- **MongoDB**: document model fits projects/tasks naturally (embedded or referenced). Flexible schema for iterating quickly. Mongoose provides schema validation.
- **Stateless JWT**: no session store needed. Token carries user identity; server only needs `JWT_SECRET` to verify.

### API List

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, receive JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/projects` | Yes | List projects user is part of |
| POST | `/api/projects` | Yes | Create project |
| GET | `/api/projects/:id` | Yes | Get project detail + members |
| PUT | `/api/projects/:id` | Yes | Update project (owner only) |
| DELETE | `/api/projects/:id` | Yes | Delete project (owner only) |
| POST | `/api/projects/:id/members` | Yes | Add member to project |
| GET | `/api/projects/:projectId/tasks` | Yes | Get all tasks for project |
| POST | `/api/projects/:projectId/tasks` | Yes | Create task |
| PUT | `/api/projects/:projectId/tasks/:taskId` | Yes | Update task (status, priority, etc.) |
| DELETE | `/api/projects/:projectId/tasks/:taskId` | Yes | Delete task |
| GET | `/health` | No | Health check |

### Database Schema

**Users collection**
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hash),
  role: "admin" | "member",
  createdAt, updatedAt
}
```

**Projects collection**
```
{
  _id: ObjectId,
  name: String,
  description: String,
  owner: ObjectId → User,
  members: [ObjectId → User],
  status: "active" | "archived",
  createdAt, updatedAt
}
Indexes: { owner: 1 }, { members: 1 }
```

**Tasks collection**
```
{
  _id: ObjectId,
  title: String,
  description: String,
  status: "todo" | "in-progress" | "done",
  priority: "low" | "medium" | "high",
  project: ObjectId → Project,
  assignee: ObjectId → User (nullable),
  createdBy: ObjectId → User,
  createdAt, updatedAt
}
Index: { project: 1, status: 1 }
```

### Real-Time Communication Strategy

**Socket.IO rooms per project:**

1. Client authenticates socket connection using the JWT in `socket.handshake.auth.token` (verified server-side in Socket.IO middleware before any event is processed).
2. Client emits `join-project <projectId>` → server calls `socket.join(projectId)`.
3. When any user triggers a task mutation via REST API, the controller calls `io.to(projectId).emit('task:created' | 'task:updated' | 'task:deleted', payload)`.
4. All sockets in that project room (across all server instances, via Redis adapter) receive the event and update their local Zustand store without HTTP refetch.

**Why rooms over broadcast-all?** Scoped to the project, so users viewing different projects don't receive irrelevant events.

**Why REST for mutations + Socket for notifications?** REST gives us proper HTTP status codes, validation error responses, and idempotency. Socket is used only for push — the source-of-truth is always MongoDB.

### State Management Choice: Zustand

**Chosen over Redux because:**
- Zero boilerplate — no actions/reducers/selectors ceremony
- Built-in `persist` middleware covers token storage
- Direct state mutation is intuitive and readable
- For 3 domain slices (auth, projects, tasks), Redux would add 3× the file count with no real benefit
- Zustand bundle size: ~1 kB vs Redux Toolkit ~40 kB

### Scalability Considerations

| Concern | Current solution | Path to scale |
|---|---|---|
| Multiple backend instances | Redis Socket.IO adapter | Already in place; add more Node processes behind Nginx upstream |
| Database reads | Mongoose indexes on `project`, `members`, `status` | Add MongoDB Atlas search or Redis cache for hot queries |
| Auth | Stateless JWT | No change needed; add refresh-token rotation if TTL is reduced |
| Frontend | Static files via Nginx | CDN (Cloudflare) in front of Nginx |
| Task history | Not implemented | Add an `AuditLog` collection with change events |
