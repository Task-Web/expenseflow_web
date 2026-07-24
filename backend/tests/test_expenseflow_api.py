import pytest


@pytest.mark.asyncio
async def test_control_plane_is_hidden_from_public_openapi(async_client):
    schema = (await async_client.get("/api/openapi.json")).json()
    assert "/api/state" not in schema["paths"]
    assert all(tag.get("name") != "state" for tag in schema.get("tags", []))


def report_payload(file_data, *, total=12.5, line_key="1"):
    header = {
        "employeeName": "Ada Lovelace",
        "employeeNumber": "00000001",
        "costCenter": "CC100",
        "expenseDescription": "Research trip",
        "template": "Travel",
        "templateDesc": "Travel expenses",
        "budgetAmount": "1000",
    }
    return {
        "reportNumber": "ER-2026-0724-001",
        "submitDate": "24-JUL-2026",
        "costCenter": "CC100",
        "employeeNumber": "00000001",
        "employeeName": "Ada Lovelace",
        "lastUpdateDate": "24-JUL-2026",
        "currentApprover": "Department Checker",
        "reportTotal": total,
        "purpose": "Research trip",
        "header": header,
        "lines": {
            line_key: {
                "receiptDate": "2026-07-20",
                "receiptAmount": "12.50",
                "expenseType": "Travel",
                "description": "Taxi",
                "reimbAmount": "12.50",
                "receiptCurrency": "HKD",
                "exchangeRate": "1",
            }
        },
        "perDiemLines": {},
        "allocations": {},
        "approvers": ["Department Checker"],
        "expenseDates": "2026-07-20",
        "template": "Travel",
        "templateDesc": "Travel expenses",
        "budgetAmount": "1000",
        "attachments": [{"id": file_data["id"], "filename": file_data["filename"]}],
    }


@pytest.mark.asyncio
async def test_expense_report_is_domain_validated_and_preserves_evaluator_state(async_client):
    cookie = "expenseflow-product"
    await async_client.delete("/api/state", params={"cookie": cookie})
    await async_client.patch(
        "/api/state",
        params={"cookie": cookie},
        json={"data": {"evaluator_marker": {"keep": True}}},
    )
    upload = await async_client.post(
        "/api/files",
        params={"cookie": cookie},
        files={"files": ("receipt.docx", b"receipt", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert upload.status_code == 200
    file_data = upload.json()[0]

    attached = await async_client.put(
        f"/api/expenseflow/drafts/attachments/{file_data['id']}",
        params={"cookie": cookie},
        json={"id": file_data["id"], "filename": file_data["filename"]},
    )
    assert attached.status_code == 200
    assert attached.json()["attachment"] == file_data

    response = await async_client.post(
        "/api/expenseflow/reports",
        params={"cookie": cookie},
        json=report_payload(file_data),
    )
    assert response.status_code == 200
    assert response.json()["report"]["attachments"] == [file_data]

    final = await async_client.get("/api/state", params={"cookie": cookie})
    workspace = final.json()["state"]["data"]["expenseflow"]
    assert workspace["submitted_expense_reports"][0] == workspace["local_storage"][
        "submittedExpenseReports"
    ][0]
    assert final.json()["state"]["data"]["evaluator_marker"] == {"keep": True}
    await async_client.delete("/api/state", params={"cookie": cookie})


@pytest.mark.asyncio
async def test_expense_report_rejects_forged_totals_lines_and_attachment_fields(async_client):
    cookie = "expenseflow-strict"
    await async_client.delete("/api/state", params={"cookie": cookie})
    upload = await async_client.post(
        "/api/files",
        params={"cookie": cookie},
        files={"files": ("receipt.doc", b"receipt", "application/msword")},
    )
    file_data = upload.json()[0]

    forged_total = await async_client.post(
        "/api/expenseflow/reports",
        params={"cookie": cookie},
        json=report_payload(file_data, total=999),
    )
    assert forged_total.status_code == 422

    invalid_line = await async_client.post(
        "/api/expenseflow/reports",
        params={"cookie": cookie},
        json=report_payload(file_data, line_key="99"),
    )
    assert invalid_line.status_code == 422

    forged_attachment = report_payload(file_data)
    forged_attachment["attachments"][0]["developer_tools_open"] = True
    rejected = await async_client.post(
        "/api/expenseflow/reports",
        params={"cookie": cookie},
        json=forged_attachment,
    )
    assert rejected.status_code == 422
    await async_client.delete("/api/state", params={"cookie": cookie})
