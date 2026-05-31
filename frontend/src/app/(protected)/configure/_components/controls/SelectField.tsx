"use client";

import { ChevronDown } from "lucide-react";

type Option<T extends string> = {
  value: T;
  label: string;
};

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  description?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  description,
}: SelectFieldProps<T>) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value as T);
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          className="h-8 w-full appearance-none rounded-md border border-border bg-transparent pl-2.5 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-background">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
