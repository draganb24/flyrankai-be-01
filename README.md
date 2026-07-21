# Task API

A tiny, deliberately small JSON API for managing a to-do list — built with
[Next.js](https://nextjs.org) (App Router) and documented live with Swagger UI.
It exists to teach the shape of an API: routes, HTTP methods, status codes, and
request/response bodies — all in one folder you can read top to bottom.

The whole thing is in-memory (no database): data resets to a 3-item seed list
every time the server restarts. That is on purpose — it keeps the focus on the
API, not persistence.

## What's inside

The code is split into three layers so each file has one job:

- **routes** (`app/**/route.js`) — parse HTTP, map service errors to status codes. Stay thin.
- **service** (`app/lib/services/taskService.js`) — business rules: filtering, stats, and validation. Throws typed errors.
- **repository** (`app/lib/repositories/taskRepository.js`) — the in-memory store and pure CRUD.
- **errors** (`app/lib/errors.js`) — `ValidationError` (→ 400) / `NotFoundError` (→ 404) + HTTP mapper.

| File                                     | Layer      | Purpose                                             |
|------------------------------------------|------------|-----------------------------------------------------|
| `app/tasks/route.js`                     | route      | `GET` (list) and `POST` (create) for `/tasks`       |
| `app/tasks/[id]/route.js`                | route      | `GET` / `PUT` / `DELETE` for a single task          |
| `app/stats/route.js`                     | route      | `GET` task statistics                               |
| `app/reset/route.js`                     | route      | `POST` reset to seed tasks                          |
| `app/lib/services/taskService.js`        | service    | Filtering, stats, validation, orchestration         |
| `app/lib/repositories/taskRepository.js` | repository | In-memory task store and CRUD helpers               |
| `app/lib/errors.js`                      | shared     | Typed errors and the HTTP error mapper              |
| `openapi.json`                           | —          | OpenAPI 3.0 description of every endpoint           |
| `server.mjs`                             | —          | Custom server: Swagger UI at `/docs`, forwards rest |
| `docs/swagger-ui.png`                    | —          | Screenshot of the Swagger UI (see below)            |

## Install & run

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install && npm run dev
```

Then open:

- **API root / health:** http://localhost:3000
- **Swagger UI (interactive docs):** http://localhost:3000/docs
- **Raw OpenAPI spec:** http://localhost:3000/openapi.json

In Swagger UI, click **Try it out** on any endpoint and hit **Execute** — no
`curl` needed. The server, docs, and requests all live on the same origin, so
"Try it out" just works.

> Production build: `npm run build && npm start`.

## Endpoints

Base URL: `http://localhost:3000`

| Method   | Path          | Description                                                                                                                                                                                | Success              | Errors                       |
|----------|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------|------------------------------|
| `GET`    | `/tasks`      | List all tasks. Add `?done=true` (finished only) or `?done=false` (unfinished only) to filter by status, and `?search=milk` for a case-insensitive title substring match. Filters combine. | `200` + JSON array   | —                            |
| `GET`    | `/stats`      | Computed counts: `{ "total", "done", "open" }`                                                                                                                                             | `200` + JSON object  | —                            |
| `POST`   | `/reset`      | Clears all tasks and restores the 3 seed examples                                                                                                                                          | `200` + JSON array   | —                            |
| `POST`   | `/tasks`      | Create a task (body: `{ "title": "string" }`)                                                                                                                                              | `201` + the new task | `400` if title missing/empty |
| `GET`    | `/tasks/{id}` | Get one task by id                                                                                                                                                                         | `200` + the task     | `404` if not found           |
| `PUT`    | `/tasks/{id}` | Update title and/or `done` (`{ "title"?, "done"? }`)                                                                                                                                       | `200` + updated task | `400` / `404`                |
| `DELETE` | `/tasks/{id}` | Delete a task                                                                                                                                                                              | `204` (no body)      | `404` if not found           |

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
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
Date: Sat, 18 Jul 2026 13:50:06 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"id":4,"title":"Try the README example","done":false}
```

## Swagger UI

![Swagger UI for the Task API](docs/swagger-ui.png)

All endpoints are documented in `openapi.json` and rendered as interactive
documentation at `/docs`. The screenshot above shows the full list; each row
expands to show parameters, request body, and every response code.

## Mortality experiment

Create a few tasks, then restart the server and `GET /tasks`: the new tasks are
that is because tasks live in memory
(`app/lib/repositories/taskRepository.js` holds them in a plain array), so they
vanish the moment the process exits — nothing is ever written to a database or file.
