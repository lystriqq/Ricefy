# Variables d'environnement — Ricefy

## Frontend — `frontend/.env.local`

| Variable | Exemple | Description | Où trouver |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | URL publique du projet Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Clé publique Supabase (anon) | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Clé service role — **server-side uniquement** | Supabase → Settings → API |
| `NEXT_PUBLIC_APP_URL` | `https://ricefy.org` | URL publique de l'app (sans slash final) | Manuel |
| `FASTAPI_URL` | `http://localhost:8000` | URL du backend FastAPI (server-side) | Manuel |

### Exemple `frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://ricefy.org
FASTAPI_URL=http://localhost:8000
```

---

## Backend — `backend/.env`

| Variable | Exemple | Description | Où trouver |
|---|---|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | URL du projet Supabase | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Clé service role — accès admin BDD | Supabase → Settings → API |
| `FRONTEND_URL` | `https://ricefy.org` | URL du frontend (pour CORS) | Manuel |

### Exemple `backend/.env`
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FRONTEND_URL=https://ricefy.org
```

---

## Notes de sécurité

- Ne jamais commiter `.env.local` ou `.env` — vérifier `.gitignore`
- `SUPABASE_SERVICE_ROLE_KEY` bypass le RLS — **backend uniquement**
