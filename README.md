# Task API

A tiny, deliberately small JSON API for managing a to-do list — built with
[Next.js](https://nextjs.org) (App Router) and documented live with Swagger UI.
It exists to teach the shape of an API: routes, HTTP methods, status codes, and
request/response bodies — and the shape of a **real backend**: a database that
runs as its own program, with code split into layers.

The data lives in a **Postgres** database, reached through the
[`pg`](https://node-postgres.com) driver by a connection string in `DATABASE_URL`.
On first start the app creates the `tasks` table if it's missing and seeds three
example rows **only when the table is empty** — so state survives a restart and a
fresh clone comes up with data. Every SQL statement lives in the repository
layer; routes and services never touch the database directly.

## What's inside (layered architecture)

The code is split into three layers so each file has one job:

- **routes** (`app/**/route.js`) — parse HTTP, validate params, map service
  errors to status codes. Stay thin.
- **service** (`app/lib/services/taskService.js`) — business rules and
  validation. Throws typed errors (`ValidationError` → 400, `NotFoundError` →
  404).
- **repository** (`app/lib/repositories/taskRepository.js`) — the Postgres store
  and pure CRUD. Every `SELECT` / `INSERT` / `UPDATE` / `DELETE` lives here, all
  parameterized (`$1`, `$2`, …).

| File                                     | Layer      | Purpose                                       |
|------------------------------------------|------------|-----------------------------------------------|
| `app/tasks/route.js`                     | route      | `GET` (list) and `POST` (create) for `/tasks` |
| `app/tasks/[id]/route.js`                | route      | `GET` / `PUT` / `DELETE` for a single task    |
| `app/stats/route.js`                     | route      | `GET` task statistics                         |
| `app/reset/route.js`                     | route      | `POST` reset to the three seed tasks          |
| `app/lib/services/taskService.js`        | service    | Validation, orchestration, typing             |
| `app/lib/repositories/taskRepository.js` | repository | Postgres store and CRUD (all SQL here)        |
| `app/lib/errors.js`                      | shared     | Typed errors and the HTTP error mapper        |
| `server.mjs`                             | —          | Custom server: Swagger UI at `/docs`          |
| `Dockerfile`, `compose.yaml`             | —          | Run the whole thing in containers             |

## Run everything (one command)

With [Docker](https://www.docker.com) installed, this boots the API **and** a
Postgres database together — no manual database setup:

```bash
docker compose up
```

- API: http://localhost:3000
- Swagger UI (interactive docs): http://localhost:3000/docs
- Raw OpenAPI spec: http://localhost:3000/openapi.json

The `api` service builds from the `Dockerfile`; the `db` service is the official
`postgres` image with a named volume (`taskdata`) so data survives restarts.
Inside the compose network the app reaches the database by the service name
`db` (`postgres://postgres:dev@db:5432/tasks`) — not `localhost`.

### Without Docker (local Postgres)

If you already run Postgres yourself, set `DATABASE_URL` in a git-ignored
`.env` and start the app:

```bash
npm install
npm run dev          # http://localhost:3000
```

## Variables to set

Copy the template and fill in your database URL:

```bash
cp .env.example .env
# then edit .env so DATABASE_URL points at your Postgres instance
```

| Variable       | Where it's read         | Example                                        |
|----------------|-------------------------|------------------------------------------------|
| `DATABASE_URL` | repository (at startup) | `postgres://postgres:dev@localhost:5432/tasks` |

`.env` is **git-ignored** — never commit a real password. `.env.example` is
committed and contains no secret, only the shape. A leaked database credential
is a real incident; keep yours local.

<img width="1920" height="1080" alt="Screenshot (209)" src="https://github.com/user-attachments/assets/33c0fba4-183e-423f-a850-04843fdd326f" />


## Endpoints

Base URL: `http://localhost:3000`

| Method   | Path          | Description                             | Success              | Errors                       |
|----------|---------------|-----------------------------------------|----------------------|------------------------------|
| `GET`    | `/tasks`      | List all tasks (`SELECT * FROM tasks`)  | `200` + JSON array   | —                            |
| `GET`    | `/stats`      | Counts: `{ "total", "done", "open" }`   | `200` + JSON object  | —                            |
| `POST`   | `/reset`      | Clear and restore the 3 seed tasks      | `200` + JSON array   | —                            |
| `POST`   | `/tasks`      | Create a task (`{ "title": "string" }`) | `201` + the new task | `400` if title missing/empty |
| `GET`    | `/tasks/{id}` | Get one task by id                      | `200` + the task     | `404` if not found           |
| `PUT`    | `/tasks/{id}` | Update title and/or `done`              | `200` + updated task | `400` / `404`                |
| `DELETE` | `/tasks/{id}` | Delete a task                           | `204` (no body)      | `404` if not found           |

### Task shape

```json
{ "id": 1, "title": "Learn what an API is", "done": true }
```

### Example: create a task

```bash
curl -i -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Try the README example"}'
```

```http
HTTP/1.1 201 Created
X-Powered-By: Express
content-type: application/json
Date: Sat, 25 Jul 2026 12:07:54 GMT
Connection: keep-alive
Transfer-Encoding: chunked

{"id":6,"title":"Try the README example","done":false}
```

## Swagger UI

![Swagger UI for the Task API](docs/swagger-ui.png)

All endpoints are documented in `openapi.json` and rendered as interactive
documentation at `/docs`. Click **Try it out** on any endpoint and hit
**Execute** — no `curl` needed.

## Explore the database directly

The API is a thin window onto a Postgres table. There is no in-memory copy and
no "syncing" — the API runs `SELECT * FROM tasks` on every request, so any
other client sees the exact same rows.

With the compose database running, open a SQL prompt:

```bash
docker compose exec db psql -U postgres -d tasks
```

```sql
SELECT * FROM tasks;
-- the rows the API serves, straight from Postgres

SELECT * FROM tasks WHERE done = true;
-- only the completed tasks
```

**Try the round-trip:** in `psql`, run `UPDATE tasks SET done = true;` (or
insert/delete a row), then call `GET /tasks` from the API. The change shows up
immediately — no server restart — because the server queries the database on
every request; it never caches the table in memory.

## Persistence, not mortality

Create a few tasks, stop the stack (`docker compose down` without `-v`), restart
it (`docker compose up`), and `GET /tasks` — the tasks are still there, because
the `taskdata` volume outlives the container. That's the whole point: the
repository writes every change to Postgres, so state out-lives the process. Every
serious backend on Earth is this idea, wearing more clothes.
