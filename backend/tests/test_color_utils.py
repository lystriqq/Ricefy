import pytest
from app.models.rice_config import ColorPalette
from app.services.color_utils import blend, lighten, darken, derive_terminal_colors


# ─── blend ────────────────────────────────────────────────────────────────────


class TestBlend:
    def test_ratio_zero_returns_c1(self):
        assert blend("#000000", "#ffffff", 0.0) == "#000000"

    def test_ratio_one_returns_c2(self):
        assert blend("#000000", "#ffffff", 1.0) == "#ffffff"

    def test_ratio_half(self):
        result = blend("#000000", "#ffffff", 0.5)
        assert result == "#808080"

    def test_result_is_valid_hex(self):
        result = blend("#7c6f64", "#cc241d", 0.65)
        assert result.startswith("#")
        assert len(result) == 7
        int(result[1:], 16)  # raises if not valid hex

    def test_symmetric_on_same_color(self):
        assert blend("#7c6f64", "#7c6f64", 0.3) == "#7c6f64"

    def test_partial_blend(self):
        # 25% toward white: each channel = c1 + (255-c1)*0.25
        r = round(0x7c + (255 - 0x7c) * 0.25)
        result = blend("#7c0000", "#ffffff", 0.25)
        assert result.startswith(f"#{r:02x}")


# ─── lighten ──────────────────────────────────────────────────────────────────


class TestLighten:
    def test_zero_amount_unchanged(self):
        assert lighten("#7c6f64", 0.0) == "#7c6f64"

    def test_full_amount_is_white(self):
        assert lighten("#000000", 1.0) == "#ffffff"

    def test_partial_lightens(self):
        result = lighten("#000000", 0.5)
        r, g, b = int(result[1:3], 16), int(result[3:5], 16), int(result[5:7], 16)
        assert r == g == b == 128  # round(0 + 255*0.5) = 128 (rounding)

    def test_result_never_exceeds_ff(self):
        result = lighten("#ffffff", 0.5)
        assert result == "#ffffff"

    def test_result_is_lighter(self):
        original = "#3c3836"
        result = lighten(original, 0.3)
        orig_sum = sum(int(original[1:][i:i+2], 16) for i in (0, 2, 4))
        res_sum = sum(int(result[1:][i:i+2], 16) for i in (0, 2, 4))
        assert res_sum > orig_sum


# ─── darken ───────────────────────────────────────────────────────────────────


class TestDarken:
    def test_zero_amount_unchanged(self):
        assert darken("#7c6f64", 0.0) == "#7c6f64"

    def test_full_amount_is_black(self):
        assert darken("#ffffff", 1.0) == "#000000"

    def test_partial_darkens(self):
        result = darken("#ffffff", 0.5)
        r = int(result[1:3], 16)
        assert r == 128  # round(255 * 0.5) = 128 (rounding)

    def test_result_never_below_zero(self):
        result = darken("#000000", 0.5)
        assert result == "#000000"

    def test_result_is_darker(self):
        original = "#ebdbb2"
        result = darken(original, 0.3)
        orig_sum = sum(int(original[1:][i:i+2], 16) for i in (0, 2, 4))
        res_sum = sum(int(result[1:][i:i+2], 16) for i in (0, 2, 4))
        assert res_sum < orig_sum


# ─── derive_terminal_colors ───────────────────────────────────────────────────


@pytest.fixture
def gruvbox_palette() -> ColorPalette:
    return ColorPalette(
        accent="#7c6f64",
        background="#1d2021",
        foreground="#ebdbb2",
        border="#3c3836",
        surface="#282828",
    )


@pytest.fixture
def nord_palette() -> ColorPalette:
    return ColorPalette(
        accent="#88c0d0",
        background="#2e3440",
        foreground="#d8dee9",
        border="#3b4252",
        surface="#434c5e",
    )


@pytest.fixture
def dracula_palette() -> ColorPalette:
    return ColorPalette(
        accent="#bd93f9",
        background="#282a36",
        foreground="#f8f8f2",
        border="#44475a",
        surface="#44475a",
    )


class TestDeriveTerminalColors:
    def test_returns_16_colors(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        assert len(colors) == 16

    def test_all_keys_present(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        for i in range(16):
            assert f"color{i}" in colors, f"missing color{i}"

    def test_all_values_are_valid_hex(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        for key, value in colors.items():
            assert value.startswith("#"), f"{key}: {value} missing #"
            assert len(value) == 7, f"{key}: {value} wrong length"
            int(value[1:], 16)  # raises if not hex

    def test_color0_is_background(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        assert colors["color0"] == gruvbox_palette.background

    def test_color7_is_foreground(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        assert colors["color7"] == gruvbox_palette.foreground

    def test_color8_is_surface(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        assert colors["color8"] == gruvbox_palette.surface

    def test_color15_is_lighter_than_foreground(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        fg_sum = sum(int(gruvbox_palette.foreground[1:][i:i+2], 16) for i in (0, 2, 4))
        c15_sum = sum(int(colors["color15"][1:][i:i+2], 16) for i in (0, 2, 4))
        assert c15_sum >= fg_sum  # lightened

    def test_color1_differs_from_accent(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        assert colors["color1"] != gruvbox_palette.accent

    def test_normal_and_bright_differ(self, gruvbox_palette):
        colors = derive_terminal_colors(gruvbox_palette)
        for i in range(1, 7):
            assert colors[f"color{i}"] != colors[f"color{i+8}"], \
                f"color{i} and color{i+8} should differ"

    def test_works_with_nord_palette(self, nord_palette):
        colors = derive_terminal_colors(nord_palette)
        assert len(colors) == 16
        assert colors["color0"] == nord_palette.background

    def test_works_with_dracula_palette(self, dracula_palette):
        colors = derive_terminal_colors(dracula_palette)
        assert len(colors) == 16
        assert colors["color8"] == dracula_palette.surface

    def test_deterministic(self, gruvbox_palette):
        c1 = derive_terminal_colors(gruvbox_palette)
        c2 = derive_terminal_colors(gruvbox_palette)
        assert c1 == c2
