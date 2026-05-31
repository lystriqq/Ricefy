import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, call, patch

import pytest
from storage3.exceptions import StorageApiError

from app.services.storage import BUCKET, SIGNED_URL_TTL, _ensure_bucket, upload_zip

SIGNED_URL = "https://example.supabase.co/storage/v1/object/sign/rice-zips/abc.zip?token=x"
RICE_ID = "abc123"


# ─── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture
def tmp_zip(tmp_path) -> Path:
    """A real (non-empty) zip file on disk."""
    import zipfile
    p = tmp_path / "ricefy-test.zip"
    with zipfile.ZipFile(p, "w") as zf:
        zf.writestr("install.sh", "#!/usr/bin/env bash\necho hi")
    return p


@pytest.fixture
def mock_client():
    client = MagicMock()
    bucket_proxy = client.storage.from_.return_value
    bucket_proxy.upload.return_value = MagicMock()
    bucket_proxy.create_signed_url.return_value = {
        "signedURL": SIGNED_URL,
        "signedUrl": SIGNED_URL,
    }
    client.storage.get_bucket.return_value = MagicMock()
    table_chain = client.table.return_value.update.return_value.eq.return_value
    table_chain.execute.return_value = MagicMock()
    return client


@pytest.fixture(autouse=True)
def patch_get_client(mock_client):
    with patch("app.services.storage._get_client", return_value=mock_client):
        yield mock_client


# ─── _ensure_bucket ───────────────────────────────────────────────────────────


class TestEnsureBucket:
    def test_no_create_when_bucket_exists(self, mock_client):
        mock_client.storage.get_bucket.return_value = MagicMock()
        _ensure_bucket(mock_client)
        mock_client.storage.create_bucket.assert_not_called()

    def test_creates_bucket_when_missing(self, mock_client):
        mock_client.storage.get_bucket.side_effect = StorageApiError(
            "Bucket not found", 404, "Not Found"
        )
        _ensure_bucket(mock_client)
        mock_client.storage.create_bucket.assert_called_once_with(
            BUCKET, options={"public": False}
        )

    def test_get_bucket_called_with_correct_name(self, mock_client):
        _ensure_bucket(mock_client)
        mock_client.storage.get_bucket.assert_called_once_with(BUCKET)


# ─── upload_zip — happy path ──────────────────────────────────────────────────


class TestUploadZipSuccess:
    def test_returns_signed_url(self, tmp_zip, mock_client):
        url = upload_zip(tmp_zip, RICE_ID)
        assert url == SIGNED_URL

    def test_uploads_to_correct_bucket(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        mock_client.storage.from_.assert_any_call(BUCKET)

    def test_uploads_with_zip_content_type(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        bucket_proxy = mock_client.storage.from_.return_value
        _, kwargs = bucket_proxy.upload.call_args
        assert kwargs.get("file_options", {}).get("content-type") == "application/zip"

    def test_storage_path_uses_rice_id(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        bucket_proxy = mock_client.storage.from_.return_value
        _, kwargs = bucket_proxy.upload.call_args
        assert kwargs["path"] == f"{RICE_ID}.zip"

    def test_signed_url_uses_correct_ttl(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        bucket_proxy = mock_client.storage.from_.return_value
        bucket_proxy.create_signed_url.assert_called_once_with(
            f"{RICE_ID}.zip", SIGNED_URL_TTL
        )

    def test_signed_url_ttl_is_7_days(self):
        assert SIGNED_URL_TTL == 7 * 24 * 60 * 60


# ─── upload_zip — DB update ───────────────────────────────────────────────────


class TestUploadZipDbUpdate:
    def test_table_rices_updated(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        mock_client.table.assert_called_with("rices")

    def test_status_set_to_ready(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        update_args = mock_client.table.return_value.update.call_args
        payload = update_args[0][0]
        assert payload["status"] == "ready"

    def test_zip_url_set_in_db(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        update_args = mock_client.table.return_value.update.call_args
        payload = update_args[0][0]
        assert payload["zip_url"] == SIGNED_URL

    def test_zip_path_set_in_db(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        update_args = mock_client.table.return_value.update.call_args
        payload = update_args[0][0]
        assert payload["zip_path"] == f"{RICE_ID}.zip"

    def test_filter_by_rice_id(self, tmp_zip, mock_client):
        upload_zip(tmp_zip, RICE_ID)
        eq_call = mock_client.table.return_value.update.return_value.eq.call_args
        assert eq_call == call("id", RICE_ID)


# ─── upload_zip — local file cleanup ─────────────────────────────────────────


class TestUploadZipCleanup:
    def test_local_zip_deleted_after_success(self, tmp_zip, mock_client):
        assert tmp_zip.exists()
        upload_zip(tmp_zip, RICE_ID)
        assert not tmp_zip.exists()

    def test_local_zip_deleted_on_upload_error(self, tmp_zip, mock_client):
        mock_client.storage.from_.return_value.upload.side_effect = RuntimeError("upload failed")
        with pytest.raises(RuntimeError, match="upload failed"):
            upload_zip(tmp_zip, RICE_ID)
        assert not tmp_zip.exists()

    def test_local_zip_deleted_on_db_error(self, tmp_zip, mock_client):
        chain = mock_client.table.return_value.update.return_value.eq.return_value
        chain.execute.side_effect = RuntimeError("db error")
        with pytest.raises(RuntimeError, match="db error"):
            upload_zip(tmp_zip, RICE_ID)
        assert not tmp_zip.exists()
