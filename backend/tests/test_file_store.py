import io

from starlette.datastructures import Headers, UploadFile

from app.config import Settings
from app.file_store import FileStore


def test_configured_storage_works_outside_read_only_application_dir(monkeypatch, tmp_path):
    application_dir = tmp_path / "application"
    application_dir.mkdir()
    application_dir.chmod(0o555)
    storage_dir = tmp_path / "writable-data" / "files"

    monkeypatch.chdir(application_dir)
    monkeypatch.setenv("FILE_STORAGE_DIR", str(storage_dir))
    settings = Settings(_env_file=None)
    store = FileStore(settings.file_storage_dir, "/api")
    upload = UploadFile(
        file=io.BytesIO(b"receipt"),
        filename="receipt.docx",
        headers=Headers(
            {
                "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
        ),
    )

    metadata = store.save_upload(upload, "test-user")

    assert metadata.name == "receipt.docx"
    assert metadata.size == len(b"receipt")
    assert metadata.url == f"/api/files/{metadata.filename}"
    assert (storage_dir / "test-user" / metadata.filename).read_bytes() == b"receipt"
    assert not (application_dir / "files").exists()
