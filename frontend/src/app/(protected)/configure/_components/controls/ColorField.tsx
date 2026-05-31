"use client";

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
};

export function ColorField({ label, value, onChange, description }: ColorFieldProps) {
  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (/^#[0-9a-fA-F]{0,6}$/.test(raw)) {
      onChange(raw);
    }
  }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border">
          <input
            type="color"
            value={value.length === 7 ? value : "#000000"}
            onChange={handleColorChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`Color picker for ${label}`}
          />
          <div
            className="h-full w-full"
            style={{ backgroundColor: value.length === 7 ? value : "#000000" }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          maxLength={7}
          spellCheck={false}
          className="h-8 w-28 rounded-md border border-border bg-transparent px-2.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
