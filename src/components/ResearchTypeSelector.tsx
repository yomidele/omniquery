import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type ResearchType = "general" | "undergraduate" | "masters" | "phd";

const RESEARCH_TYPES: { value: ResearchType; label: string; emoji: string; desc: string }[] = [
  { value: "general", label: "General", emoji: "📝", desc: "Standard report" },
  { value: "undergraduate", label: "Undergraduate", emoji: "🎒", desc: "Project work" },
  { value: "masters", label: "Master's", emoji: "🎓", desc: "Thesis structure" },
  { value: "phd", label: "PhD", emoji: "🔬", desc: "Dissertation" },
];

interface ResearchTypeSelectorProps {
  value: ResearchType;
  onChange: (value: ResearchType) => void;
}

export function ResearchTypeSelector({ value, onChange }: ResearchTypeSelectorProps) {
  return (
    <div className="w-full">
      <span className="text-[11px] text-muted-foreground font-display uppercase tracking-wide mb-1.5 block">
        Research Level
      </span>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as ResearchType)}
        className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
      >
        {RESEARCH_TYPES.map((type) => (
          <div key={type.value} className="relative">
            <RadioGroupItem
              value={type.value}
              id={`type-${type.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`type-${type.value}`}
              className="flex flex-col items-center gap-0.5 rounded-md border border-border bg-card px-2 py-1.5 text-center cursor-pointer transition-all
                peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/10 peer-data-[state=checked]:text-accent-foreground
                hover:bg-muted/50"
            >
              <span className="text-sm">{type.emoji}</span>
              <span className="text-[10px] font-display font-medium leading-tight">{type.label}</span>
              <span className="text-[9px] text-muted-foreground leading-tight">{type.desc}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
