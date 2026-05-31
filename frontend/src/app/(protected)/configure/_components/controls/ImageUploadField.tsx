"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ImageUploadFieldProps = {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  uploadPath: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUploadField({ label, value, onChange, uploadPath }: ImageUploadFieldProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      setError("Fichier trop lourd (max 5 Mo)");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non connecté");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${session.user.id}/${uploadPath}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("rice-uploads")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("rice-uploads")
        .getPublicUrl(path);

      onChange(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'upload");
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setLocalPreview(null);
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayUrl = localPreview ?? value;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={disclaimerAccepted}
          onChange={(e) => setDisclaimerAccepted(e.target.checked)}
          className="mt-0.5 accent-foreground"
        />
        <span className="text-[10px] leading-relaxed text-muted-foreground">
          Je déclare détenir tous les droits sur l&apos;image téléversée. Ricefy n&apos;en est pas responsable.
        </span>
      </label>

      {!displayUrl ? (
        <button
          disabled={!disclaimerAccepted}
          onClick={() => inputRef.current?.click()}
          className={[
            "w-full rounded-md border border-dashed px-4 py-6 text-center transition-colors",
            disclaimerAccepted
              ? "cursor-pointer border-border hover:border-foreground/50"
              : "cursor-not-allowed border-border/30 opacity-40",
          ].join(" ")}
        >
          <p className="text-sm text-muted-foreground">Cliquer pour choisir une image</p>
          <p className="mt-1 text-[10px] text-muted-foreground/60">JPG, PNG, WEBP — max 5 Mo</p>
        </button>
      ) : (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Aperçu"
            className="w-full rounded-md object-cover"
            style={{ maxHeight: 120 }}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
              <span className="text-xs text-white">Upload en cours…</span>
            </div>
          )}
          {!uploading && (
            <button
              onClick={handleRemove}
              className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white hover:bg-black/80"
            >
              Retirer
            </button>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
