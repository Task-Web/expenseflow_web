import mimetypes
import os
import platform
import re
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Literal, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from mcp.server.fastmcp import FastMCP

from .config import Settings, get_settings
from .file_store import FileStore
from .schemas import (
    ExpenseAllocationRequest,
    ExpenseApproverRequest,
    ExpenseAttachmentRequest,
    ExpenseHeaderRequest,
    ExpenseLineRequest,
    ExpensePreferencesRequest,
    FileMetadata,
    InfoResponse,
    PerDiemLineRequest,
    StatePatchRequest,
    StateRequest,
    StateResponse,
    SubmittedExpenseReportRequest,
)
from .state_store import StateStore

settings = get_settings()
store = StateStore()
file_store = FileStore("files", settings.api_prefix)

tags_metadata = [
    {"name": "files", "description": "Upload and fetch files scoped to a user cookie"},
    {"name": "system", "description": "Environment and health information"},
]


def _resolve_user_cookie(provided: Optional[str]) -> str:
    return provided if provided else str(uuid.uuid4())


def _set_user_cookie(response: Response, user_id: str, settings: Settings) -> None:
    response.set_cookie(
        settings.cookie_name,
        user_id,
        max_age=settings.cookie_max_age,
        httponly=False,
        samesite="lax",
    )


# MCP server mirrors REST API operations via Streamable HTTP
mcp_server = FastMCP(
    name=f"{settings.app_name} MCP",
    instructions=(
        "Streamable HTTP MCP interface mirroring the REST API. "
        "Supply user_cookie to reuse the same per-user state; "
        "omit to generate a new cookie-backed state."
    ),
    host="0.0.0.0",
    streamable_http_path="/",
)

mcp_http_app = mcp_server.streamable_http_app()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start MCP session manager so Streamable HTTP transport works when mounted
    mcp_ctx = mcp_server.session_manager.run()
    await mcp_ctx.__aenter__()
    try:
        yield
    finally:
        await mcp_ctx.__aexit__(None, None, None)


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    openapi_tags=tags_metadata,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_user_id(
    request: Request, response: Response, settings: Settings = Depends(get_settings)
) -> str:
    cookie_override = request.query_params.get("cookie")
    user_id = cookie_override or request.cookies.get(settings.cookie_name)
    if not user_id:
        user_id = str(uuid.uuid4())
    _set_user_cookie(response, user_id, settings)
    return user_id


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    # Minimal middleware that ensures each response carries a request id header.
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    response: JSONResponse = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.get("/health", tags=["system"])
async def health() -> Dict[str, str]:
    return {"status": "ok"}


# when build on the basesite, the below endpoints about state management should remain unchanged
@app.get(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    include_in_schema=False,
)
async def get_state(user_id: str = Depends(get_user_id)) -> StateResponse:
    state = await store.get_state(user_id)
    return StateResponse(user_id=user_id, state=state)


@app.put(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Replace state",
    include_in_schema=False,
)
async def put_state(payload: StateRequest, user_id: str = Depends(get_user_id)) -> StateResponse:
    next_state = {"data": payload.data, "note": payload.note}
    if payload.meta is not None:
        next_state["meta"] = payload.meta
    state = await store.replace_state(user_id, next_state)
    return StateResponse(user_id=user_id, state=state)


@app.patch(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Merge into existing state",
    include_in_schema=False,
)
async def patch_state(
    payload: StatePatchRequest, user_id: str = Depends(get_user_id)
) -> StateResponse:
    state = await store.patch_state(user_id, patch=payload.data, note=payload.note)
    return StateResponse(user_id=user_id, state=state)


@app.delete(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Reset and clear state",
    include_in_schema=False,
)
async def delete_state(user_id: str = Depends(get_user_id)) -> StateResponse:
    file_store.delete_user_files(user_id)
    state = await store.reset_state(user_id)
    return StateResponse(user_id=user_id, state=state)


@app.get(f"{settings.api_prefix}/expenseflow/workspace", tags=["expenseflow"])
async def get_expenseflow_workspace(user_id: str = Depends(get_user_id)) -> Dict[str, Any]:
    state = await store.get_state(user_id)
    workspace = state.data.get("expenseflow", {})
    return {
        "user_id": user_id,
        "local_storage": workspace.get("local_storage", {}),
        "submitted_expense_reports": workspace.get("submitted_expense_reports", []),
    }


def _expenseflow_workspace(data: Dict[str, Any]) -> Dict[str, Any]:
    workspace = data.setdefault("expenseflow", {})
    workspace.setdefault("local_storage", {})
    workspace.setdefault("submitted_expense_reports", [])
    return workspace


def _validate_line_number(line_number: int) -> None:
    if line_number < 1 or line_number > 10:
        raise HTTPException(status_code=422, detail="Line number must be between 1 and 10")


HEADER_KEYS = {"saved": "expenseHeader", "draft": "expenseHeaderDraft"}
LINE_KEYS = {"saved": "expenseLines", "draft": "expenseLinesDraft"}
PER_DIEM_KEYS = {"saved": "perDiemLines", "draft": "perDiemLinesDraft"}
APPROVER_KEYS = {"saved": "reviewApprovers", "draft": "reviewApproversDraft"}
PREFERENCE_KEYS = {
    "expenseTargetLine",
    "perDiemTargetLine",
    "cashExpensesDirty",
    "cashExpensesActiveTab",
    "expenseHeaderDirty",
    "reviewApproversDirty",
    "submittedReportSequence",
}


def _expense_attachment_metadata(user_id: str, attachment) -> Dict[str, Any]:
    match = next(
        (
            item
            for item in file_store.list_files(user_id)
            if item.id == attachment.id and item.filename == attachment.filename
        ),
        None,
    )
    if match is None:
        raise HTTPException(status_code=404, detail="Uploaded attachment not found")
    return match.model_dump()


def _expense_amount(value: Any) -> float:
    cleaned = re.sub(r"[^0-9.]", "", str(value or ""))
    try:
        return float(cleaned) if cleaned else 0.0
    except ValueError:
        return 0.0


def _validate_report_snapshot(payload: SubmittedExpenseReportRequest) -> None:
    header = payload.header
    expected_header_fields = {
        "costCenter": header.costCenter,
        "employeeName": header.employeeName,
        "purpose": header.expenseDescription,
        "template": header.template,
        "templateDesc": header.templateDesc,
        "budgetAmount": header.budgetAmount,
    }
    for field, expected in expected_header_fields.items():
        if getattr(payload, field) != expected:
            raise HTTPException(status_code=422, detail=f"Report {field} does not match header")
    for collection in (payload.lines, payload.perDiemLines, payload.allocations):
        if any(not key.isdigit() or not 1 <= int(key) <= 10 for key in collection):
            raise HTTPException(status_code=422, detail="Report contains an invalid line number")
    total = sum(
        _expense_amount(line.reimbAmount or line.receiptAmount)
        for line in payload.lines.values()
    ) + sum(_expense_amount(line.reimbAmount) for line in payload.perDiemLines.values())
    if abs(payload.reportTotal - total) > 0.01:
        raise HTTPException(status_code=422, detail="Report total does not match expense lines")


@app.put(f"{settings.api_prefix}/expenseflow/drafts/headers/{{version}}", tags=["expenseflow"])
async def save_expense_header(
    version: Literal["saved", "draft"],
    payload: ExpenseHeaderRequest,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    header = payload.model_dump()

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        _expenseflow_workspace(data)["local_storage"][HEADER_KEYS[version]] = header
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "header": header, "version": version}


@app.delete(f"{settings.api_prefix}/expenseflow/drafts/headers/{{version}}", tags=["expenseflow"])
async def delete_expense_header(
    version: Literal["saved", "draft"], user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        _expenseflow_workspace(data)["local_storage"].pop(HEADER_KEYS[version], None)
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "deleted": True}


def _line_endpoint(kind: str, version: str, line_number: int, value: Dict[str, Any]):
    _validate_line_number(line_number)
    key_map = LINE_KEYS if kind == "expense-lines" else PER_DIEM_KEYS

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        local = _expenseflow_workspace(data)["local_storage"]
        lines = local.setdefault(key_map[version], {})
        lines[str(line_number)] = value
        return data

    return mutate


@app.put(f"{settings.api_prefix}/expenseflow/drafts/expense-lines/{{version}}/{{line_number}}", tags=["expenseflow"])
async def save_expense_line(
    version: Literal["saved", "draft"],
    line_number: int,
    payload: ExpenseLineRequest,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    value = payload.model_dump()
    await store.mutate_data(user_id, _line_endpoint("expense-lines", version, line_number, value))
    return {"user_id": user_id, "line_number": line_number, "line": value}


@app.put(f"{settings.api_prefix}/expenseflow/drafts/per-diem-lines/{{version}}/{{line_number}}", tags=["expenseflow"])
async def save_per_diem_line(
    version: Literal["saved", "draft"],
    line_number: int,
    payload: PerDiemLineRequest,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    value = payload.model_dump()
    await store.mutate_data(user_id, _line_endpoint("per-diem-lines", version, line_number, value))
    return {"user_id": user_id, "line_number": line_number, "line": value}


@app.delete(f"{settings.api_prefix}/expenseflow/drafts/{{kind}}/{{version}}/{{line_number}}", tags=["expenseflow"])
async def delete_expense_line(
    kind: Literal["expense-lines", "per-diem-lines"],
    version: Literal["saved", "draft"],
    line_number: int,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    _validate_line_number(line_number)
    key_map = LINE_KEYS if kind == "expense-lines" else PER_DIEM_KEYS

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        lines = _expenseflow_workspace(data)["local_storage"].setdefault(key_map[version], {})
        lines.pop(str(line_number), None)
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "deleted": True}


@app.put(f"{settings.api_prefix}/expenseflow/drafts/allocations/{{line_number}}", tags=["expenseflow"])
async def save_expense_allocation(
    line_number: int,
    payload: ExpenseAllocationRequest,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    _validate_line_number(line_number)
    value = payload.model_dump()

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        allocations = _expenseflow_workspace(data)["local_storage"].setdefault(
            "expenseAllocations", {}
        )
        allocations[str(line_number)] = value
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "line_number": line_number, "allocation": value}


@app.delete(f"{settings.api_prefix}/expenseflow/drafts/allocations/{{line_number}}", tags=["expenseflow"])
async def delete_expense_allocation(
    line_number: int, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    _validate_line_number(line_number)

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        local = _expenseflow_workspace(data)["local_storage"]
        local.setdefault("expenseAllocations", {}).pop(str(line_number), None)
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "deleted": True}


@app.put(f"{settings.api_prefix}/expenseflow/drafts/approvers/{{version}}/{{position}}", tags=["expenseflow"])
async def save_expense_approver(
    version: Literal["saved", "draft"],
    position: int,
    payload: ExpenseApproverRequest,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    if position < 0 or position > 20:
        raise HTTPException(status_code=422, detail="Invalid approver position")

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        local = _expenseflow_workspace(data)["local_storage"]
        approvers = local.setdefault(APPROVER_KEYS[version], [])
        while len(approvers) <= position:
            approvers.append("")
        approvers[position] = payload.name
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "position": position, "name": payload.name}


@app.delete(f"{settings.api_prefix}/expenseflow/drafts/approvers/{{version}}/{{position}}", tags=["expenseflow"])
async def delete_expense_approver(
    version: Literal["saved", "draft"],
    position: int,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    if position < 0 or position > 20:
        raise HTTPException(status_code=422, detail="Invalid approver position")

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        approvers = _expenseflow_workspace(data)["local_storage"].setdefault(
            APPROVER_KEYS[version], []
        )
        if position < len(approvers):
            approvers[position] = ""
            while approvers and approvers[-1] == "":
                approvers.pop()
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "deleted": True}


@app.put(f"{settings.api_prefix}/expenseflow/drafts/attachments/{{attachment_id}}", tags=["expenseflow"])
async def save_expense_attachment(
    attachment_id: str,
    payload: ExpenseAttachmentRequest,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    if payload.id != attachment_id:
        raise HTTPException(status_code=422, detail="Attachment id cannot be changed")
    value = _expense_attachment_metadata(user_id, payload)

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        local = _expenseflow_workspace(data)["local_storage"]
        attachments = local.setdefault("expenseAttachmentsDraft", [])
        attachments[:] = [item for item in attachments if item.get("id") != attachment_id]
        attachments.append(value)
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "attachment": value}


@app.delete(f"{settings.api_prefix}/expenseflow/drafts/attachments/{{attachment_id}}", tags=["expenseflow"])
async def delete_expense_attachment(
    attachment_id: str, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        local = _expenseflow_workspace(data)["local_storage"]
        attachments = local.setdefault("expenseAttachmentsDraft", [])
        attachments[:] = [item for item in attachments if item.get("id") != attachment_id]
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "deleted": True}


@app.patch(f"{settings.api_prefix}/expenseflow/drafts/preferences", tags=["expenseflow"])
async def update_expense_preferences(
    payload: ExpensePreferencesRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    values = payload.model_dump(exclude_none=True)
    if not values:
        raise HTTPException(status_code=422, detail="At least one preference is required")
    values = {
        key: value.model_dump() if hasattr(value, "model_dump") else value
        for key, value in values.items()
    }

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        _expenseflow_workspace(data)["local_storage"].update(values)
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "preferences": values}


@app.delete(f"{settings.api_prefix}/expenseflow/drafts/preferences/{{preference}}", tags=["expenseflow"])
async def delete_expense_preference(
    preference: str, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    if preference not in PREFERENCE_KEYS:
        raise HTTPException(status_code=404, detail="Preference not found")

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        _expenseflow_workspace(data)["local_storage"].pop(preference, None)
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "deleted": True}


@app.post(f"{settings.api_prefix}/expenseflow/reports", tags=["expenseflow"])
async def submit_expense_report(
    payload: SubmittedExpenseReportRequest, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    _validate_report_snapshot(payload)
    report = payload.model_dump()
    report["attachments"] = [
        _expense_attachment_metadata(user_id, attachment)
        for attachment in payload.attachments
    ]

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        workspace = _expenseflow_workspace(data)
        reports = workspace["submitted_expense_reports"]
        existing = next(
            (item for item in reports if item.get("reportNumber") == payload.reportNumber),
            None,
        )
        if existing is not None and existing != report:
            raise HTTPException(status_code=409, detail="Report already exists")
        if existing is None:
            reports.insert(0, report)
        local_reports = workspace["local_storage"].setdefault("submittedExpenseReports", [])
        local_existing = next(
            (item for item in local_reports if item.get("reportNumber") == payload.reportNumber),
            None,
        )
        if local_existing is None:
            local_reports.insert(0, report)
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "report": report}


@app.delete(f"{settings.api_prefix}/expenseflow/reports/{{report_number}}", tags=["expenseflow"])
async def withdraw_expense_report(
    report_number: str, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        workspace = _expenseflow_workspace(data)
        reports = workspace["submitted_expense_reports"]
        if not any(item.get("reportNumber") == report_number for item in reports):
            raise HTTPException(status_code=404, detail="Report not found")
        workspace["submitted_expense_reports"] = [
            item for item in reports if item.get("reportNumber") != report_number
        ]
        local = workspace["local_storage"]
        local["submittedExpenseReports"] = [
            item
            for item in local.get("submittedExpenseReports", [])
            if item.get("reportNumber") != report_number
        ]
        return data

    await store.mutate_data(user_id, mutate)
    return {"user_id": user_id, "withdrawn": report_number}


@app.post(
    f"{settings.api_prefix}/files",
    response_model=List[FileMetadata],
    tags=["files"],
    summary="Upload files for the current user",
)
async def upload_files(
    files: List[UploadFile] = File(...), user_id: str = Depends(get_user_id)
) -> List[FileMetadata]:
    max_files = 4
    existing = file_store.list_files(user_id)
    if len(existing) + len(files) > max_files:
        raise HTTPException(
            status_code=400,
            detail=f"Only {max_files} .doc or .docx files are allowed per report.",
        )
    for upload in files:
        if not upload.filename or Path(upload.filename).suffix.lower() not in {".doc", ".docx"}:
            raise HTTPException(
                status_code=400,
                detail="Only .doc or .docx files are allowed.",
            )
    return [file_store.save_upload(upload, user_id) for upload in files]


@app.get(
    f"{settings.api_prefix}/files",
    response_model=List[FileMetadata],
    tags=["files"],
    summary="List files for the current user",
)
async def list_files(user_id: str = Depends(get_user_id)) -> List[FileMetadata]:
    return file_store.list_files(user_id)


@app.get(
    f"{settings.api_prefix}/files/{{filename}}",
    tags=["files"],
    summary="Fetch a stored file for the current user",
)
async def get_file(filename: str, user_id: str = Depends(get_user_id)) -> FileResponse:
    target_path = file_store.get_file_path(user_id, filename)
    if not target_path:
        raise HTTPException(status_code=404, detail="File not found")
    display_name = filename.split("__", 1)[1] if "__" in filename else filename
    media_type = mimetypes.guess_type(display_name)[0] or "application/octet-stream"
    response = FileResponse(target_path, media_type=media_type, filename=display_name)
    _set_user_cookie(response, user_id, settings)
    return response


@app.delete(
    f"{settings.api_prefix}/files/{{filename}}",
    tags=["files"],
    summary="Delete a stored file for the current user",
)
async def delete_file(
    filename: str,
    response: Response,
    user_id: str = Depends(get_user_id),
) -> Response:
    if not file_store.delete_file(user_id, filename):
        raise HTTPException(status_code=404, detail="File not found")
    response.status_code = 204
    return response


@app.get(
    f"{settings.api_prefix}/info",
    response_model=InfoResponse,
    tags=["system"],
    summary="System and request info",
)
async def info(request: Request, user_id: str = Depends(get_user_id)) -> InfoResponse:
    runtime_env = {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "env_mode": os.getenv("ENV", "dev"),
    }
    request_info: Dict[str, Any] = {
        "client": request.client.host if request.client else "unknown",
        "headers": dict(request.headers),
        "path": request.url.path,
        "method": request.method,
        "user_id": user_id,
    }
    return InfoResponse(
        app_name=settings.app_name,
        python_version=runtime_env["python_version"],
        env=runtime_env,
        request=request_info,
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "request_id": request.headers.get("x-request-id")},
    )


@mcp_server.tool(
    name="info",
    description="Return backend environment info and the resolved user id.",
)
async def mcp_info(user_cookie: Optional[str] = None) -> Dict[str, Any]:
    user_id = _resolve_user_cookie(user_cookie)
    runtime_env = {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "env_mode": os.getenv("ENV", "dev"),
    }
    return {
        "app_name": settings.app_name,
        "user_id": user_id,
        "env": runtime_env,
    }


# Mount MCP Streamable HTTP app at /mcp for remote access
app.mount("/mcp", mcp_http_app)
