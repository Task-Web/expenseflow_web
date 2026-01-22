# ExpenseFlow UI State Reference

This document describes the browser-side state used by the ExpenseFlow static UI. The FastAPI backend still exposes the base per-user state, and the ExpenseFlow pages sync submitted reports into it while keeping drafts in localStorage.

## localStorage keys
- `expenseHeader` (object): Header fields from the General Information step.
  - `employeeName` (string)
  - `costCenter` (string)
  - `reimbursementCurrency` (string)
  - `template` (string)
  - `templateDesc` (string)
  - `applicationNumber` (string)
  - `expenseDescription` (string)
  - `submittedFromApp` (string)
  - `budgetAmount` (string)
- `expenseLines` (object): Receipt-based expense lines keyed by line number as a string.
  - `receiptDate` (string)
  - `receiptAmount` (string)
  - `expenseType` (string)
  - `description` (string)
  - `reimbAmount` (string)
  - `receiptCurrency` (string)
  - `exchangeRate` (string)
- `perDiemLines` (object): Per diem expense lines keyed by line number as a string.
  - `expenseType` (string)
  - `startDate` (string)
  - `endDate` (string)
  - `destination` (string)
  - `description` (string)
  - `nights` (string)
  - `reimbAmount` (string)
- `expenseTargetLine` (string number): Currently selected receipt line for the details page.
- `perDiemTargetLine` (string number): Currently selected per diem line for the details page.
- `cashExpensesActiveTab` (string): Active tab in Cash and Other Expenses (`receipt` or `per-diem`).
- `expenseAttachmentsDraft` (array): Attachment metadata for the current report before submission.
- `submittedExpenseReports` (array): Submitted report records captured on the Review step.
  - `reportNumber` (string)
  - `submitDate` (string)
  - `costCenter` (string)
  - `employeeNumber` (string)
  - `employeeName` (string)
  - `lastUpdateDate` (string)
  - `currentApprover` (string)
  - `reportTotal` (number)
  - `purpose` (string)
  - `header` (object)
  - `lines` (object)
  - `perDiemLines` (object)
  - `allocations` (object)
  - `approvers` (array)
  - `expenseDates` (string)
- `template` (string)
- `templateDesc` (string)
- `budgetAmount` (string)
- `attachments` (array): Attachment metadata captured at submission time.

## Attachments
The Review page uploads files to the FastAPI files endpoint (`/api/files`) and stores the current
report's attachment metadata in `expenseAttachmentsDraft` until submission. Submitted report
snapshots include the attachments list.

## UI behavior
- The ExpenseFlow pages resolve `/api` using `expenseflowApiBase` (localStorage) or `data-api-base` on `<body>` when pointing to a remote backend; localhost defaults to `http://localhost:8000/api` unless overridden.

## Backend state mirror
ExpenseFlow pages patch `/api/state` on localStorage changes so backend state stays aligned:
- `data.expenseflow.local_storage`: latest snapshot of tracked localStorage keys (JSON values parsed when possible).
- `data.expenseflow.submitted_expense_reports`: submitted report snapshots (excluding the default report `ER-2025-1106-001`).

## Notes
- Dates are stored as user-entered strings (for example `14-OCT-2025`).
- Amounts and counts are stored as strings; parsing happens when totals are calculated.
- Empty lines are compacted before rendering the summary tables.
