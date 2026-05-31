import pytest
from pydantic import ValidationError

from app.models.rice_config import (
    AppLauncherConfig,
    BarConfig,
    ColorPalette,
    FontConfig,
    GenerateRequest,
    HyprlockConfig,
    HyprlandConfig,
    KittyConfig,
    LockScreenConfig,
    RiceConfig,
    RofiConfig,
    SddmConfig,
    SwaylockConfig,
    WaybarConfig,
    WofiConfig,
    WMConfig,
)

# ─── Fixtures ────────────────────────────────────────────────────────────────


@pytest.fixture
def valid_config() -> dict:
    return {
        "name": "My Rice",
        "colors": {
            "accent": "#7c6f64",
            "background": "#1d2021",
            "foreground": "#ebdbb2",
            "border": "#3c3836",
            "surface": "#282828",
        },
        "font": {
            "heading_family": "Geist Sans",
            "body_family": "Geist Sans",
            "mono_family": "JetBrains Mono",
            "size": 12,
        },
        "wm": {
            "kind": "hyprland",
            "gaps_in": 5,
            "gaps_out": 10,
            "border_size": 2,
            "rounding": 8,
            "active_opacity": 1.0,
            "inactive_opacity": 0.9,
            "blur": True,
            "blur_size": 6,
            "animations": True,
            "shadow": True,
            "wallpaper_tool": "hyprpaper",
        },
        "bar": {
            "kind": "waybar",
            "position": "top",
            "height": 32,
            "spacing": 8,
            "modules_left": ["hyprland/workspaces"],
            "modules_center": ["clock"],
            "modules_right": ["battery", "network", "pulseaudio"],
            "show_icons": True,
            "show_labels": True,
        },
        "terminal": {
            "kind": "kitty",
            "font_family": "JetBrains Mono",
            "font_size": 12,
            "padding_x": 12,
            "padding_y": 8,
            "cursor_shape": "block",
            "cursor_blink": True,
        },
        "launcher": {
            "kind": "rofi",
            "mode": "drun",
            "width": 600,
            "lines": 10,
            "position": "center",
            "show_icons": True,
        },
        "lockscreen": {
            "kind": "hyprlock",
            "theme": "centered",
            "background_color": "#1d2021",
            "blur": True,
            "blur_size": 10,
            "clock": True,
            "date_format": "%H:%M",
            "layout": "center",
            "layout_y": "center",
        },
    }


# ─── ColorPalette ─────────────────────────────────────────────────────────────


class TestColorPalette:
    def test_valid(self):
        p = ColorPalette(
            accent="#7c6f64",
            background="#1d2021",
            foreground="#ebdbb2",
            border="#3c3836",
            surface="#282828",
        )
        assert p.accent == "#7c6f64"

    def test_uppercase_normalized_to_lowercase(self):
        p = ColorPalette(
            accent="#7C6F64",
            background="#1D2021",
            foreground="#EBDBB2",
            border="#3C3836",
            surface="#282828",
        )
        assert p.accent == "#7c6f64"

    @pytest.mark.parametrize("bad", [
        "7c6f64",       # missing #
        "#7c6f6",       # too short
        "#7c6f644",     # too long
        "#7c6f6g",      # invalid char
        "red",          # named color
        "",             # empty
        "#gggggg",      # all invalid hex chars
    ])
    def test_invalid_hex(self, bad: str):
        with pytest.raises(ValidationError) as exc:
            ColorPalette(
                accent=bad,
                background="#000000",
                foreground="#ffffff",
                border="#333333",
                surface="#111111",
            )
        errors = exc.value.errors()
        assert any("accent" in str(e["loc"]) for e in errors)

    def test_missing_field(self):
        with pytest.raises(ValidationError):
            ColorPalette(accent="#000000", background="#000000", foreground="#000000", border="#000000")  # missing surface


# ─── FontConfig ───────────────────────────────────────────────────────────────


class TestFontConfig:
    def test_valid(self):
        f = FontConfig(heading_family="Geist Sans", body_family="Inter", mono_family="JetBrains Mono", size=14)
        assert f.size == 14

    @pytest.mark.parametrize("size", [5, 73, 0, -1, 999])
    def test_size_out_of_range(self, size: int):
        with pytest.raises(ValidationError):
            FontConfig(heading_family="X", body_family="X", mono_family="X", size=size)

    def test_empty_family(self):
        with pytest.raises(ValidationError):
            FontConfig(heading_family="", body_family="Inter", mono_family="Mono", size=12)

    def test_family_too_long(self):
        with pytest.raises(ValidationError):
            FontConfig(heading_family="A" * 101, body_family="Inter", mono_family="Mono", size=12)


# ─── WMConfig (HyprlandConfig) ───────────────────────────────────────────────


class TestWMConfig:
    def test_valid(self):
        cfg = HyprlandConfig(
            kind="hyprland", gaps_in=5, gaps_out=10, border_size=2, rounding=8,
            active_opacity=1.0, inactive_opacity=0.9, blur=True, blur_size=6,
            animations=True, shadow=True, wallpaper_tool="hyprpaper",
        )
        assert cfg.gaps_in == 5

    def test_wallpaper_image_optional(self):
        cfg = HyprlandConfig(
            kind="hyprland", gaps_in=0, gaps_out=0, border_size=1, rounding=0,
            active_opacity=1.0, inactive_opacity=1.0, blur=False, blur_size=0,
            animations=False, shadow=False, wallpaper_tool="swww",
        )
        assert cfg.wallpaper_image is None

    @pytest.mark.parametrize("field,bad_value", [
        ("gaps_in", -1),
        ("gaps_in", 101),
        ("gaps_out", -1),
        ("border_size", 21),
        ("rounding", 51),
        ("blur_size", 21),
        ("active_opacity", 1.1),
        ("active_opacity", -0.1),
        ("inactive_opacity", 1.5),
    ])
    def test_range_violations(self, field: str, bad_value):
        base = dict(
            kind="hyprland", gaps_in=5, gaps_out=5, border_size=2, rounding=4,
            active_opacity=1.0, inactive_opacity=0.9, blur=True, blur_size=4,
            animations=True, shadow=True, wallpaper_tool="hyprpaper",
        )
        base[field] = bad_value
        with pytest.raises(ValidationError):
            HyprlandConfig(**base)

    def test_invalid_wallpaper_tool(self):
        with pytest.raises(ValidationError):
            HyprlandConfig(
                kind="hyprland", gaps_in=5, gaps_out=5, border_size=2, rounding=4,
                active_opacity=1.0, inactive_opacity=0.9, blur=True, blur_size=4,
                animations=True, shadow=True, wallpaper_tool="feh",
            )


# ─── BarConfig (WaybarConfig) ─────────────────────────────────────────────────


class TestBarConfig:
    def test_valid(self):
        cfg = WaybarConfig(
            kind="waybar", position="top", height=32, spacing=8,
            modules_left=["hyprland/workspaces"], modules_center=["clock"],
            modules_right=["battery"], show_icons=True, show_labels=True,
        )
        assert cfg.position == "top"

    def test_empty_module_lists_allowed(self):
        cfg = WaybarConfig(
            kind="waybar", position="bottom", height=24, spacing=4,
            modules_left=[], modules_center=[], modules_right=[],
            show_icons=False, show_labels=False,
        )
        assert cfg.modules_left == []

    @pytest.mark.parametrize("bad_module", ["fake/module", "xmobar", "", "hyprland", "CLOCK"])
    def test_unknown_module(self, bad_module: str):
        with pytest.raises(ValidationError):
            WaybarConfig(
                kind="waybar", position="top", height=32, spacing=8,
                modules_left=[bad_module], modules_center=[], modules_right=[],
                show_icons=True, show_labels=True,
            )

    @pytest.mark.parametrize("field,bad", [("height", 15), ("height", 81), ("spacing", -1), ("spacing", 41)])
    def test_range_violations(self, field: str, bad):
        base = dict(kind="waybar", position="top", height=32, spacing=8, modules_left=[], modules_center=[], modules_right=[], show_icons=True, show_labels=True)
        base[field] = bad
        with pytest.raises(ValidationError):
            WaybarConfig(**base)

    def test_invalid_position(self):
        with pytest.raises(ValidationError):
            WaybarConfig(kind="waybar", position="left", height=32, spacing=8, modules_left=[], modules_center=[], modules_right=[], show_icons=True, show_labels=True)


# ─── TerminalConfig (KittyConfig) ────────────────────────────────────────────


class TestTerminalConfig:
    def test_valid(self):
        cfg = KittyConfig(kind="kitty", font_family="JetBrains Mono", font_size=12, padding_x=12, padding_y=8, cursor_shape="block", cursor_blink=True)
        assert cfg.cursor_shape == "block"

    @pytest.mark.parametrize("shape", ["arrow", "ibeam", ""])
    def test_invalid_cursor_shape(self, shape: str):
        with pytest.raises(ValidationError):
            KittyConfig(kind="kitty", font_family="Mono", font_size=12, padding_x=8, padding_y=8, cursor_shape=shape, cursor_blink=False)

    @pytest.mark.parametrize("field,bad", [
        ("font_size", 5), ("font_size", 73),
        ("padding_x", -1), ("padding_x", 101),
        ("padding_y", -1), ("padding_y", 101),
    ])
    def test_range_violations(self, field: str, bad):
        base = dict(kind="kitty", font_family="Mono", font_size=12, padding_x=8, padding_y=8, cursor_shape="block", cursor_blink=False)
        base[field] = bad
        with pytest.raises(ValidationError):
            KittyConfig(**base)


# ─── AppLauncherConfig (discriminated union) ─────────────────────────────────


class TestAppLauncherConfig:
    def test_rofi_valid(self):
        cfg = RofiConfig(kind="rofi", mode="drun", width=600, lines=10, position="center", show_icons=True)
        assert cfg.kind == "rofi"

    def test_wofi_valid(self):
        cfg = WofiConfig(kind="wofi", width=600, height=400, show_icons=True)
        assert cfg.kind == "wofi"

    @pytest.mark.parametrize("bad_mode", ["run", "filebrowser", ""])
    def test_rofi_invalid_mode(self, bad_mode: str):
        with pytest.raises(ValidationError):
            RofiConfig(kind="rofi", mode=bad_mode, width=600, lines=10, position="center", show_icons=True)

    def test_unknown_kind_rejected(self):
        from pydantic import TypeAdapter
        ta = TypeAdapter(AppLauncherConfig)
        with pytest.raises(ValidationError):
            ta.validate_python({"kind": "dmenu", "width": 600})

    @pytest.mark.parametrize("field,bad", [
        ("width", 199), ("width", 2001), ("lines", 0), ("lines", 51),
    ])
    def test_rofi_range_violations(self, field: str, bad):
        base = dict(kind="rofi", mode="drun", width=600, lines=10, position="center", show_icons=True)
        base[field] = bad
        with pytest.raises(ValidationError):
            RofiConfig(**base)


# ─── LockScreenConfig (discriminated union) ───────────────────────────────────


class TestLockScreenConfig:
    def test_hyprlock_valid(self):
        cfg = HyprlockConfig(kind="hyprlock", theme="centered", background_color="#1d2021", blur=True, blur_size=10, clock=True, date_format="%H:%M", layout="center", layout_y="center")
        assert cfg.kind == "hyprlock"

    def test_swaylock_valid(self):
        cfg = SwaylockConfig(kind="swaylock", theme="minimal", color="#000000", blur=True, clock=True, layout="center", layout_y="center")
        assert cfg.kind == "swaylock"

    def test_sddm_valid(self):
        cfg = SddmConfig(kind="sddm", theme="simple", background_color="#1d2021", font="Geist Sans", show_logo=True, blur=False, blur_size=6, layout="center", layout_y="center")
        assert cfg.kind == "sddm"

    def test_hyprlock_invalid_hex(self):
        with pytest.raises(ValidationError):
            HyprlockConfig(kind="hyprlock", theme="t", background_color="blue", blur=False, blur_size=0, clock=False, date_format="%H:%M", layout="center", layout_y="center")

    def test_swaylock_invalid_layout(self):
        with pytest.raises(ValidationError):
            SwaylockConfig(kind="swaylock", theme="t", color="#000000", blur=False, clock=False, layout="middle", layout_y="center")

    def test_unknown_kind_rejected(self):
        from pydantic import TypeAdapter
        ta = TypeAdapter(LockScreenConfig)
        with pytest.raises(ValidationError):
            ta.validate_python({"kind": "gdm", "theme": "x"})


# ─── RiceConfig ───────────────────────────────────────────────────────────────


class TestRiceConfig:
    def test_valid_full_config(self, valid_config):
        cfg = RiceConfig.model_validate(valid_config)
        assert cfg.name == "My Rice"

    def test_name_empty(self, valid_config):
        valid_config["name"] = ""
        with pytest.raises(ValidationError):
            RiceConfig.model_validate(valid_config)

    def test_name_too_long(self, valid_config):
        valid_config["name"] = "A" * 101
        with pytest.raises(ValidationError):
            RiceConfig.model_validate(valid_config)

    def test_missing_section(self, valid_config):
        del valid_config["bar"]
        with pytest.raises(ValidationError):
            RiceConfig.model_validate(valid_config)

    def test_wrong_launcher_kind(self, valid_config):
        valid_config["launcher"]["kind"] = "albert"
        with pytest.raises(ValidationError):
            RiceConfig.model_validate(valid_config)

    def test_sddm_lockscreen(self, valid_config):
        valid_config["lockscreen"] = {"kind": "sddm", "theme": "simple", "background_color": "#1d2021", "font": "Geist Sans", "show_logo": True, "blur": False, "blur_size": 6, "layout": "center", "layout_y": "center"}
        cfg = RiceConfig.model_validate(valid_config)
        assert cfg.lockscreen.kind == "sddm"


# ─── GenerateRequest ──────────────────────────────────────────────────────────


class TestGenerateRequest:
    def test_valid(self, valid_config):
        req = GenerateRequest(rice_id="abc-123", user_id="user-uuid-456", config=RiceConfig.model_validate(valid_config))
        assert req.rice_id == "abc-123"

    def test_empty_rice_id(self, valid_config):
        with pytest.raises(ValidationError):
            GenerateRequest(rice_id="", user_id="uid", config=RiceConfig.model_validate(valid_config))

    def test_empty_user_id(self, valid_config):
        with pytest.raises(ValidationError):
            GenerateRequest(rice_id="rid", user_id="", config=RiceConfig.model_validate(valid_config))
