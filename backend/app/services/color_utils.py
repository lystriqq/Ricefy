"""
Colour utilities for deriving terminal palettes from a 5-colour rice palette.

Strategy: blend the user's accent colour toward the 6 standard ANSI hues
(red, green, yellow, blue, purple, cyan) at a fixed ratio so the result is
visually distinct yet cohesive with the overall palette.
"""

from __future__ import annotations

from app.models.rice_config import ColorPalette


# ─── ANSI reference hues (Gruvbox-inspired) ──────────────────────────────────

_ANSI_TARGETS: dict[str, str] = {
    "red":          "#cc241d",
    "green":        "#98971a",
    "yellow":       "#d79921",
    "blue":         "#458588",
    "purple":       "#b16286",
    "cyan":         "#689d6a",
    "bright_red":   "#fb4934",
    "bright_green": "#b8bb26",
    "bright_yellow":"#fabd2f",
    "bright_blue":  "#83a598",
    "bright_purple":"#d3869b",
    "bright_cyan":  "#8ec07c",
}

# How strongly the target hue overrides the accent (0 = pure accent, 1 = pure target)
_BLEND_RATIO = 0.65


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _parse(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def blend(c1: str, c2: str, ratio: float) -> str:
    """Linearly blend c1 toward c2 by ratio (0 = c1, 1 = c2)."""
    r1, g1, b1 = _parse(c1)
    r2, g2, b2 = _parse(c2)
    r = round(r1 * (1 - ratio) + r2 * ratio)
    g = round(g1 * (1 - ratio) + g2 * ratio)
    b = round(b1 * (1 - ratio) + b2 * ratio)
    return f"#{r:02x}{g:02x}{b:02x}"


def lighten(c: str, amount: float) -> str:
    """Mix c with white by amount (0 = unchanged, 1 = white)."""
    r, g, b = _parse(c)
    r = round(r + (255 - r) * amount)
    g = round(g + (255 - g) * amount)
    b = round(b + (255 - b) * amount)
    return f"#{min(r, 255):02x}{min(g, 255):02x}{min(b, 255):02x}"


def darken(c: str, amount: float) -> str:
    """Mix c with black by amount (0 = unchanged, 1 = black)."""
    r, g, b = _parse(c)
    r = round(r * (1 - amount))
    g = round(g * (1 - amount))
    b = round(b * (1 - amount))
    return f"#{max(r, 0):02x}{max(g, 0):02x}{max(b, 0):02x}"


# ─── Public API ───────────────────────────────────────────────────────────────


def derive_terminal_colors(palette: ColorPalette) -> dict[str, str]:
    """
    Derive the 16 ANSI terminal colours from a rice palette.

    color0-7  : normal (black → white)
    color8-15 : bright (black → white)
    """
    a = palette.accent

    def _hue(key: str) -> str:
        return blend(a, _ANSI_TARGETS[key], _BLEND_RATIO)

    return {
        # Normal colours
        "color0":  palette.background,
        "color1":  _hue("red"),
        "color2":  _hue("green"),
        "color3":  _hue("yellow"),
        "color4":  _hue("blue"),
        "color5":  _hue("purple"),
        "color6":  _hue("cyan"),
        "color7":  palette.foreground,
        # Bright colours
        "color8":  palette.surface,
        "color9":  _hue("bright_red"),
        "color10": _hue("bright_green"),
        "color11": _hue("bright_yellow"),
        "color12": _hue("bright_blue"),
        "color13": _hue("bright_purple"),
        "color14": _hue("bright_cyan"),
        "color15": lighten(palette.foreground, 0.15),
    }
