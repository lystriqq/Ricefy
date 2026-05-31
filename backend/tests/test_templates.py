import pytest
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path

from app.models.rice_config import RiceConfig

TEMPLATES_DIR = Path(__file__).parent.parent / "app" / "templates"


@pytest.fixture
def jinja_env():
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape([]),
        trim_blocks=True,
        lstrip_blocks=True,
    )


@pytest.fixture
def default_config() -> RiceConfig:
    return RiceConfig.model_validate({
        "name": "My Rice",
        "colors": {"accent": "#7c6f64", "background": "#1d2021", "foreground": "#ebdbb2", "border": "#3c3836", "surface": "#282828"},
        "font": {"heading_family": "Geist Sans", "body_family": "Geist Sans", "mono_family": "JetBrains Mono", "size": 12},
        "wm": {"kind": "hyprland", "gaps_in": 5, "gaps_out": 10, "border_size": 2, "rounding": 8, "active_opacity": 1.0, "inactive_opacity": 0.9, "blur": True, "blur_size": 6, "animations": True, "shadow": True, "wallpaper_tool": "hyprpaper"},
        "bar": {"kind": "waybar", "position": "top", "height": 32, "spacing": 8, "modules_left": ["hyprland/workspaces"], "modules_center": ["clock"], "modules_right": ["battery", "network", "pulseaudio"], "show_icons": True, "show_labels": True},
        "terminal": {"kind": "kitty", "font_family": "JetBrains Mono", "font_size": 12, "padding_x": 12, "padding_y": 8, "cursor_shape": "block", "cursor_blink": True},
        "launcher": {"kind": "rofi", "mode": "drun", "width": 600, "lines": 10, "position": "center", "show_icons": True},
        "lockscreen": {"kind": "hyprlock", "theme": "centered", "background_color": "#1d2021", "blur": True, "blur_size": 10, "clock": True, "date_format": "%H:%M", "layout": "center", "layout_y": "center"},
    })


def render_hyprland(jinja_env, config: RiceConfig) -> str:
    tpl = jinja_env.get_template("hyprland/hyprland.lua.j2")
    return tpl.render(config=config)


# ─── Template rendering ───────────────────────────────────────────────────────


class TestHyprlandTemplateRenders:
    def test_renders_without_error(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert isinstance(output, str)
        assert len(output) > 100

    def test_contains_rice_name(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "My Rice" in output

    def test_is_valid_lua_structure(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "hl.config(" in output
        assert "hl.bind(" in output
        assert "hl.window_rule(" in output
        assert "hl.on(" in output
        assert "hl.monitor(" in output

    def test_monitor_uses_own_function(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "hl.monitor(" in output
        assert 'output   = ""' in output
        assert 'mode     = "preferred"' in output
        assert 'position = "auto"' in output


# ─── Section: general ────────────────────────────────────────────────────────


class TestGeneralSection:
    def test_gaps_in(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "gaps_in         = 5" in output

    def test_gaps_out(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "gaps_out        = 10" in output

    def test_border_size(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "border_size     = 2" in output

    def test_active_border_color(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert 'rgba(7c6f64ff)' in output

    def test_inactive_border_color(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert 'rgba(3c3836ff)' in output

    def test_no_raw_hash_in_colors(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        # colors should be injected as rgba(rrggbbaa), not #rrggbb
        assert '"#' not in output


# ─── Section: decoration ─────────────────────────────────────────────────────


class TestDecorationSection:
    def test_rounding(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "rounding         = 8" in output

    def test_active_opacity(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "active_opacity   = 1.0" in output

    def test_inactive_opacity(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "inactive_opacity = 0.9" in output

    def test_blur_enabled(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "enabled  = true" in output

    def test_blur_disabled(self, jinja_env, default_config):
        default_config.wm.blur = False
        output = render_hyprland(jinja_env, default_config)
        assert "enabled  = false" in output

    def test_blur_size(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "size     = 6" in output

    def test_shadow_enabled(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "enabled      = true" in output

    def test_shadow_disabled(self, jinja_env, default_config):
        default_config.wm.shadow = False
        output = render_hyprland(jinja_env, default_config)
        assert "enabled      = false" in output


# ─── Section: animations ─────────────────────────────────────────────────────


class TestAnimationsSection:
    def test_animations_enabled(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "enabled = true" in output
        assert "hl.curve(" in output
        assert "hl.animation(" in output

    def test_animations_disabled(self, jinja_env, default_config):
        default_config.wm.animations = False
        output = render_hyprland(jinja_env, default_config)
        assert "enabled = false" in output
        assert "hl.curve(" not in output
        assert "hl.animation(" not in output

    def test_bezier_curves_defined(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert 'hl.curve("easeOutQuint"' in output
        assert 'hl.curve("almostLinear"' in output

    def test_animation_leaves(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        for leaf in ("windows", "workspaces", "border", "layers", "fadeIn", "fadeOut"):
            assert f'leaf = "{leaf}"' in output


# ─── Section: input ───────────────────────────────────────────────────────────


class TestInputSection:
    def test_input_section_present(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "kb_layout" in output
        assert "sensitivity" in output
        assert "touchpad" in output

    def test_window_rules_use_bool(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "float = true" in output
        assert "float = {}" not in output


# ─── Section: keybindings ────────────────────────────────────────────────────


class TestKeybindings:
    def test_terminal_bind(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "kitty" in output

    def test_launcher_rofi(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "rofi -show drun" in output

    def test_launcher_wofi(self, jinja_env, default_config):
        default_config.launcher = default_config.launcher.model_copy(update={"kind": "wofi"})  # type: ignore[arg-type]
        from app.models.rice_config import WofiConfig
        default_config.launcher = WofiConfig(kind="wofi", width=600, height=400, show_icons=True)
        output = render_hyprland(jinja_env, default_config)
        assert "wofi --show drun" in output

    def test_close_bind(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "window.close()" in output

    def test_focus_binds(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert 'direction = "l"' in output
        assert 'direction = "r"' in output
        assert 'direction = "u"' in output
        assert 'direction = "d"' in output

    def test_workspace_binds_1_to_9(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "workspace = 1" in output
        assert "workspace = 9" in output

    def test_mouse_binds(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "mouse:272" in output
        assert "mouse:273" in output

    def test_media_keys(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "XF86AudioRaiseVolume" in output
        assert "XF86MonBrightnessUp" in output


# ─── Section: exec-once ──────────────────────────────────────────────────────


class TestAutostart:
    def test_waybar_started(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "waybar" in output

    def test_dunst_started(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "dunst" in output

    def test_no_wallpaper_cmd_when_no_image(self, jinja_env, default_config):
        assert default_config.wm.wallpaper_image is None
        output = render_hyprland(jinja_env, default_config)
        assert "swww img" not in output
        assert "swaybg -i" not in output

    def test_hyprpaper_with_image(self, jinja_env, default_config):
        default_config.wm.wallpaper_image = "/home/user/wall.jpg"
        default_config.wm.wallpaper_tool = "hyprpaper"
        output = render_hyprland(jinja_env, default_config)
        assert "hyprpaper" in output

    def test_swww_with_image(self, jinja_env, default_config):
        default_config.wm.wallpaper_image = "/home/user/wall.jpg"
        default_config.wm.wallpaper_tool = "swww"
        output = render_hyprland(jinja_env, default_config)
        assert "swww-daemon" in output
        assert "swww img /home/user/wall.jpg" in output

    def test_swaybg_with_image(self, jinja_env, default_config):
        default_config.wm.wallpaper_image = "/home/user/wall.jpg"
        default_config.wm.wallpaper_tool = "swaybg"
        output = render_hyprland(jinja_env, default_config)
        assert "swaybg -i /home/user/wall.jpg" in output


# ─── Section: window rules ────────────────────────────────────────────────────


class TestWindowRules:
    def test_rofi_float(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert 'class = "^(rofi)$"' in output

    def test_wofi_float(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert 'class = "^(wofi)$"' in output

    def test_common_floats(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        for app in ("pavucontrol", "blueman-manager", "nm-connection-editor"):
            assert app in output

    def test_pip_float_and_pin(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "Picture-in-Picture" in output


# ─── Section: monitor ────────────────────────────────────────────────────────


class TestMonitorSection:
    def test_monitor_section_present(self, jinja_env, default_config):
        output = render_hyprland(jinja_env, default_config)
        assert "monitor" in output
        assert "preferred" in output
        assert "auto" in output


# ═══════════════════════════════════════════════════════════════════════════════
# Waybar templates
# ═══════════════════════════════════════════════════════════════════════════════


def render_waybar_config(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("waybar/config.j2").render(config=config)


def render_waybar_css(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("waybar/style.css.j2").render(config=config)


# ─── config.j2 : structure JSON ──────────────────────────────────────────────


class TestWaybarConfigRenders:
    def test_renders_without_error(self, jinja_env, default_config):
        out = render_waybar_config(jinja_env, default_config)
        assert len(out) > 100

    def test_valid_json(self, jinja_env, default_config):
        import json
        out = render_waybar_config(jinja_env, default_config)
        parsed = json.loads(out)
        assert isinstance(parsed, dict)

    def test_top_level_keys(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        for key in ("layer", "position", "height", "spacing", "modules-left", "modules-center", "modules-right"):
            assert key in parsed, f"missing key: {key}"

    def test_position(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["position"] == "top"

    def test_position_bottom(self, jinja_env, default_config):
        import json
        default_config.bar.position = "bottom"
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["position"] == "bottom"

    def test_height(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["height"] == 32

    def test_spacing(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["spacing"] == 8


class TestWaybarModuleLists:
    def test_modules_left(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["modules-left"] == ["hyprland/workspaces"]

    def test_modules_center(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["modules-center"] == ["clock"]

    def test_modules_right(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["modules-right"] == ["battery", "network", "pulseaudio"]

    def test_empty_module_list(self, jinja_env, default_config):
        import json
        default_config.bar.modules_center = []
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["modules-center"] == []

    def test_all_modules_present(self, jinja_env, default_config):
        import json
        default_config.bar.modules_left = [
            "hyprland/workspaces", "hyprland/window", "hyprland/taskbar",
            "hyprland/submap", "custom/separator",
        ]
        default_config.bar.modules_center = ["clock", "custom/date"]
        default_config.bar.modules_right = [
            "cpu", "memory", "disk", "temperature",
            "network", "bluetooth", "battery", "pulseaudio", "tray", "custom/power",
        ]
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert len(parsed["modules-left"]) == 5
        assert len(parsed["modules-right"]) == 10


class TestWaybarModuleConfigs:
    def test_clock_config_present(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert "clock" in parsed
        assert "format" in parsed["clock"]
        assert "interval" in parsed["clock"]

    def test_battery_states(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert "battery" in parsed
        assert parsed["battery"]["states"]["warning"] == 30
        assert parsed["battery"]["states"]["critical"] == 15

    def test_pulseaudio_on_click(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["pulseaudio"]["on-click"] == "pavucontrol"

    def test_tray_spacing_matches_bar(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["tray"]["spacing"] == default_config.bar.spacing

    def test_network_on_click(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["network"]["on-click"] == "nm-connection-editor"

    def test_bluetooth_on_click(self, jinja_env, default_config):
        import json
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert parsed["bluetooth"]["on-click"] == "blueman-manager"


class TestWaybarFormatStrings:
    def test_icons_and_labels(self, jinja_env, default_config):
        import json
        default_config.bar.show_icons = True
        default_config.bar.show_labels = True
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert "◷" in parsed["clock"]["format"]
        assert "%H:%M" in parsed["clock"]["format"]

    def test_icons_only(self, jinja_env, default_config):
        import json
        default_config.bar.show_icons = True
        default_config.bar.show_labels = False
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert "◷" in parsed["clock"]["format"]
        assert "%H:%M" not in parsed["clock"]["format"]

    def test_labels_only(self, jinja_env, default_config):
        import json
        default_config.bar.show_icons = False
        default_config.bar.show_labels = True
        parsed = json.loads(render_waybar_config(jinja_env, default_config))
        assert "◷" not in parsed["clock"]["format"]
        assert "%H:%M" in parsed["clock"]["format"]


# ─── style.css.j2 ─────────────────────────────────────────────────────────────


class TestWaybarCSSRenders:
    def test_renders_without_error(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert len(out) > 100

    def test_contains_css_variables(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert ":root" in out
        assert "--background" in out
        assert "--accent" in out
        assert "--foreground" in out
        assert "--border" in out
        assert "--surface" in out


class TestWaybarCSSColors:
    def test_palette_accent_injected(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "#7c6f64" in out

    def test_palette_background_injected(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "#1d2021" in out

    def test_different_palette(self, jinja_env, default_config):
        from app.models.rice_config import ColorPalette
        default_config.colors = ColorPalette(
            accent="#458588",
            background="#282828",
            foreground="#ebdbb2",
            border="#504945",
            surface="#3c3836",
        )
        out = render_waybar_css(jinja_env, default_config)
        assert "#458588" in out
        assert "#282828" in out
        assert "#504945" in out

    def test_font_family_injected(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "JetBrains Mono" in out

    def test_font_size_injected(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert f"{default_config.font.size}px" in out

    def test_bar_height_injected(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert f"{default_config.bar.height}px" in out


class TestWaybarCSSStructure:
    def test_waybar_selector(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "#waybar" in out

    def test_modules_selectors(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert ".modules-left" in out
        assert ".modules-center" in out
        assert ".modules-right" in out

    def test_workspaces_active_style(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "#workspaces button.active" in out

    def test_workspaces_urgent_style(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "#workspaces button.urgent" in out

    def test_battery_warning_style(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "#battery.warning" in out

    def test_battery_critical_style(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "#battery.critical" in out

    def test_hover_styles_present(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert ":hover" in out

    def test_border_direction_top(self, jinja_env, default_config):
        default_config.bar.position = "top"
        out = render_waybar_css(jinja_env, default_config)
        assert "border-bottom" in out

    def test_border_direction_bottom(self, jinja_env, default_config):
        default_config.bar.position = "bottom"
        out = render_waybar_css(jinja_env, default_config)
        assert "border-top" in out

    def test_blink_animation(self, jinja_env, default_config):
        out = render_waybar_css(jinja_env, default_config)
        assert "@keyframes blink" in out

    def test_radius_derived_from_wm(self, jinja_env, default_config):
        default_config.wm.rounding = 16
        out = render_waybar_css(jinja_env, default_config)
        assert "--radius:      8px" in out  # min(16//2=8, 8) = 8

    def test_radius_small_rounding(self, jinja_env, default_config):
        default_config.wm.rounding = 4
        out = render_waybar_css(jinja_env, default_config)
        assert "--radius:      2px" in out  # min(4//2=2, 8) = 2


# ═══════════════════════════════════════════════════════════════════════════════
# Kitty template
# ═══════════════════════════════════════════════════════════════════════════════


from app.services.color_utils import derive_terminal_colors
from app.models.rice_config import ColorPalette


def render_kitty(jinja_env, config: RiceConfig) -> str:
    term_colors = derive_terminal_colors(config.colors)
    return jinja_env.get_template("kitty/kitty.conf.j2").render(
        config=config,
        term_colors=term_colors,
    )


class TestKittyRenders:
    def test_renders_without_error(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert len(out) > 100

    def test_contains_rice_name(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "My Rice" in out


class TestKittyFont:
    def test_font_family(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "font_family      JetBrains Mono" in out

    def test_font_size(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "font_size        12.0" in out

    def test_bold_italic_auto(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "bold_font        auto" in out
        assert "italic_font      auto" in out

    def test_different_font(self, jinja_env, default_config):
        default_config.terminal.font_family = "Fira Code"
        out = render_kitty(jinja_env, default_config)
        assert "font_family      Fira Code" in out


class TestKittyCursor:
    def test_cursor_shape_block(self, jinja_env, default_config):
        default_config.terminal.cursor_shape = "block"
        out = render_kitty(jinja_env, default_config)
        assert "cursor_shape     block" in out

    def test_cursor_shape_beam(self, jinja_env, default_config):
        default_config.terminal.cursor_shape = "beam"
        out = render_kitty(jinja_env, default_config)
        assert "cursor_shape     beam" in out

    def test_cursor_shape_underline(self, jinja_env, default_config):
        default_config.terminal.cursor_shape = "underline"
        out = render_kitty(jinja_env, default_config)
        assert "cursor_shape     underline" in out

    def test_blink_enabled(self, jinja_env, default_config):
        default_config.terminal.cursor_blink = True
        out = render_kitty(jinja_env, default_config)
        assert "cursor_blink_interval      0.5" in out

    def test_blink_disabled(self, jinja_env, default_config):
        default_config.terminal.cursor_blink = False
        out = render_kitty(jinja_env, default_config)
        assert "cursor_blink_interval      0" in out
        assert "0.5" not in out


class TestKittyWindow:
    def test_padding(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "window_padding_width       8 12" in out

    def test_custom_padding(self, jinja_env, default_config):
        default_config.terminal.padding_x = 20
        default_config.terminal.padding_y = 10
        out = render_kitty(jinja_env, default_config)
        assert "window_padding_width       10 20" in out

    def test_scrollback_lines(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "scrollback_lines           2000" in out


class TestKittyColors:
    def test_background_color(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "background              #1d2021" in out

    def test_foreground_color(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "foreground              #ebdbb2" in out

    def test_selection_background_is_accent(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "selection_background    #7c6f64" in out

    def test_cursor_is_accent(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "cursor                  #7c6f64" in out

    def test_all_16_color_slots(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        for i in range(16):
            assert f"color{i}" in out, f"missing color{i}"

    def test_color0_is_background(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "color0   #1d2021" in out

    def test_color7_is_foreground(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "color7   #ebdbb2" in out

    def test_color8_is_surface(self, jinja_env, default_config):
        out = render_kitty(jinja_env, default_config)
        assert "color8   #282828" in out

    def test_nord_palette(self, jinja_env, default_config):
        default_config.colors = ColorPalette(
            accent="#88c0d0",
            background="#2e3440",
            foreground="#d8dee9",
            border="#3b4252",
            surface="#434c5e",
        )
        out = render_kitty(jinja_env, default_config)
        assert "background              #2e3440" in out
        assert "color0   #2e3440" in out
        assert "color8   #434c5e" in out

    def test_dracula_palette(self, jinja_env, default_config):
        default_config.colors = ColorPalette(
            accent="#bd93f9",
            background="#282a36",
            foreground="#f8f8f2",
            border="#44475a",
            surface="#44475a",
        )
        out = render_kitty(jinja_env, default_config)
        assert "background              #282a36" in out
        assert "color0   #282a36" in out


# ═══════════════════════════════════════════════════════════════════════════════
# Rofi template
# ═══════════════════════════════════════════════════════════════════════════════


from app.models.rice_config import RofiConfig, WofiConfig


def render_rofi(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("rofi/config.rasi.j2").render(config=config)


def render_wofi_config(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("wofi/config.j2").render(config=config)


def render_wofi_css(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("wofi/style.css.j2").render(config=config)


@pytest.fixture
def rofi_config(default_config) -> RiceConfig:
    default_config.launcher = RofiConfig(
        kind="rofi", mode="drun", width=600, lines=10,
        position="center", show_icons=True,
    )
    return default_config


@pytest.fixture
def wofi_config(default_config) -> RiceConfig:
    default_config.launcher = WofiConfig(kind="wofi", width=600, height=400, show_icons=True)
    return default_config


class TestRofiRenders:
    def test_renders_without_error(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert len(out) > 100

    def test_contains_rice_name(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "My Rice" in out


class TestRofiConfiguration:
    def test_modi_drun(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert 'modi:                "drun"' in out

    def test_modi_launcher_maps_to_drun_run(self, jinja_env, rofi_config):
        rofi_config.launcher.mode = "launcher"
        out = render_rofi(jinja_env, rofi_config)
        assert 'modi:                "drun,run"' in out

    def test_modi_window(self, jinja_env, rofi_config):
        rofi_config.launcher.mode = "window"
        out = render_rofi(jinja_env, rofi_config)
        assert 'modi:                "window"' in out

    def test_modi_dmenu(self, jinja_env, rofi_config):
        rofi_config.launcher.mode = "dmenu"
        out = render_rofi(jinja_env, rofi_config)
        assert 'modi:                "dmenu"' in out

    def test_font(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert 'font:                "JetBrains Mono 12"' in out

    def test_show_icons_true(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "show-icons:          true" in out

    def test_show_icons_false(self, jinja_env, rofi_config):
        rofi_config.launcher.show_icons = False
        out = render_rofi(jinja_env, rofi_config)
        assert "show-icons:          false" in out

    def test_location_center(self, jinja_env, rofi_config):
        rofi_config.launcher.position = "center"
        out = render_rofi(jinja_env, rofi_config)
        assert "location:            0" in out

    def test_location_left(self, jinja_env, rofi_config):
        rofi_config.launcher.position = "left"
        out = render_rofi(jinja_env, rofi_config)
        assert "location:            7" in out

    def test_location_right(self, jinja_env, rofi_config):
        rofi_config.launcher.position = "right"
        out = render_rofi(jinja_env, rofi_config)
        assert "location:            3" in out


class TestRofiWindow:
    def test_width(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "width:               600px" in out

    def test_custom_width(self, jinja_env, rofi_config):
        rofi_config.launcher.width = 800
        out = render_rofi(jinja_env, rofi_config)
        assert "width:               800px" in out

    def test_window_location_center(self, jinja_env, rofi_config):
        rofi_config.launcher.position = "center"
        out = render_rofi(jinja_env, rofi_config)
        assert "location:            center" in out

    def test_window_location_west(self, jinja_env, rofi_config):
        rofi_config.launcher.position = "left"
        out = render_rofi(jinja_env, rofi_config)
        assert "location:            west" in out

    def test_window_location_east(self, jinja_env, rofi_config):
        rofi_config.launcher.position = "right"
        out = render_rofi(jinja_env, rofi_config)
        assert "location:            east" in out

    def test_border_radius_from_wm(self, jinja_env, rofi_config):
        rofi_config.wm.rounding = 16
        out = render_rofi(jinja_env, rofi_config)
        assert "radius:              8px" in out  # min(16//2=8, 8) = 8

    def test_border_radius_small(self, jinja_env, rofi_config):
        rofi_config.wm.rounding = 4
        out = render_rofi(jinja_env, rofi_config)
        assert "radius:              2px" in out  # min(4//2=2, 8) = 2


class TestRofiColors:
    def test_background_in_global(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "background-color:    #1d2021" in out

    def test_foreground_in_global(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "foreground:          #ebdbb2" in out

    def test_accent_in_global(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "accent-color:        #7c6f64" in out

    def test_border_in_global(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "border-color:        #3c3836" in out

    def test_surface_in_global(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "surface-color:       #282828" in out


class TestRofiSections:
    def test_mainbox_present(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "mainbox {" in out

    def test_inputbar_present(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "inputbar {" in out

    def test_listview_lines(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "lines:               10" in out

    def test_listview_custom_lines(self, jinja_env, rofi_config):
        rofi_config.launcher.lines = 15
        out = render_rofi(jinja_env, rofi_config)
        assert "lines:               15" in out

    def test_element_selected_uses_accent(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "element selected.normal {" in out
        assert "background-color:    @accent-color" in out

    def test_scrollbar_present(self, jinja_env, rofi_config):
        out = render_rofi(jinja_env, rofi_config)
        assert "scrollbar {" in out


# ═══════════════════════════════════════════════════════════════════════════════
# Wofi templates
# ═══════════════════════════════════════════════════════════════════════════════


class TestWofiConfigRenders:
    def test_renders_without_error(self, jinja_env, wofi_config):
        out = render_wofi_config(jinja_env, wofi_config)
        assert len(out) > 50

    def test_width(self, jinja_env, wofi_config):
        out = render_wofi_config(jinja_env, wofi_config)
        assert "width=600" in out

    def test_height(self, jinja_env, wofi_config):
        out = render_wofi_config(jinja_env, wofi_config)
        assert "height=400" in out

    def test_custom_dimensions(self, jinja_env, wofi_config):
        wofi_config.launcher.width = 800
        wofi_config.launcher.height = 500
        out = render_wofi_config(jinja_env, wofi_config)
        assert "width=800" in out
        assert "height=500" in out

    def test_show_icons_true(self, jinja_env, wofi_config):
        out = render_wofi_config(jinja_env, wofi_config)
        assert "allow_images=true" in out

    def test_show_icons_false(self, jinja_env, wofi_config):
        wofi_config.launcher.show_icons = False
        out = render_wofi_config(jinja_env, wofi_config)
        assert "allow_images=false" in out

    def test_required_keys_present(self, jinja_env, wofi_config):
        out = render_wofi_config(jinja_env, wofi_config)
        for key in ("show=drun", "location=center", "gtk_dark=true", "filter_rate=100"):
            assert key in out, f"missing: {key}"


class TestWofiCSSRenders:
    def test_renders_without_error(self, jinja_env, wofi_config):
        out = render_wofi_css(jinja_env, wofi_config)
        assert len(out) > 100

    def test_background_color(self, jinja_env, wofi_config):
        out = render_wofi_css(jinja_env, wofi_config)
        assert "background-color:   #1d2021" in out

    def test_foreground_color(self, jinja_env, wofi_config):
        out = render_wofi_css(jinja_env, wofi_config)
        assert "color:              #ebdbb2" in out

    def test_accent_on_selected(self, jinja_env, wofi_config):
        out = render_wofi_css(jinja_env, wofi_config)
        assert "#entry:selected {" in out
        assert "background-color:   #7c6f64" in out

    def test_font_family(self, jinja_env, wofi_config):
        out = render_wofi_css(jinja_env, wofi_config)
        assert '"JetBrains Mono"' in out

    def test_font_size(self, jinja_env, wofi_config):
        out = render_wofi_css(jinja_env, wofi_config)
        assert "font-size:          12px" in out

    def test_border_radius(self, jinja_env, wofi_config):
        wofi_config.wm.rounding = 16
        out = render_wofi_css(jinja_env, wofi_config)
        assert "border-radius:      8px" in out

    def test_css_selectors_present(self, jinja_env, wofi_config):
        out = render_wofi_css(jinja_env, wofi_config)
        for sel in ("window", "#input", "#entry", "#entry:selected", "#text:selected", "#img"):
            assert sel in out, f"missing selector: {sel}"

    def test_different_palette(self, jinja_env, wofi_config):
        wofi_config.colors = ColorPalette(
            accent="#88c0d0", background="#2e3440",
            foreground="#d8dee9", border="#3b4252", surface="#434c5e",
        )
        out = render_wofi_css(jinja_env, wofi_config)
        assert "#2e3440" in out
        assert "#88c0d0" in out


# ═══════════════════════════════════════════════════════════════════════════════
# Lockscreen templates
# ═══════════════════════════════════════════════════════════════════════════════

from app.models.rice_config import HyprlockConfig, SwaylockConfig, SddmConfig


def render_hyprlock(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("hyprlock/hyprlock.conf.j2").render(config=config)


def render_swaylock(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("swaylock/swaylock.conf.j2").render(config=config)


def render_sddm_conf(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("sddm/theme.conf.j2").render(config=config)


def render_sddm_qml(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("sddm/Main.qml.j2").render(config=config)


@pytest.fixture
def hyprlock_config(default_config) -> RiceConfig:
    default_config.lockscreen = HyprlockConfig(
        kind="hyprlock", theme="centered", background_color="#1d2021",
        blur=True, blur_size=10, clock=True, date_format="%H:%M",
        layout="center", layout_y="center",
    )
    return default_config


@pytest.fixture
def swaylock_config(default_config) -> RiceConfig:
    default_config.lockscreen = SwaylockConfig(
        kind="swaylock", theme="minimal", color="#1d2021",
        blur=True, clock=True, layout="center", layout_y="center",
    )
    return default_config


@pytest.fixture
def sddm_cfg(default_config) -> RiceConfig:
    default_config.lockscreen = SddmConfig(
        kind="sddm", theme="simple", background_color="#1d2021",
        font="Geist Sans", show_logo=True, blur=False, blur_size=6,
        layout="center", layout_y="center",
    )
    return default_config


# ─── Hyprlock ─────────────────────────────────────────────────────────────────


class TestHyprlockRenders:
    def test_renders_without_error(self, jinja_env, hyprlock_config):
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert len(out) > 50

    def test_contains_rice_name(self, jinja_env, hyprlock_config):
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "My Rice" in out


class TestHyprlockBackground:
    def test_background_color_rgba(self, jinja_env, hyprlock_config):
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "rgba(1d2021ff)" in out

    def test_no_image_uses_screenshot(self, jinja_env, hyprlock_config):
        assert hyprlock_config.lockscreen.background_image is None
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "path    = screenshot" in out

    def test_with_image_overrides_screenshot(self, jinja_env, hyprlock_config):
        hyprlock_config.lockscreen.background_image = "/home/user/wall.jpg"
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "path    = /home/user/wall.jpg" in out
        assert "screenshot" not in out

    def test_blur_enabled(self, jinja_env, hyprlock_config):
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "blur_size        = 10" in out
        assert "blur_passes      = 2" in out

    def test_blur_disabled(self, jinja_env, hyprlock_config):
        hyprlock_config.lockscreen.blur = False
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "blur_passes      = 0" in out
        assert "blur_size" not in out


class TestHyprlockInputField:
    def test_accent_color_outer(self, jinja_env, hyprlock_config):
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "outer_color      = rgba(7c6f64ff)" in out

    def test_surface_color_inner(self, jinja_env, hyprlock_config):
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "inner_color      = rgba(282828ff)" in out

    def test_rounding_from_wm(self, jinja_env, hyprlock_config):
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert f"rounding         = {hyprlock_config.wm.rounding}" in out

    def test_halign_center(self, jinja_env, hyprlock_config):
        hyprlock_config.lockscreen.layout = "center"
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "halign           = center" in out

    def test_halign_left(self, jinja_env, hyprlock_config):
        hyprlock_config.lockscreen.layout = "left"
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "halign           = left" in out

    def test_halign_right(self, jinja_env, hyprlock_config):
        hyprlock_config.lockscreen.layout = "right"
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "halign           = right" in out


class TestHyprlockClock:
    def test_clock_label_when_enabled(self, jinja_env, hyprlock_config):
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "label {" in out
        assert "%H:%M" in out

    def test_clock_absent_when_disabled(self, jinja_env, hyprlock_config):
        hyprlock_config.lockscreen.clock = False
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "label {" not in out

    def test_date_format_injected(self, jinja_env, hyprlock_config):
        hyprlock_config.lockscreen.date_format = "%d/%m/%Y"
        out = render_hyprlock(jinja_env, hyprlock_config)
        assert "%d/%m/%Y" in out


# ─── Swaylock ─────────────────────────────────────────────────────────────────


class TestSwaylockRenders:
    def test_renders_without_error(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert len(out) > 50

    def test_contains_rice_name(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "My Rice" in out


class TestSwaylockColors:
    def test_background_color_no_hash(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "color=1d2021ff" in out

    def test_ring_color_is_accent(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "ring-color=7c6f64ff" in out

    def test_text_color_is_foreground(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "text-color=ebdbb2ff" in out

    def test_wrong_color_is_red(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "ring-wrong-color=cc241dff" in out


class TestSwaylockOptions:
    def test_ignore_empty_password(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "ignore-empty-password" in out

    def test_show_failed_attempts(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "show-failed-attempts" in out

    def test_blur_enabled(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "effect-blur=" in out

    def test_blur_disabled(self, jinja_env, swaylock_config):
        swaylock_config.lockscreen.blur = False
        out = render_swaylock(jinja_env, swaylock_config)
        assert "effect-blur=" not in out

    def test_clock_enabled(self, jinja_env, swaylock_config):
        out = render_swaylock(jinja_env, swaylock_config)
        assert "clock" in out
        assert "time-format=%H:%M" in out

    def test_clock_disabled(self, jinja_env, swaylock_config):
        swaylock_config.lockscreen.clock = False
        out = render_swaylock(jinja_env, swaylock_config)
        assert "time-format" not in out

    def test_image_absent_by_default(self, jinja_env, swaylock_config):
        assert swaylock_config.lockscreen.background_image is None
        out = render_swaylock(jinja_env, swaylock_config)
        assert "image=" not in out

    def test_image_injected_when_set(self, jinja_env, swaylock_config):
        swaylock_config.lockscreen.background_image = "/home/user/bg.png"
        out = render_swaylock(jinja_env, swaylock_config)
        assert "image=/home/user/bg.png" in out


# ─── SDDM theme.conf ─────────────────────────────────────────────────────────


class TestSddmConfRenders:
    def test_renders_without_error(self, jinja_env, sddm_cfg):
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert len(out) > 50

    def test_general_section(self, jinja_env, sddm_cfg):
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "[General]" in out


class TestSddmConfValues:
    def test_background_color_when_no_image(self, jinja_env, sddm_cfg):
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "Background=#1d2021" in out

    def test_background_image_when_set(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.background_image = "/usr/share/backgrounds/bg.jpg"
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "Background=/usr/share/backgrounds/bg.jpg" in out

    def test_font(self, jinja_env, sddm_cfg):
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "Font=Geist Sans" in out

    def test_font_size(self, jinja_env, sddm_cfg):
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert f"FontSize={sddm_cfg.font.size}" in out

    def test_form_position_center(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.layout = "center"
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "FormPosition=center" in out

    def test_form_position_left(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.layout = "left"
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "FormPosition=left" in out

    def test_form_position_right(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.layout = "right"
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "FormPosition=right" in out

    def test_blur_true(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.blur = True
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "FullBlur=true" in out

    def test_blur_false(self, jinja_env, sddm_cfg):
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "FullBlur=false" in out

    def test_form_background_color(self, jinja_env, sddm_cfg):
        out = render_sddm_conf(jinja_env, sddm_cfg)
        assert "FormBackgroundColor=#282828" in out


# ─── SDDM Main.qml ────────────────────────────────────────────────────────────


class TestSddmQmlRenders:
    def test_renders_without_error(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert len(out) > 100

    def test_contains_rice_name(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "My Rice" in out

    def test_qml_imports(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "import QtQuick" in out
        assert "import SddmComponents" in out

    def test_sddm_login_call(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "sddm.login(" in out

    def test_background_color(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert '"#1d2021"' in out

    def test_accent_on_button(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert '"#7c6f64"' in out

    def test_username_field(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "usernameInput" in out

    def test_password_field(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "passwordInput" in out
        assert "TextInput.Password" in out

    def test_no_image_when_none(self, jinja_env, sddm_cfg):
        assert sddm_cfg.lockscreen.background_image is None
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "Image {" not in out

    def test_image_block_when_set(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.background_image = "/usr/share/bg.jpg"
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "Image {" in out
        assert "/usr/share/bg.jpg" in out

    def test_logo_shown_when_enabled(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "My Rice" in out

    def test_logo_hidden_when_disabled(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.show_logo = False
        out = render_sddm_qml(jinja_env, sddm_cfg)
        # name should appear only in comment, not as title text
        count = out.count('"My Rice"')
        assert count == 0

    def test_form_font(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert '"Geist Sans"' in out

    def test_anchor_center(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.layout = "center"
        sddm_cfg.lockscreen.layout_y = "center"
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "anchors.horizontalCenter: parent.horizontalCenter" in out
        assert "anchors.verticalCenter: parent.verticalCenter" in out

    def test_anchor_left(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.layout = "left"
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "anchors.left: parent.left" in out

    def test_anchor_right(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.layout = "right"
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "anchors.right: parent.right" in out

    def test_anchor_top(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.layout_y = "top"
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "anchors.top: parent.top" in out

    def test_anchor_bottom(self, jinja_env, sddm_cfg):
        sddm_cfg.lockscreen.layout_y = "bottom"
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "anchors.bottom: parent.bottom" in out

    def test_error_label_present(self, jinja_env, sddm_cfg):
        out = render_sddm_qml(jinja_env, sddm_cfg)
        assert "errorLabel" in out
