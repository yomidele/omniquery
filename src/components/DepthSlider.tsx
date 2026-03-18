import { Slider } from "@/components/ui/slider";

const depthLabels = [
  { label: "Quick", emoji: "⚡" },
  { label: "Standard", emoji: "📋" },
  { label: "Deep", emoji: "🔬" },
  { label: "Academic", emoji: "🎓" },
  { label: "Expert", emoji: "🧠" },
];

interface DepthSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function DepthSlider({ value, onChange }: DepthSliderProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-muted-foreground font-display uppercase tracking-wide">
          Research Depth
        </span>
        <span className="text-xs font-medium text-accent font-display">
          {depthLabels[value].emoji} {depthLabels[value].label}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={4}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between mt-1">
        {depthLabels.map((d, i) => (
          <span
            key={i}
            className={`text-[9px] font-display ${
              i === value ? "text-accent font-semibold" : "text-muted-foreground/50"
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
