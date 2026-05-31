import pytest
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path

from app.models.rice_config import (
    RiceConfig, ColorPalette, FontConfig, HyprlandConfig, WaybarConfig,
    KittyConfig, RofiConfig, WofiConfig,
    HyprlockConfig, SwaylockConfig, SddmConfig,
)

TEMPLATES_DIR = Path(__file__).parent.parent / "app" / "templates"


@pytest.fixture
def jinja_env():
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape([]),
        trim_blocks=True,
        lstrip_blocks=True,
    )


def _base(
    launcher=None,
    lockscreen=None,
    wallpaper_tool="hyprpaper",
    wallpaper_image=None,
    mono_font="JetBrains Mono",
    heading_font="Geist Sans",
) -> RiceConfig:
    return RiceConfig(
        name="My Rice",
        colors=ColorPalette(
            accent="#7c6f64", background="#1d2021", foreground="#ebdbb2",
            border="#3c3836", surface="#282828",
        ),
        font=FontConfig(heading_family=heading_font, body_family="Geist Sans",
                        mono_family=mono_font, size=12),
        wm=HyprlandConfig(
            kind="hyprland", gaps_in=5, gaps_out=10, border_size=2, rounding=8,
            active_opacity=1.0, inactive_opacity=0.9, blur=True, blur_size=6,
            animations=True, shadow=True, wallpaper_tool=wallpaper_tool,
            wallpaper_image=wallpaper_image,
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
        launcher=launcher or RofiConfig(kind="rofi", mode="drun", width=600,
                                        lines=10, position="center", show_icons=True),
        lockscreen=lockscreen or HyprlockConfig(
            kind="hyprlock", theme="centered", background_color="#1d2021",
            blur=True, blur_size=10, clock=True, date_format="%H:%M",
            layout="center", layout_y="center",
        ),
    )


def render(jinja_env, config: RiceConfig) -> str:
    return jinja_env.get_template("install.sh.j2").render(config=config)


# ─── Base structure ───────────────────────────────────────────────────────────


class TestInstallScriptBase:
    def test_renders_without_error(self, jinja_env):
        out = render(jinja_env, _base())
        assert len(out) > 100

    def test_shebang(self, jinja_env):
        out = render(jinja_env, _base())
        assert out.startswith("#!/usr/bin/env bash")

    def test_set_euo_pipefail(self, jinja_env):
        out = render(jinja_env, _base())
        assert "set -euo pipefail" in out

    def test_arch_check(self, jinja_env):
        out = render(jinja_env, _base())
        assert "/etc/arch-release" in out

    def test_arch_check_exits_on_fail(self, jinja_env):
        out = render(jinja_env, _base())
        assert "die" in out or "exit 1" in out

    def test_contains_rice_name(self, jinja_env):
        out = render(jinja_env, _base())
        assert "My Rice" in out

    def test_backup_section(self, jinja_env):
        out = render(jinja_env, _base())
        assert "backup" in out
        assert ".config/hypr" in out
        assert ".config/waybar" in out
        assert ".config/kitty" in out

    def test_mkdir_section(self, jinja_env):
        out = render(jinja_env, _base())
        assert "mkdir -p" in out

    def test_success_message(self, jinja_env):
        out = render(jinja_env, _base())
        assert "successfully" in out
        assert "ricefy.org" in out


# ─── Pacman packages ─────────────────────────────────────────────────────────


class TestPacmanPackages:
    def test_hyprland_present(self, jinja_env):
        assert "hyprland" in render(jinja_env, _base())

    def test_waybar_present(self, jinja_env):
        assert "waybar" in render(jinja_env, _base())

    def test_kitty_present(self, jinja_env):
        assert "kitty" in render(jinja_env, _base())

    def test_dunst_present(self, jinja_env):
        assert "dunst" in render(jinja_env, _base())

    def test_pipewire_present(self, jinja_env):
        assert "pipewire" in render(jinja_env, _base())

    def test_networkmanager_present(self, jinja_env):
        assert "networkmanager" in render(jinja_env, _base())


# ─── Launcher selection ───────────────────────────────────────────────────────


class TestLauncherPackage:
    def test_rofi_wayland_when_rofi(self, jinja_env):
        out = render(jinja_env, _base(launcher=RofiConfig(
            kind="rofi", mode="drun", width=600, lines=10,
            position="center", show_icons=True,
        )))
        assert "rofi-wayland" in out

    def test_wofi_when_wofi(self, jinja_env):
        out = render(jinja_env, _base(launcher=WofiConfig(
            kind="wofi", width=600, height=400, show_icons=True,
        )))
        assert "wofi" in out
        assert "rofi-wayland" not in out

    def test_rofi_copy_command(self, jinja_env):
        out = render(jinja_env, _base())
        assert "config.rasi" in out

    def test_wofi_copy_commands(self, jinja_env):
        out = render(jinja_env, _base(launcher=WofiConfig(
            kind="wofi", width=600, height=400, show_icons=True,
        )))
        assert "wofi/config" in out
        assert "wofi/style.css" in out


# ─── Lockscreen selection ─────────────────────────────────────────────────────


class TestLockscreenPackage:
    def test_hyprlock_in_aur(self, jinja_env):
        out = render(jinja_env, _base(lockscreen=HyprlockConfig(
            kind="hyprlock", theme="t", background_color="#1d2021",
            blur=True, blur_size=10, clock=True, date_format="%H:%M",
            layout="center", layout_y="center",
        )))
        assert "hyprlock" in out
        assert "sddm" not in out

    def test_swaylock_in_packages(self, jinja_env):
        out = render(jinja_env, _base(lockscreen=SwaylockConfig(
            kind="swaylock", theme="minimal", color="#1d2021",
            blur=True, clock=True, layout="center", layout_y="center",
        )))
        assert "swaylock" in out

    def test_sddm_in_pacman(self, jinja_env):
        out = render(jinja_env, _base(lockscreen=SddmConfig(
            kind="sddm", theme="simple", background_color="#1d2021",
            font="Geist Sans", show_logo=True, blur=False, blur_size=6,
            layout="center", layout_y="center",
        )))
        assert "sddm" in out

    def test_hyprlock_copy_command(self, jinja_env):
        out = render(jinja_env, _base())
        assert "hyprlock.conf" in out

    def test_swaylock_copy_command(self, jinja_env):
        out = render(jinja_env, _base(lockscreen=SwaylockConfig(
            kind="swaylock", theme="minimal", color="#1d2021",
            blur=True, clock=True, layout="center", layout_y="center",
        )))
        assert "swaylock.conf" in out

    def test_sddm_copy_and_theme_dir(self, jinja_env):
        out = render(jinja_env, _base(lockscreen=SddmConfig(
            kind="sddm", theme="simple", background_color="#1d2021",
            font="Geist Sans", show_logo=True, blur=False, blur_size=6,
            layout="center", layout_y="center",
        )))
        assert "sddm.conf.d" in out
        assert "Main.qml" in out
        assert "theme.conf" in out


# ─── SDDM systemd service ─────────────────────────────────────────────────────


class TestSddmService:
    def test_sddm_enabled_when_sddm_lockscreen(self, jinja_env):
        out = render(jinja_env, _base(lockscreen=SddmConfig(
            kind="sddm", theme="simple", background_color="#1d2021",
            font="Geist Sans", show_logo=True, blur=False, blur_size=6,
            layout="center", layout_y="center",
        )))
        assert "systemctl enable sddm" in out

    def test_sddm_not_enabled_when_hyprlock(self, jinja_env):
        out = render(jinja_env, _base())
        assert "systemctl enable sddm" not in out

    def test_sddm_not_enabled_when_swaylock(self, jinja_env):
        out = render(jinja_env, _base(lockscreen=SwaylockConfig(
            kind="swaylock", theme="minimal", color="#1d2021",
            blur=True, clock=True, layout="center", layout_y="center",
        )))
        assert "systemctl enable sddm" not in out

    def test_networkmanager_always_enabled(self, jinja_env):
        out = render(jinja_env, _base())
        assert "enable --now NetworkManager" in out


# ─── Wallpaper tool ───────────────────────────────────────────────────────────


class TestWallpaperTool:
    def test_hyprpaper_in_pacman(self, jinja_env):
        out = render(jinja_env, _base(wallpaper_tool="hyprpaper"))
        assert "hyprpaper" in out

    def test_swaybg_in_pacman(self, jinja_env):
        out = render(jinja_env, _base(wallpaper_tool="swaybg"))
        assert "swaybg" in out

    def test_swww_in_aur(self, jinja_env):
        out = render(jinja_env, _base(wallpaper_tool="swww"))
        assert "swww" in out


# ─── AUR packages ─────────────────────────────────────────────────────────────


class TestAurPackages:
    def test_yay_block_present(self, jinja_env):
        out = render(jinja_env, _base())
        assert "yay" in out

    def test_paru_fallback_present(self, jinja_env):
        out = render(jinja_env, _base())
        assert "paru" in out

    def test_no_aur_helper_warning(self, jinja_env):
        out = render(jinja_env, _base())
        assert "No AUR helper found" in out

    def test_wlogout_in_aur(self, jinja_env):
        out = render(jinja_env, _base())
        assert "wlogout" in out


# ─── Font packages ────────────────────────────────────────────────────────────


class TestFontPackages:
    def test_jetbrains_mono_nerd(self, jinja_env):
        out = render(jinja_env, _base(mono_font="JetBrains Mono"))
        assert "ttf-jetbrains-mono-nerd" in out

    def test_fira_code_nerd(self, jinja_env):
        out = render(jinja_env, _base(mono_font="Fira Code"))
        assert "ttf-firacode-nerd" in out

    def test_hack_nerd(self, jinja_env):
        out = render(jinja_env, _base(mono_font="Hack Nerd Font"))
        assert "ttf-hack-nerd" in out

    def test_geist_sans(self, jinja_env):
        out = render(jinja_env, _base(heading_font="Geist Sans"))
        assert "ttf-geist" in out

    def test_noto_sans(self, jinja_env):
        out = render(jinja_env, _base(heading_font="Noto Sans"))
        assert "noto-fonts" in out


# ─── Copy commands ────────────────────────────────────────────────────────────


class TestCopyCommands:
    def test_hyprland_config_copied(self, jinja_env):
        out = render(jinja_env, _base())
        assert "hyprland/hyprland.lua" in out
        assert ".config/hypr/hyprland.lua" in out

    def test_waybar_config_copied(self, jinja_env):
        out = render(jinja_env, _base())
        assert "waybar/config" in out
        assert "waybar/style.css" in out

    def test_kitty_config_copied(self, jinja_env):
        out = render(jinja_env, _base())
        assert "kitty/kitty.conf" in out
        assert ".config/kitty/kitty.conf" in out

    def test_script_dir_variable_used(self, jinja_env):
        out = render(jinja_env, _base())
        assert "SCRIPT_DIR" in out
        assert 'BASH_SOURCE[0]' in out


# ─── Wallpaper image copy ─────────────────────────────────────────────────────


class TestWallpaperImage:
    def test_wallpaper_copy_present_when_image_set(self, jinja_env):
        out = render(jinja_env, _base(wallpaper_image="wallpaper.png"))
        assert 'cp "$SCRIPT_DIR/wallpaper"' in out

    def test_wallpaper_dest_uses_correct_extension_png(self, jinja_env):
        out = render(jinja_env, _base(wallpaper_image="bg.png"))
        assert "wallpaper.png" in out

    def test_wallpaper_dest_uses_correct_extension_jpg(self, jinja_env):
        out = render(jinja_env, _base(wallpaper_image="photo.jpg"))
        assert "wallpaper.jpg" in out

    def test_wallpaper_block_absent_when_no_image(self, jinja_env):
        out = render(jinja_env, _base(wallpaper_image=None))
        assert 'cp "$SCRIPT_DIR/wallpaper"' not in out

    def test_wallpaper_dest_no_bash_expansion_syntax(self, jinja_env):
        out = render(jinja_env, _base(wallpaper_image="bg.png"))
        assert "${config." not in out


# ─── Next steps message ───────────────────────────────────────────────────────


class TestNextSteps:
    def test_super_t_shortcut_mentioned(self, jinja_env):
        out = render(jinja_env, _base())
        assert "Super + T" in out

    def test_super_r_shortcut_mentioned(self, jinja_env):
        out = render(jinja_env, _base())
        assert "Super + R" in out

    def test_sddm_reboot_hint_when_sddm(self, jinja_env):
        out = render(jinja_env, _base(lockscreen=SddmConfig(
            kind="sddm", theme="simple", background_color="#1d2021",
            font="Geist Sans", show_logo=True, blur=False, blur_size=6,
            layout="center", layout_y="center",
        )))
        assert "reboot" in out

    def test_reboot_hint_when_no_sddm(self, jinja_env):
        out = render(jinja_env, _base())
        assert "reboot" in out

    def test_no_direct_hyprland_launch_hint(self, jinja_env):
        out = render(jinja_env, _base())
        assert "Start Hyprland: " not in out


class TestAutostartTTY1:
    def test_autostart_added_for_hyprlock(self, jinja_env):
        out = render(jinja_env, _base())
        assert "start-hyprland" in out
        assert "XDG_VTNR" in out

    def test_autostart_added_for_swaylock(self, jinja_env):
        from app.models.rice_config import SwaylockConfig
        out = render(jinja_env, _base(lockscreen=SwaylockConfig(
            kind="swaylock", theme="simple", color="#1d2021", blur=True,
            clock=True, layout="center", layout_y="center",
        )))
        assert "start-hyprland" in out
        assert "XDG_VTNR" in out

    def test_no_autostart_for_sddm(self, jinja_env):
        from app.models.rice_config import SddmConfig
        out = render(jinja_env, _base(lockscreen=SddmConfig(
            kind="sddm", theme="simple", background_color="#1d2021",
            font="Geist Sans", show_logo=True, blur=False, blur_size=6,
            layout="center", layout_y="center",
        )))
        assert "start-hyprland" not in out
        assert "XDG_VTNR" not in out
