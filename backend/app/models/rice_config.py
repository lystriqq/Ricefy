import re
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field, field_validator


# ─── Helpers ──────────────────────────────────────────────────────────────────

_HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _validate_hex(v: str) -> str:
    if not _HEX_RE.match(v):
        raise ValueError(f"'{v}' is not a valid hex color (#rrggbb)")
    return v.lower()


HexColor = Annotated[str, Field(pattern=r"^#[0-9a-fA-F]{6}$")]


# ─── Color Palette ────────────────────────────────────────────────────────────

class ColorPalette(BaseModel):
    accent: HexColor
    background: HexColor
    foreground: HexColor
    border: HexColor
    surface: HexColor

    @field_validator("accent", "background", "foreground", "border", "surface", mode="before")
    @classmethod
    def normalize_hex(cls, v: str) -> str:
        return _validate_hex(v)


# ─── Font Config ──────────────────────────────────────────────────────────────

class FontConfig(BaseModel):
    heading_family: str = Field(min_length=1, max_length=100)
    body_family: str = Field(min_length=1, max_length=100)
    mono_family: str = Field(min_length=1, max_length=100)
    size: int = Field(ge=6, le=72)


# ─── WM Config ────────────────────────────────────────────────────────────────

class HyprlandConfig(BaseModel):
    kind: Literal["hyprland"]
    gaps_in: int = Field(ge=0, le=100)
    gaps_out: int = Field(ge=0, le=100)
    border_size: int = Field(ge=0, le=20)
    rounding: int = Field(ge=0, le=50)
    active_opacity: float = Field(ge=0.0, le=1.0)
    inactive_opacity: float = Field(ge=0.0, le=1.0)
    blur: bool
    blur_size: int = Field(ge=0, le=20)
    animations: bool
    shadow: bool
    wallpaper_image: str | None = None
    wallpaper_tool: Literal["hyprpaper", "swww", "swaybg"]


WMConfig = HyprlandConfig


# ─── Bar Config ───────────────────────────────────────────────────────────────

WaybarModule = Literal[
    "hyprland/workspaces",
    "hyprland/window",
    "hyprland/taskbar",
    "hyprland/submap",
    "clock",
    "custom/date",
    "custom/separator",
    "cpu",
    "memory",
    "disk",
    "temperature",
    "network",
    "bluetooth",
    "battery",
    "pulseaudio",
    "tray",
    "custom/power",
]


class WaybarConfig(BaseModel):
    kind: Literal["waybar"]
    position: Literal["top", "bottom"]
    height: int = Field(ge=16, le=80)
    spacing: int = Field(ge=0, le=40)
    modules_left: list[WaybarModule]
    modules_center: list[WaybarModule]
    modules_right: list[WaybarModule]
    show_icons: bool
    show_labels: bool


BarConfig = WaybarConfig


# ─── Terminal Config ──────────────────────────────────────────────────────────

class KittyConfig(BaseModel):
    kind: Literal["kitty"]
    font_family: str = Field(min_length=1, max_length=100)
    font_size: int = Field(ge=6, le=72)
    padding_x: int = Field(ge=0, le=100)
    padding_y: int = Field(ge=0, le=100)
    cursor_shape: Literal["block", "beam", "underline"]
    cursor_blink: bool


TerminalConfig = KittyConfig


# ─── App Launcher Config ──────────────────────────────────────────────────────

class RofiConfig(BaseModel):
    kind: Literal["rofi"]
    mode: Literal["launcher", "dmenu", "drun", "window"]
    width: int = Field(ge=200, le=2000)
    lines: int = Field(ge=1, le=50)
    position: Literal["left", "center", "right"]
    show_icons: bool


class WofiConfig(BaseModel):
    kind: Literal["wofi"]
    width: int = Field(ge=200, le=2000)
    height: int = Field(ge=100, le=2000)
    show_icons: bool


AppLauncherConfig = Annotated[
    Union[RofiConfig, WofiConfig],
    Field(discriminator="kind"),
]


# ─── Lock Screen Config ───────────────────────────────────────────────────────

class HyprlockConfig(BaseModel):
    kind: Literal["hyprlock"]
    theme: str = Field(min_length=1, max_length=100)
    background_color: HexColor
    background_image: str | None = None
    blur: bool
    blur_size: int = Field(ge=0, le=20)
    clock: bool
    date_format: str = Field(min_length=1, max_length=50)
    layout: Literal["center", "left", "right"]
    layout_y: Literal["top", "center", "bottom"]

    @field_validator("background_color", mode="before")
    @classmethod
    def normalize_hex(cls, v: str) -> str:
        return _validate_hex(v)


class SwaylockConfig(BaseModel):
    kind: Literal["swaylock"]
    theme: str = Field(min_length=1, max_length=100)
    color: HexColor
    background_image: str | None = None
    blur: bool
    clock: bool
    layout: Literal["center", "left", "right"]
    layout_y: Literal["top", "center", "bottom"]

    @field_validator("color", mode="before")
    @classmethod
    def normalize_hex(cls, v: str) -> str:
        return _validate_hex(v)


class SddmConfig(BaseModel):
    kind: Literal["sddm"]
    theme: str = Field(min_length=1, max_length=100)
    background_color: HexColor
    background_image: str | None = None
    font: str = Field(min_length=1, max_length=100)
    show_logo: bool
    blur: bool
    blur_size: int = Field(ge=0, le=20)
    layout: Literal["center", "left", "right"]
    layout_y: Literal["top", "center", "bottom"]

    @field_validator("background_color", mode="before")
    @classmethod
    def normalize_hex(cls, v: str) -> str:
        return _validate_hex(v)


LockScreenConfig = Annotated[
    Union[HyprlockConfig, SwaylockConfig, SddmConfig],
    Field(discriminator="kind"),
]


# ─── Root Config ──────────────────────────────────────────────────────────────

class RiceConfig(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    colors: ColorPalette
    font: FontConfig
    wm: WMConfig
    bar: BarConfig
    terminal: TerminalConfig
    launcher: AppLauncherConfig
    lockscreen: LockScreenConfig


# ─── Request / Response ───────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    rice_id: str = Field(min_length=1)
    user_id: str = Field(min_length=1)
    config: RiceConfig
