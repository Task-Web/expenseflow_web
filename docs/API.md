# API Reference

Base path: `/api`

All endpoints assume cookie-based user identification. A new `user_id` cookie is issued on first request. Include credentials on cross-site calls.

## Health
- `GET /health` — simple liveness probe. Response: `{"status":"ok"}`.

## State
- `GET /state` — fetch current state for this cookie.
  - Response `200`: `{ "user_id": "uuid", "state": { "meta": {...}, "data": {...}, "note": "..." } }`
- `PUT /state` — replace the entire state payload.
  - Body: `{ "data": { ... }, "note": "optional string", "meta": { ... } }`
  - Response: same shape as GET.
- `PATCH /state` — deep-merge into the existing `data` field.
  - Body: `{ "data": { ... }, "note": "optional string" }`
  - Response: merged state.
- `DELETE /state` — reset state to a new blank object and fresh metadata.
  - Also deletes stored files for the current user.
  - Response: `{ "user_id": "...", "state": { "meta": {...}, "data": {}, "note": null } }`

Notes:
- `meta.version` increments on patch/merge operations; resets on replace/reset.
- `meta.created_at` and `updated_at` are UTC ISO timestamps.
- Default state includes an example Hugging Face file URL under `data.examples.huggingface_file`.
- File uploads now live in backend storage and are referenced by URL under `data.uploads`.
- Legacy base64 uploads under `data.uploads[].content_base64` still render.
- The ExpenseFlow UI syncs submitted reports to `data.expenseflow.submitted_expense_reports` (excluding the default report `ER-2025-1106-001`).
- The ExpenseFlow UI resolves `/api` to a configurable backend (`expenseflowApiBase` localStorage key or `data-api-base` on `<body>`); localhost defaults to `http://localhost:8000/api` unless overridden.

## Files
- `POST /files` — upload up to four `.doc` or `.docx` files (multipart form, field name `files`).
  - Response `200`: `[{ "id": "...", "name": "report.pdf", "size": 123, "type": "application/pdf", "url": "/api/files/<stored>", "filename": "<stored>" }]`
  - Response `400`: returned when more than four files are provided or any file is not `.doc`/`.docx`.
- `GET /files` — list files for the current user.
  - Response `200`: same array shape as upload response.
- `GET /files/{filename}` — fetch a file scoped to the current cookie.
  - Response `200`: binary file response.
- `DELETE /files/{filename}` — delete a file scoped to the current cookie.
  - Response `204`: no content.

## Required interface
Any site built on `basesite` must keep the `/state-manage` interface with both the documentation
tab and the live editor tab. This page is the canonical place to inspect and update per-user state
and must not be removed.

## Info
- `GET /info` — return runtime and request context for debugging.
  - Response example:
    ```json
    {
      "app_name": "Base Experiment Backend",
      "python_version": "3.11.7",
      "env": { "python_version": "3.11.7", "platform": "Linux-...", "env_mode": "dev" },
      "request": { "client": "127.0.0.1", "headers": {...}, "path": "/api/info", "method": "GET", "user_id": "..." }
    }
    ```

## Usage examples

`curl` (remember cookies):
```bash
curl -i -c cookies.txt http://localhost:8000/api/state
curl -b cookies.txt -X PATCH http://localhost:8000/api/state \
  -H "Content-Type: application/json" \
  -d '{"data": {"step": 2, "parameters": {"alpha": 0.1}}, "note": "patched via curl"}'
curl -b cookies.txt http://localhost:8000/api/info
curl -b cookies.txt -F "files=@./report.pdf" http://localhost:8000/api/files
```

`httpie`:
```bash
http --print=HBhb GET :8000/api/state
http --print=HBhb PATCH :8000/api/state data:='{"foo": "bar"}'
http DELETE :8000/api/state
```

## Error shape
- HTTP errors return `{ "detail": "message", "request_id": "<uuid>" }`.
- Non-2xx responses keep the `user_id` cookie intact.
