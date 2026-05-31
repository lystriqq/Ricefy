import shutil
import tempfile
import zipfile
from pathlib import Path
from unittest.mock import patch

import pytest

from app.models.rice_config import (
    ColorPalette, FontConfig, HyprlandConfig, KittyConfig,
    HyprlockConfig, RiceConfig, RofiConfig, SddmConfig, SwaylockConfig,
    WaybarConfig, WofiConfig,
)
from app.services.generator import generate_rice, render_template


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _make_config(launcher=None, lockscreen=None) -> RiceConfig:
    return RiceConfig(
        name="Test Rice",
        colors=ColorPalette(
            accent="#7c6f64", background="#1d2021", foreground="#ebdbb2",
            border="#3c3836", surface="#282828",
        ),
        font=FontConfig(heading_family="Geist Sans", body_family="Geist Sans",
                        mono_family="JetBrains Mono", size=12),
        wm=HyprlandConfig(
            kind="hyprland", gaps_in=5, gaps_out=10, border_size=2, rounding=8,
            active_opacity=1.0, inactive_opacity=0.9, blur=True, blur_size=6,
            animations=True, shadow=True, wallpaper_tool="hyprpaper",
        ),
        bar=WaybarConfig(
            kind="waybar", position="top", height=32, spacing=8,
            modules_left=["hyprland/workspaces"], modules_center=["clock"],
            modules_right=["battery", "network", "pulseaudio"],
            show_icons=True, show_labels=True,
        ),
        terminal=KittyConfig(
            kind="kitty", font_family="JetBrains Mono", font_size=12,
            padding_x=12, padding_y=8, cursor_shape="block", cursor_blink=True,
        ),
        launcher=launcher or RofiConfig(
            kind="rofi", mode="drun", width=600, lines=10,
            position="center", show_icons=True,
        ),
        lockscreen=lockscreen or HyprlockConfig(
            kind="hyprlock", theme="centered", background_color="#1d2021",
            blur=True, blur_size=10, clock=True, date_format="%H:%M",
            layout="center", layout_y="center",
        ),
    )


@pytest.fixture
def config() -> RiceConfig:
    return _make_config()


def _names(zip_path: Path) -> set[str]:
    with zipfile.ZipFile(zip_path) as zf:
        return set(zf.namelist())


# ─── render_template ──────────────────────────────────────────────────────────


class TestRenderTemplate:
    def test_returns_string(self, config):
        out = render_template("install.sh.j2", {"config": config})
        assert isinstance(out, str)

    def test_context_injected(self, config):
        out = render_template("install.sh.j2", {"config": config})
        assert config.name in out

    def test_unknown_template_raises(self, config):
        from jinja2 import TemplateNotFound
        with pytest.raises(TemplateNotFound):
            render_template("nonexistent.j2", {"config": config})


# ─── generate_rice — zip validity ─────────────────────────────────────────────


class TestGenerateRiceBase:
    def test_returns_path(self, config):
        zip_path = generate_rice(config)
        try:
            assert isinstance(zip_path, Path)
        finally:
            zip_path.unlink(missing_ok=True)

    def test_zip_file_exists(self, config):
        zip_path = generate_rice(config)
        try:
            assert zip_path.exists()
        finally:
            zip_path.unlink(missing_ok=True)

    def test_zip_is_valid(self, config):
        zip_path = generate_rice(config)
        try:
            assert zipfile.is_zipfile(zip_path)
        finally:
            zip_path.unlink(missing_ok=True)

    def test_zip_name_contains_rice_name(self, config):
        zip_path = generate_rice(config)
        try:
            assert "test-rice" in zip_path.name
        finally:
            zip_path.unlink(missing_ok=True)

    def test_zip_not_empty(self, config):
        zip_path = generate_rice(config)
        try:
            assert zip_path.stat().st_size > 0
        finally:
            zip_path.unlink(missing_ok=True)


# ─── generate_rice — always-present files ─────────────────────────────────────


class TestZipContentsBase:
    @pytest.fixture(autouse=True)
    def _zip(self, config):
        self.zip_path = generate_rice(config)
        self.names = _names(self.zip_path)
        yield
        self.zip_path.unlink(missing_ok=True)

    def test_install_sh_present(self):
        assert "install.sh" in self.names

    def test_hyprland_config_present(self):
        assert "hyprland/hyprland.lua" in self.names

    def test_waybar_config_present(self):
        assert "waybar/config" in self.names

    def test_waybar_style_present(self):
        assert "waybar/style.css" in self.names

    def test_kitty_conf_present(self):
        assert "kitty/kitty.conf" in self.names


# ─── generate_rice — launcher variants ────────────────────────────────────────


class TestZipContentsLauncher:
    def test_rofi_config_present_when_rofi(self):
        zip_path = generate_rice(_make_config(
            launcher=RofiConfig(kind="rofi", mode="drun", width=600,
                                lines=10, position="center", show_icons=True),
        ))
        try:
            assert "rofi/config.rasi" in _names(zip_path)
        finally:
            zip_path.unlink(missing_ok=True)

    def test_wofi_files_absent_when_rofi(self):
        zip_path = generate_rice(_make_config(
            launcher=RofiConfig(kind="rofi", mode="drun", width=600,
                                lines=10, position="center", show_icons=True),
        ))
        try:
            names = _names(zip_path)
            assert "wofi/config" not in names
            assert "wofi/style.css" not in names
        finally:
            zip_path.unlink(missing_ok=True)

    def test_wofi_files_present_when_wofi(self):
        zip_path = generate_rice(_make_config(
            launcher=WofiConfig(kind="wofi", width=600, height=400, show_icons=True),
        ))
        try:
            names = _names(zip_path)
            assert "wofi/config" in names
            assert "wofi/style.css" in names
        finally:
            zip_path.unlink(missing_ok=True)

    def test_rofi_absent_when_wofi(self):
        zip_path = generate_rice(_make_config(
            launcher=WofiConfig(kind="wofi", width=600, height=400, show_icons=True),
        ))
        try:
            assert "rofi/config.rasi" not in _names(zip_path)
        finally:
            zip_path.unlink(missing_ok=True)


# ─── generate_rice — lockscreen variants ──────────────────────────────────────


class TestZipContentsLockscreen:
    def test_hyprlock_conf_present_when_hyprlock(self):
        zip_path = generate_rice(_make_config(
            lockscreen=HyprlockConfig(
                kind="hyprlock", theme="t", background_color="#1d2021",
                blur=True, blur_size=10, clock=True, date_format="%H:%M",
                layout="center", layout_y="center",
            ),
        ))
        try:
            assert "hyprlock/hyprlock.conf" in _names(zip_path)
        finally:
            zip_path.unlink(missing_ok=True)

    def test_swaylock_conf_present_when_swaylock(self):
        zip_path = generate_rice(_make_config(
            lockscreen=SwaylockConfig(
                kind="swaylock", theme="minimal", color="#1d2021",
                blur=True, clock=True, layout="center", layout_y="center",
            ),
        ))
        try:
            assert "swaylock/swaylock.conf" in _names(zip_path)
        finally:
            zip_path.unlink(missing_ok=True)

    def test_sddm_files_present_when_sddm(self):
        zip_path = generate_rice(_make_config(
            lockscreen=SddmConfig(
                kind="sddm", theme="simple", background_color="#1d2021",
                font="Geist Sans", show_logo=True, blur=False, blur_size=6,
                layout="center", layout_y="center",
            ),
        ))
        try:
            names = _names(zip_path)
            assert "sddm/theme.conf" in names
            assert "sddm/Main.qml" in names
        finally:
            zip_path.unlink(missing_ok=True)

    def test_hyprlock_absent_when_swaylock(self):
        zip_path = generate_rice(_make_config(
            lockscreen=SwaylockConfig(
                kind="swaylock", theme="minimal", color="#1d2021",
                blur=True, clock=True, layout="center", layout_y="center",
            ),
        ))
        try:
            assert "hyprlock/hyprlock.conf" not in _names(zip_path)
        finally:
            zip_path.unlink(missing_ok=True)

    def test_sddm_absent_when_hyprlock(self, config):
        zip_path = generate_rice(config)
        try:
            names = _names(zip_path)
            assert "sddm/theme.conf" not in names
            assert "sddm/Main.qml" not in names
        finally:
            zip_path.unlink(missing_ok=True)


# ─── generate_rice — file contents ────────────────────────────────────────────


class TestZipFileContents:
    def test_kitty_conf_contains_terminal_colors(self, config):
        zip_path = generate_rice(config)
        try:
            with zipfile.ZipFile(zip_path) as zf:
                kitty = zf.read("kitty/kitty.conf").decode()
            assert "color0" in kitty
            assert "color15" in kitty
        finally:
            zip_path.unlink(missing_ok=True)

    def test_install_sh_contains_rice_name(self, config):
        zip_path = generate_rice(config)
        try:
            with zipfile.ZipFile(zip_path) as zf:
                script = zf.read("install.sh").decode()
            assert config.name in script
        finally:
            zip_path.unlink(missing_ok=True)

    def test_hyprland_lua_not_empty(self, config):
        zip_path = generate_rice(config)
        try:
            with zipfile.ZipFile(zip_path) as zf:
                content = zf.read("hyprland/hyprland.lua").decode()
            assert len(content) > 100
        finally:
            zip_path.unlink(missing_ok=True)


# ─── generate_rice — cleanup ──────────────────────────────────────────────────


class TestGenerateRiceCleanup:
    def test_content_dir_cleaned_up_on_success(self, config):
        with patch("app.services.generator.shutil.rmtree") as mock_rm:
            zip_path = generate_rice(config)
        zip_path.unlink(missing_ok=True)
        mock_rm.assert_called_once()

    def test_content_dir_cleaned_up_on_error(self, config):
        with patch("app.services.generator.shutil.rmtree") as mock_rm:
            with patch("app.services.generator._write_files",
                       side_effect=RuntimeError("boom")):
                with pytest.raises(RuntimeError, match="boom"):
                    generate_rice(config)
        mock_rm.assert_called_once()

    def test_zip_deleted_on_error(self, config):
        created_zips: list[Path] = []
        real_mkstemp = tempfile.mkstemp

        def capturing_mkstemp(**kwargs):
            fd, path = real_mkstemp(**kwargs)
            created_zips.append(Path(path))
            return fd, path

        with patch("tempfile.mkstemp", side_effect=capturing_mkstemp):
            with patch("app.services.generator._write_files",
                       side_effect=RuntimeError("boom")):
                with pytest.raises(RuntimeError):
                    generate_rice(config)

        for p in created_zips:
            assert not p.exists(), f"Zip was not deleted: {p}"
