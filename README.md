<div align="center">

<img src="frontend/public/logo.svg" alt="Ricefy" width="64" height="64" />

# Ricefy

**Visual dotfile generator for Hyprland**

Configure your Arch Linux desktop through a drag-and-drop interface.  
Get a ready-to-install zip with all your dotfiles in seconds.

[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/lystriqq)

</div>

---

## Overview

Ricefy lets you visually configure a complete Hyprland setup, colors, fonts, window manager, statusbar, terminal, launcher, lockscreen, and downloads a zip with every dotfile pre-filled with your choices, plus a one-command install script.

No editing config files by hand. No hunting for documentation. Just configure, generate, download.

---

## What gets generated for now

| Tool | File |
|---|---|
| Hyprland | `hyprland/hyprland.lua` |
| Waybar | `waybar/config` · `waybar/style.css` |
| Kitty | `kitty/kitty.conf` |
| Rofi or Wofi | `rofi/config.rasi` · `wofi/config` + `wofi/style.css` |
| Hyprlock, Swaylock, or SDDM | respective config files |
| Install script | `install.sh`, backs up existing configs, installs packages via pacman/AUR, copies files |

Terminal colors (all 16 ANSI) are automatically derived from your 5-color palette.

---

## Stack

```
Frontend   Next.js 15 · TypeScript · Tailwind CSS v4 · Zustand · shadcn/ui
Backend    FastAPI · Python 3.12 · Jinja2 · uv
Database   Supabase, Auth · PostgreSQL · Storage
```

---

## Getting Started

### Prerequisites

- Node.js 20+, npm
- Python 3.12+, [uv](https://docs.astral.sh/uv/)
- A [Supabase](https://supabase.com) project

### 1. Clone

```bash
git clone https://github.com/lystriqq/Ricefy.git
cd Ricefy
```

### 2. Database

Run `docs/dbsetup.sql` in your Supabase SQL editor.  
Create two Storage buckets: `rice-uploads` (public) and `rice-zips` (private).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
FASTAPI_URL=http://localhost:8000
```

```bash
npm run dev   # http://localhost:3000
```

### 4. Backend

```bash
cd backend
uv sync
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FRONTEND_URL=http://localhost:3000
```

```bash
uv run uvicorn main:app --reload   # http://localhost:8000
```

---

## How it works

```
Configure → Review → Generate → Download
```

1. **Configure**, 7 sections with live preview updating in real time
2. **Review**, read-only summary with 3 preview modes (desktop, terminal, lockscreen)
3. **Generate**, Next.js API route calls the FastAPI backend, which renders Jinja2 templates and packages a zip
4. **Download**, page polls until the zip is ready, then serves the download

---

## Tests

```bash
cd backend
uv run pytest -v
```

400+ tests covering Pydantic models, Jinja2 templates, color utilities, storage service, and the API endpoint.

---

## Project Structure

```
Ricefy/
├── frontend/
│   └── src/
│       ├── app/              # App Router pages & API routes
│       ├── components/       # Configurator panels, previews, UI
│       ├── store/            # Zustand state (useRiceStore)
│       ├── contexts/         # Supabase persistence layer
│       └── types/            # Shared TypeScript types
└── backend/
    ├── app/
    │   ├── models/           # Pydantic config models
    │   ├── routers/          # POST /generate
    │   ├── services/         # Generator, storage, color utils
    │   └── templates/        # Jinja2 dotfile templates
    └── tests/                # pytest test suite
```

---

## Contributing

All contributions welcome, bug fixes, new tools (Alacritty, i3, Polybar, …), UI improvements.

1. Fork the repo
2. Create a branch: `git checkout -b feat/alacritty-support`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `chore:`
4. Backend changes must include pytest tests, no test = incomplete task
5. Open a PR against `main`

---

## License

[MIT](LICENSE)

---

<div align="center">

Made by [lystriqq](https://github.com/lystriqq) · [☕ Ko-fi](https://ko-fi.com/lystriqq)

</div>
