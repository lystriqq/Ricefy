-- ═══════════════════════════════════════════
-- 1. ENUMS
-- ═══════════════════════════════════════════

CREATE TYPE rice_status AS ENUM (
  'draft',
  'paid',
  'generating',
  'ready',
  'failed'
);

CREATE TYPE email_type AS ENUM (
  'delivery',
  'reminder'
);


-- ═══════════════════════════════════════════
-- 2. TABLES
-- ═══════════════════════════════════════════

CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE SET NULL,
  username   text,
  deleted_at timestamp WITH TIME ZONE,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  updated_at timestamp WITH TIME ZONE DEFAULT now()
);

CREATE TABLE rices (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid    REFERENCES profiles(id) ON DELETE SET NULL,
  status            rice_status DEFAULT 'draft',
  config_json       jsonb   NOT NULL DEFAULT '{}',
  zip_url           text,
  zip_path          text,
  created_at        timestamp WITH TIME ZONE DEFAULT now(),
  updated_at        timestamp WITH TIME ZONE DEFAULT now()
);

CREATE TABLE downloads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rice_id       uuid REFERENCES rices(id) ON DELETE SET NULL,
  downloaded_at timestamp WITH TIME ZONE DEFAULT now(),
  ip_hash       text
);

CREATE TABLE emails_sent (
  id      uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  rice_id uuid       REFERENCES rices(id) ON DELETE SET NULL,
  type    email_type NOT NULL,
  sent_at timestamp  WITH TIME ZONE DEFAULT now(),
  success boolean    DEFAULT false,
  error   text
);


-- ═══════════════════════════════════════════
-- 3. INDEXES
-- ═══════════════════════════════════════════

CREATE INDEX idx_rices_user_id      ON rices(user_id);
CREATE INDEX idx_rices_status       ON rices(status);
CREATE INDEX idx_downloads_rice_id  ON downloads(rice_id);
CREATE INDEX idx_emails_rice_id     ON emails_sent(rice_id);


-- ═══════════════════════════════════════════
-- 4. TRIGGER — création profil automatique
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();


-- ═══════════════════════════════════════════
-- 5. FONCTION ANONYMISATION
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION anonymize_user(target_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET
    username   = 'utilisateur supprimé',
    deleted_at = now(),
    updated_at = now()
  WHERE id = target_user_id;

  UPDATE rices SET
    user_id    = NULL,
    updated_at = now()
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════
-- 6. ROW LEVEL SECURITY — activation
-- ═══════════════════════════════════════════

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════
-- 7. POLICIES RLS
-- ═══════════════════════════════════════════

-- PROFILES
CREATE POLICY "Voir son propre profil"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Modifier son propre profil"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- RICES
CREATE POLICY "Voir ses propres rices"
ON rices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Créer un rice"
ON rices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Modifier son rice"
ON rices FOR UPDATE
USING (auth.uid() = user_id);

-- DOWNLOADS
CREATE POLICY "Voir ses téléchargements"
ON downloads FOR SELECT
USING (
  auth.uid() = (
    SELECT user_id FROM rices WHERE id = rice_id
  )
);
