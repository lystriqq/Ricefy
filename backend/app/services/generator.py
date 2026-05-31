import logging
import os
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.models.rice_config import RiceConfig
from app.services.color_utils import derive_terminal_colors

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

_ENV = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape([]),
    trim_blocks=True,
    lstrip_blocks=True,
)


def render_template(template_path: str, context: dict) -> str:
    """Render a Jinja2 template and return the result as a string."""
    return _ENV.get_template(template_path).render(**context)


def _write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _write_files(config: RiceConfig, out_dir: Path) -> None:
    ctx = {"config": config}
    term_colors = derive_terminal_colors(config.colors)

    _write(out_dir / "install.sh", render_template("install.sh.j2", ctx))

    _write(out_dir / "hyprland" / "hyprland.lua",
           render_template("hyprland/hyprland.lua.j2", ctx))

    _write(out_dir / "waybar" / "config",
           render_template("waybar/config.j2", ctx))
    _write(out_dir / "waybar" / "style.css",
           render_template("waybar/style.css.j2", ctx))

    _write(out_dir / "kitty" / "kitty.conf",
           render_template("kitty/kitty.conf.j2", {**ctx, "term_colors": term_colors}))

    if config.launcher.kind == "rofi":
        _write(out_dir / "rofi" / "config.rasi",
               render_template("rofi/config.rasi.j2", ctx))
    else:
        _write(out_dir / "wofi" / "config",
               render_template("wofi/config.j2", ctx))
        _write(out_dir / "wofi" / "style.css",
               render_template("wofi/style.css.j2", ctx))

    if config.lockscreen.kind == "hyprlock":
        _write(out_dir / "hyprlock" / "hyprlock.conf",
               render_template("hyprlock/hyprlock.conf.j2", ctx))
    elif config.lockscreen.kind == "swaylock":
        _write(out_dir / "swaylock" / "swaylock.conf",
               render_template("swaylock/swaylock.conf.j2", ctx))
    else:
        _write(out_dir / "sddm" / "theme.conf",
               render_template("sddm/theme.conf.j2", ctx))
        _write(out_dir / "sddm" / "Main.qml",
               render_template("sddm/Main.qml.j2", ctx))


def _create_zip(content_dir: Path, zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file in sorted(content_dir.rglob("*")):
            if file.is_file():
                zf.write(file, file.relative_to(content_dir))


def generate_rice(config: RiceConfig) -> Path:
    """
    Render all dotfiles for *config*, pack them into a zip, and return the
    zip path.  The intermediate content dir is always deleted; the caller owns
    the returned zip and must delete it when done.
    """
    content_dir = Path(tempfile.mkdtemp(prefix="ricefy_"))
    safe_name = re.sub(r"[^a-z0-9-]", "-", config.name.lower())
    fd, zip_str = tempfile.mkstemp(suffix=".zip", prefix=f"ricefy-{safe_name}-")
    os.close(fd)
    zip_path = Path(zip_str)

    try:
        logger.info("Generating rice '%s'", config.name)
        _write_files(config, content_dir)
        _create_zip(content_dir, zip_path)
        logger.info("Zip ready: %s (%d bytes)", zip_path, zip_path.stat().st_size)
        return zip_path
    except Exception:
        zip_path.unlink(missing_ok=True)
        logger.exception("Failed to generate rice '%s'", config.name)
        raise
    finally:
        shutil.rmtree(content_dir, ignore_errors=True)
