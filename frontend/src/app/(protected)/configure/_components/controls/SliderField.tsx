"use client";

type SliderFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
};

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  description,
}: SliderFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(Number(e.target.value));
  }

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="tabular-nums text-xs text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="slider-field h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border outline-none focus-visible:ring-1 focus-visible:ring-ring"
          style={{
            background: `linear-gradient(to right, hsl(var(--foreground)) ${percentage}%, hsl(var(--border)) ${percentage}%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
