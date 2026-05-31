-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rice_id uuid,
  downloaded_at timestamp with time zone DEFAULT now(),
  ip_hash text,
  CONSTRAINT downloads_pkey PRIMARY KEY (id),
  CONSTRAINT downloads_rice_id_fkey FOREIGN KEY (rice_id) REFERENCES public.rices(id)
);
CREATE TABLE public.emails_sent (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rice_id uuid,
  type USER-DEFINED NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  success boolean DEFAULT false,
  error text,
  CONSTRAINT emails_sent_pkey PRIMARY KEY (id),
  CONSTRAINT emails_sent_rice_id_fkey FOREIGN KEY (rice_id) REFERENCES public.rices(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.rices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  status USER-DEFINED DEFAULT 'draft'::rice_status,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  zip_url text,
  zip_path text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rices_pkey PRIMARY KEY (id),
  CONSTRAINT rices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
