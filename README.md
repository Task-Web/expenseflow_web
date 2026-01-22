# ExpenseFlow Web

Cookie-scoped experiment playground built with FastAPI (backend) and Vite + React (frontend). The ExpenseFlow UI is a static multi-page prototype served from `frontend/public/expenseflow`, and the React entry point redirects to `/expenseflow/index.html` while keeping `/state-manage` for state inspection.

## Quick start

Backend (uv):

```bash
cd backend
uv venv
uv pip install -r requirements.txt
uv run uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --host --port 5173
```

Open the frontend at http://localhost:5173. The ExpenseFlow UI redirects to `/expenseflow/index.html` and calls the backend at `http://localhost:8000/api` (overridable via `VITE_API_BASE` or the `expenseflowApiBase` localStorage key for the static pages; localhost defaults to the local backend).

## ExpenseFlow UI
- Static HTML/CSS/JS pages live under `frontend/public/expenseflow`.
- Browser persistence uses localStorage and auto-syncs tracked ExpenseFlow state (drafts + submitted reports) to `/api/state` (see `STATE.md`).
- Attachments in the Review screen use the FastAPI files endpoint (`/api/files`).
- Static ExpenseFlow pages resolve `/api` to a configurable backend (`expenseflowApiBase` localStorage key or `data-api-base` on `<body>`). On localhost/127.0.0.1 they default to `http://localhost:8000/api` unless overridden.

## Docker compose
```bash
docker compose up --build
```
Open http://localhost (nginx reverse proxy). It routes `/api` and `/mcp` to the backend and everything else to the production frontend container.

## Highlights
- Per-user state keyed by cookie; no login required.
- REST endpoints for state lifecycle (`GET/PUT/PATCH/DELETE /api/state`) plus system info and health.
- MCP server (Streamable HTTP) mounted at `/mcp` mirroring the REST operations; accepts `user_cookie` to target a specific state.
- You can pin identity via querystring `?cookie=your-id` on any API call; the backend will also set that as the response cookie.
- ExpenseFlow UI is delivered as static pages under `/expenseflow` and stores drafts locally.
- Auto-generated OpenAPI docs at `/api/docs` and curated `API.md`.
- Extensible patterns documented in `docs/EXTENDING.md`.

## Repository layout
- `backend/`: FastAPI app, config, and state store.
- `frontend/`: Vite + React shell and state console (`/state-manage`).
- `frontend/public/expenseflow/`: ExpenseFlow static pages and assets.
- `docs/`: Guides for extending the backend/frontend and experiments.
- `API.md`: Endpoint reference with examples.
- `STATE.md`: ExpenseFlow local UI state reference.
- `AGENT.md`: Notes for automation/agent integrations.
- `upload-server.js`: Legacy attachment helper (no longer used by default).
- MCP Streamable HTTP endpoint at `/mcp` (tools: `get_state`, `replace_state`, `patch_state`, `reset_state`, `info`).

## Testing
- Backend (uv): `cd backend && uv pip install -r requirements.txt pytest pytest-asyncio httpx && uv run pytest`
- Frontend: recommended stack `vitest` + Testing Library (see `docs/TESTING.md` for setup).

## Environment variables
- `API_PREFIX` (default `/api`)
- `COOKIE_NAME` (default `user_id`)
- `COOKIE_MAX_AGE` (seconds, default 30d)
- `CORS_ORIGINS` (JSON list, default `["http://localhost:5173"]`)
- `DEBUG` (boolean)

Set them in `backend/.env` (see `backend/.env.example`).

## Development tips
- Use `ruff`/`black` (optional) for backend formatting; `eslint`/`prettier` for frontend.
- Keep API shapes in sync with `API.md`; run the app and verify Swagger UI after changes.
- When adding state fields, update the Pydantic models and the frontend preview/editor.
