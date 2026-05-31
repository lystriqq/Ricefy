from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app

RICE_ID = "rice-uuid-123"
USER_ID = "user-uuid-456"
DOWNLOAD_URL = "https://example.supabase.co/storage/v1/object/sign/rice-zips/rice-uuid-123.zip"

VALID_PAYLOAD = {
    "rice_id": RICE_ID,
    "user_id": USER_ID,
    "config": {
        "name": "My Rice",
        "colors": {
            "accent": "#7c6f64", "background": "#1d2021",
            "foreground": "#ebdbb2", "border": "#3c3836", "surface": "#282828",
        },
        "font": {
            "heading_family": "Geist Sans", "body_family": "Geist Sans",
            "mono_family": "JetBrains Mono", "size": 12,
        },
        "wm": {
            "kind": "hyprland", "gaps_in": 5, "gaps_out": 10,
            "border_size": 2, "rounding": 8, "active_opacity": 1.0,
            "inactive_opacity": 0.9, "blur": True, "blur_size": 6,
            "animations": True, "shadow": True, "wallpaper_tool": "hyprpaper",
        },
        "bar": {
            "kind": "waybar", "position": "top", "height": 32, "spacing": 8,
            "modules_left": ["hyprland/workspaces"], "modules_center": ["clock"],
            "modules_right": ["battery", "network", "pulseaudio"],
            "show_icons": True, "show_labels": True,
        },
        "terminal": {
            "kind": "kitty", "font_family": "JetBrains Mono", "font_size": 12,
            "padding_x": 12, "padding_y": 8, "cursor_shape": "block",
            "cursor_blink": True,
        },
        "launcher": {
            "kind": "rofi", "mode": "drun", "width": 600, "lines": 10,
            "position": "center", "show_icons": True,
        },
        "lockscreen": {
            "kind": "hyprlock", "theme": "centered",
            "background_color": "#1d2021", "blur": True, "blur_size": 10,
            "clock": True, "date_format": "%H:%M",
            "layout": "center", "layout_y": "center",
        },
    },
}


# ─── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_supabase():
    client = MagicMock()

    # Select chain: .table().select().eq("id",...).eq("user_id",...).execute()
    select_result = (
        client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    )
    select_result.data = [{"id": RICE_ID, "status": "draft", "user_id": USER_ID}]

    # Update chain: .table().update({...}).eq("id",...).execute()
    client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

    return client


@pytest.fixture
def mock_zip(tmp_path) -> Path:
    p = tmp_path / "ricefy.zip"
    p.write_bytes(b"PK")  # minimal fake zip
    return p


@pytest.fixture
def client_with_mocks(mock_supabase, mock_zip):
    with (
        patch("app.routers.generate._get_supabase", return_value=mock_supabase),
        patch("app.routers.generate.generator.generate_rice", return_value=mock_zip),
        patch("app.routers.generate.storage.upload_zip", return_value=DOWNLOAD_URL),
    ):
        with TestClient(app) as c:
            yield c


# ─── Happy path ───────────────────────────────────────────────────────────────


class TestGenerateSuccess:
    def test_returns_200(self, client_with_mocks):
        r = client_with_mocks.post("/generate", json=VALID_PAYLOAD)
        assert r.status_code == 200

    def test_response_has_status_ready(self, client_with_mocks):
        r = client_with_mocks.post("/generate", json=VALID_PAYLOAD)
        assert r.json()["status"] == "ready"

    def test_response_has_download_url(self, client_with_mocks):
        r = client_with_mocks.post("/generate", json=VALID_PAYLOAD)
        assert r.json()["download_url"] == DOWNLOAD_URL

    def test_generate_rice_called(self, mock_supabase, mock_zip):
        with (
            patch("app.routers.generate._get_supabase", return_value=mock_supabase),
            patch("app.routers.generate.generator.generate_rice", return_value=mock_zip) as mock_gen,
            patch("app.routers.generate.storage.upload_zip", return_value=DOWNLOAD_URL),
        ):
            with TestClient(app) as c:
                c.post("/generate", json=VALID_PAYLOAD)
            mock_gen.assert_called_once()

    def test_upload_zip_called_with_rice_id(self, mock_supabase, mock_zip):
        with (
            patch("app.routers.generate._get_supabase", return_value=mock_supabase),
            patch("app.routers.generate.generator.generate_rice", return_value=mock_zip),
            patch("app.routers.generate.storage.upload_zip", return_value=DOWNLOAD_URL) as mock_up,
        ):
            with TestClient(app) as c:
                c.post("/generate", json=VALID_PAYLOAD)
            _, call_rice_id = mock_up.call_args[0]
            assert call_rice_id == RICE_ID

    def test_status_set_to_generating(self, mock_supabase, mock_zip):
        with (
            patch("app.routers.generate._get_supabase", return_value=mock_supabase),
            patch("app.routers.generate.generator.generate_rice", return_value=mock_zip),
            patch("app.routers.generate.storage.upload_zip", return_value=DOWNLOAD_URL),
        ):
            with TestClient(app) as c:
                c.post("/generate", json=VALID_PAYLOAD)

        update_payloads = [
            call[0][0]
            for call in mock_supabase.table.return_value.update.call_args_list
        ]
        assert {"status": "generating"} in update_payloads


# ─── Ownership check ──────────────────────────────────────────────────────────


class TestOwnershipCheck:
    def test_403_when_rice_not_found(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        with patch("app.routers.generate._get_supabase", return_value=mock_supabase):
            with TestClient(app) as c:
                r = c.post("/generate", json=VALID_PAYLOAD)
        assert r.status_code == 403

    def test_403_detail_message(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        with patch("app.routers.generate._get_supabase", return_value=mock_supabase):
            with TestClient(app) as c:
                r = c.post("/generate", json=VALID_PAYLOAD)
        assert "access denied" in r.json()["detail"].lower()


# ─── Status check ─────────────────────────────────────────────────────────────


class TestStatusCheck:
    @pytest.mark.parametrize("bad_status", ["generating", "ready", "failed"])
    def test_400_when_invalid_status(self, mock_supabase, bad_status):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": RICE_ID, "status": bad_status, "user_id": USER_ID}
        ]
        with patch("app.routers.generate._get_supabase", return_value=mock_supabase):
            with TestClient(app) as c:
                r = c.post("/generate", json=VALID_PAYLOAD)
        assert r.status_code == 400

    def test_400_detail_contains_current_status(self, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": RICE_ID, "status": "generating", "user_id": USER_ID}
        ]
        with patch("app.routers.generate._get_supabase", return_value=mock_supabase):
            with TestClient(app) as c:
                r = c.post("/generate", json=VALID_PAYLOAD)
        assert "generating" in r.json()["detail"]

    def test_200_when_paid(self, mock_supabase, mock_zip):
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": RICE_ID, "status": "paid", "user_id": USER_ID}
        ]
        with (
            patch("app.routers.generate._get_supabase", return_value=mock_supabase),
            patch("app.routers.generate.generator.generate_rice", return_value=mock_zip),
            patch("app.routers.generate.storage.upload_zip", return_value=DOWNLOAD_URL),
        ):
            with TestClient(app) as c:
                r = c.post("/generate", json=VALID_PAYLOAD)
        assert r.status_code == 200


# ─── Error handling ───────────────────────────────────────────────────────────


class TestErrorHandling:
    def test_500_when_generate_raises(self, mock_supabase):
        with (
            patch("app.routers.generate._get_supabase", return_value=mock_supabase),
            patch("app.routers.generate.generator.generate_rice",
                  side_effect=RuntimeError("render failed")),
        ):
            with TestClient(app) as c:
                r = c.post("/generate", json=VALID_PAYLOAD)
        assert r.status_code == 500

    def test_500_when_upload_raises(self, mock_supabase, mock_zip):
        with (
            patch("app.routers.generate._get_supabase", return_value=mock_supabase),
            patch("app.routers.generate.generator.generate_rice", return_value=mock_zip),
            patch("app.routers.generate.storage.upload_zip",
                  side_effect=RuntimeError("upload failed")),
        ):
            with TestClient(app) as c:
                r = c.post("/generate", json=VALID_PAYLOAD)
        assert r.status_code == 500

    def test_status_set_to_failed_on_error(self, mock_supabase):
        with (
            patch("app.routers.generate._get_supabase", return_value=mock_supabase),
            patch("app.routers.generate.generator.generate_rice",
                  side_effect=RuntimeError("boom")),
        ):
            with TestClient(app) as c:
                c.post("/generate", json=VALID_PAYLOAD)

        update_payloads = [
            call[0][0]
            for call in mock_supabase.table.return_value.update.call_args_list
        ]
        assert {"status": "failed"} in update_payloads

    def test_500_detail_message(self, mock_supabase):
        with (
            patch("app.routers.generate._get_supabase", return_value=mock_supabase),
            patch("app.routers.generate.generator.generate_rice",
                  side_effect=RuntimeError("boom")),
        ):
            with TestClient(app) as c:
                r = c.post("/generate", json=VALID_PAYLOAD)
        assert "Generation failed" in r.json()["detail"]


# ─── Request validation ───────────────────────────────────────────────────────


class TestRequestValidation:
    def test_422_when_body_missing(self):
        with TestClient(app) as c:
            r = c.post("/generate", json={})
        assert r.status_code == 422

    def test_422_when_rice_id_empty(self, mock_supabase):
        payload = {**VALID_PAYLOAD, "rice_id": ""}
        with patch("app.routers.generate._get_supabase", return_value=mock_supabase):
            with TestClient(app) as c:
                r = c.post("/generate", json=payload)
        assert r.status_code == 422
