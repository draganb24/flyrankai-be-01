# Task API

A tiny task-tracking API built with **Next.js 16 (App Router)** and **Express**, backed by **Supabase** for authentication. Manage a todo list with full CRUD, protect routes with Supabase-issued JWTs, and document everything with Swagger UI.

This is a learning-oriented backend project: it deliberately keeps the data layer simple (in-memory tasks), while showing real-world auth patterns — server-side JWT verification, a reusable route guard (middleware), and token revocation on logout.

## Features

- **Task CRUD** — create, read, update, delete, list (with `?done` and `?search` filters), plus `/stats` and `/reset`.
- **Supabase authentication** — sign-up, login, and a protected profile/dashboard.
- **Reusable auth guard** — `withAuth` middleware verifies the Bearer JWT against Supabase's Auth server on every request (no trusting locally decoded tokens).
- **Real logout** — `POST /auth/logout` revokes the session via Supabase (`signOut`), invalidating the refresh token.
- **Interactive docs** — Swagger UI served at `/docs`, generated from `openapi.json`.

## Architecture

```
                 ┌─────────────────────────────────────────┐
   HTTP request  │  Express server (server.mjs)            │
 ───────────────►│   /docs            → Swagger UI          │
                 │   /openapi.json    → spec (JSON)         │
                 │   /* (all else)    → Next.js App Router  │
                 └─────────────────────────────────────────┘
                              │
            App Router routes (app/**/route.js)
              • /tasks, /tasks/[id], /stats, /reset   (public/in-memory)
              • /auth/login, /auth/signup              (Supabase auth)
              • /protected/profile, /protected/dashboard (withAuth guard)
              • /auth/logout                            (withAuth + signOut)
                              │
                    app/lib/supabaseClient.js  (anon + service-role clients)
                              │
                         Supabase Auth
```

The Express layer (`server.mjs`) boots Next.js and mounts Swagger UI, then forwards every other path to the Next.js request handler. Routes live under `app/` as standard App Router `route.js` files.

## Prerequisites

- **Node.js** 18.18+ (tested on Node 24)
- A **Supabase** project (free tier is fine) — you only need the Auth service.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables** (see below).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   The API and docs are available at:

   - API:        http://localhost:3000
   - Swagger UI: http://localhost:3000/docs
   - OpenAPI spec: http://localhost:3000/openapi.json

4. **Production build**

   ```bash
   npm run build     # next build
   npm run start     # NODE_ENV=production node server.mjs
   ```

## Environment variables

Copy the example file and fill in your Supabase project values:

```bash
cp .env.example .env
```

| Variable                    | Required | Description                                                                                                                                                                                                        |
|-----------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SUPABASE_URL`              | yes      | Your Supabase project URL, e.g. `https://<project-ref>.supabase.co`. Falls back to `NEXT_PUBLIC_SUPABASE_URL`.                                                                                                     |
| `SUPABASE_KEY`              | yes      | Supabase **anon** public key. Safe to expose to clients. Falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.                                                                                                            |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Supabase **service-role** key. Grants admin privileges — keep it server-side only. When set, the logout route can revoke sessions through the Admin API. When absent, logout still works via the anon client flow. |

`.env` is gitignored (via `.env*`). **Never commit real keys** — only `.env.example` (placeholders) is tracked.

### Where to find the values

In the Supabase dashboard: **Project Settings → API**.
- **Project URL** → `SUPABASE_URL`
- **Project API keys → anon public** → `SUPABASE_KEY`
- **Project API keys → service_role (secret)** → `SUPABASE_SERVICE_ROLE_KEY`

## Authentication

Auth is implemented with Supabase JWTs. The flow:

1. **Sign up / log in** at `POST /auth/signup` or `POST /auth/login` to obtain a JWT access token (and refresh token) from Supabase.
2. **Send the token** as a Bearer header on protected requests:

   ```
   Authorization: Bearer <your-jwt>
   ```

3. **Verification** happens server-side: the `withAuth` guard calls `supabase.auth.getUser(token)`, which validates the token against Supabase's Auth server. Expired or tampered tokens are rejected with `401`.

### Protected routes

| Method | Path                   | Auth     | Description                                                                                             |
|--------|------------------------|----------|---------------------------------------------------------------------------------------------------------|
| GET    | `/protected/profile`   | required | Returns the authenticated user's safe metadata (`id`, `email`, `created_at`).                           |
| GET    | `/protected/dashboard` | required | Greets the authenticated user with their `id` and `email`.                                              |
| POST   | `/auth/logout`         | required | Revokes the session via Supabase (`signOut`), invalidating the refresh token. Returns `204 No Content`. |

### The route guard

`app/lib/authGuard.js` exports `withAuth(handler)`, a wrapper that:
- extracts the Bearer token from the `Authorization` header,
- verifies it with Supabase (`getUser`),
- attaches `request.user` (and `request.tokens`) for the handler,
- returns `401` with `{ "error": "Access token required" }` or `{ "error": "Invalid or expired token" }` if the token is missing/invalid.

Protected routes use it instead of writing auth code inline:

```js
import { withAuth } from '../../lib/authGuard.js';

export const GET = withAuth(async (request) => {
  return Response.json({ user: request.user });
});
```

## Public (unauthenticated) routes

| Method | Path           | Description                                                     |
|--------|----------------|-----------------------------------------------------------------|
| GET    | `/public/info` | Public welcome message.                                         |
| GET    | `/tasks`       | List tasks (supports `?done=true\|false` and `?search=<text>`). |
| POST   | `/tasks`       | Create a task (requires `{ "title": "..." }`).                  |
| GET    | `/tasks/{id}`  | Get one task.                                                   |
| PUT    | `/tasks/{id}`  | Update a task's `title` / `done`.                               |
| DELETE | `/tasks/{id}`  | Delete a task (returns `204`).                                  |
| GET    | `/stats`       | Task counts (`total`, `done`, `open`).                          |
| POST   | `/reset`       | Restore seed tasks.                                             |

> Tasks are stored **in memory** and reset on server restart — this keeps the focus on API/auth mechanics rather than persistence.

## API documentation

Swagger UI is served at **[/docs](http://localhost:3000/docs)** and reads the spec from [`openapi.json`](./openapi.json). Protected endpoints are tagged with the `bearerAuth` security scheme (`http` / `bearer` / `JWT`), so you can authorize directly from the Swagger UI "Authorize" button by pasting a Supabase JWT.

The raw spec is also available at `/openapi.json`.

## Scripts

| Script          | Purpose                                              |
|-----------------|------------------------------------------------------|
| `npm run dev`   | Start the dev server (Next.js dev mode via Express). |
| `npm run build` | Production build (`next build`).                     |
| `npm run start` | Run the production server.                           |
| `npm run lint`  | Lint with ESLint.                                    |

## Project layout

```
server.mjs                      Express + Next.js + Swagger bootstrap
openapi.json                    OpenAPI 3.0.3 spec (served at /docs)
app/
  lib/
    supabaseClient.js           Supabase anon + service-role clients
    authGuard.js                withAuth middleware (reusable guard)
  auth/
    signup/route.js             POST sign-up
    login/route.js              POST login
    logout/route.js             POST logout (revokes session)
  protected/
    profile/route.js            GET profile (guarded)
    dashboard/route.js          GET dashboard (guarded)
  tasks/                        Task CRUD routes (public)
  public/info/route.js          Public info
.env.example                    Placeholder env vars (committed)
```

## Security notes

- **Never commit `.env`.** It is gitignored; only `.env.example` with placeholder values is tracked.
- The **service-role key** bypasses all Row Level Security — keep it strictly server-side and never ship it to the client.
- Logout uses `signOut` with global scope, which revokes the **entire session** (all devices), not just the current token.
- JWT verification is always performed server-side against Supabase — the API never trusts a locally decoded token.
