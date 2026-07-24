from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from .models import StateMeta, UserState


class StateRequest(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)
    note: Optional[str] = None
    meta: Optional[StateMeta] = None


class StatePatchRequest(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)
    note: Optional[str] = None


class StateResponse(BaseModel):
    user_id: str
    state: UserState


class InfoResponse(BaseModel):
    app_name: str
    python_version: str
    env: Dict[str, str]
    request: Dict[str, Any]


class FileMetadata(BaseModel):
    id: str
    name: str
    size: int
    type: str
    url: str
    filename: str


class ExpenseflowRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ExpenseHeaderRequest(ExpenseflowRequest):
    employeeName: str = ""
    employeeNumber: str = ""
    costCenter: str = ""
    reimbursementCurrency: str = ""
    template: str = ""
    templateDesc: str = ""
    applicationNumber: str = ""
    expenseDescription: str = ""
    submittedFromApp: str = ""
    budgetAmount: str = ""
    notesAck: bool = False


class ExpenseLineRequest(ExpenseflowRequest):
    receiptDate: str = ""
    receiptAmount: str = ""
    expenseType: str = ""
    description: str = ""
    reimbAmount: str = ""
    receiptCurrency: str = ""
    exchangeRate: str = ""


class PerDiemLineRequest(ExpenseflowRequest):
    expenseType: str = ""
    startDate: str = ""
    endDate: str = ""
    destination: str = ""
    description: str = ""
    nights: str = ""
    reimbAmount: str = ""


class ExpenseAllocationRequest(ExpenseflowRequest):
    naturalAccount: str = ""
    analysis: str = ""
    budgetHolder: str = ""
    costCentre: str = ""
    fundSource: str = ""


class ExpenseApproverRequest(ExpenseflowRequest):
    name: str = Field(max_length=200)


class ExpenseAttachmentRequest(ExpenseflowRequest):
    id: str
    filename: str


class ReportSequenceRequest(ExpenseflowRequest):
    dateKey: str
    seq: int = Field(ge=1)


class ExpensePreferencesRequest(ExpenseflowRequest):
    expenseTargetLine: Optional[int] = Field(default=None, ge=1, le=10)
    perDiemTargetLine: Optional[int] = Field(default=None, ge=1, le=10)
    cashExpensesDirty: Optional[bool] = None
    cashExpensesActiveTab: Optional[Literal["receipt", "per-diem"]] = None
    expenseHeaderDirty: Optional[bool] = None
    reviewApproversDirty: Optional[bool] = None
    submittedReportSequence: Optional[ReportSequenceRequest] = None


class SubmittedExpenseReportRequest(ExpenseflowRequest):
    reportNumber: str = Field(pattern=r"^ER-\d{4}-\d{4}-\d{3}$")
    submitDate: str
    costCenter: str = ""
    employeeNumber: str = ""
    employeeName: str = ""
    lastUpdateDate: str
    currentApprover: str = ""
    reportTotal: float = 0
    purpose: str = ""
    header: ExpenseHeaderRequest
    lines: Dict[str, ExpenseLineRequest] = Field(default_factory=dict)
    perDiemLines: Dict[str, PerDiemLineRequest] = Field(default_factory=dict)
    allocations: Dict[str, ExpenseAllocationRequest] = Field(default_factory=dict)
    approvers: list[str] = Field(default_factory=list)
    expenseDates: str = ""
    template: str = ""
    templateDesc: str = ""
    budgetAmount: str = ""
    attachments: list[ExpenseAttachmentRequest] = Field(default_factory=list)
