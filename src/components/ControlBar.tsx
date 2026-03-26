export type ResearchDepth = "quick" | "standard" | "deep" | "academic" | "expert";
export type OutputType = "structured" | "summary" | "bullet" | "review";

interface ControlBarProps {
  depth: ResearchDepth;
  outputType: OutputType;
  onDepthChange: (depth: ResearchDepth) => void;
  onOutputTypeChange: (value: OutputType) => void;
}

const DEPTH_OPTIONS: Array<{ value: ResearchDepth; label: string }> = [
  { value: "quick", label: "Quick" },
  { value: "standard", label: "Standard" },
  { value: "deep", label: "Deep" },
  { value: "academic", label: "Academic" },
  { value: "expert", label: "Expert" },
];

const OUTPUT_OPTIONS: Array<{ value: OutputType; label: string }> = [
  { value: "structured", label: "Structured Report" },
  { value: "summary", label: "Executive Summary" },
  { value: "bullet", label: "Bullet Insights" },
  { value: "review", label: "Literature Review" },
];

export function ControlBar({ depth, outputType, onDepthChange, onOutputTypeChange }: ControlBarProps) {
  return (
    <div className="mt-4 flex flex-col sm:flex-row gap-3">
      <label className="flex-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-display">
          Research Depth
        </span>
        <select
          value={depth}
          onChange={(e) => onDepthChange(e.target.value as ResearchDepth)}
          className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground font-display outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        >
          {DEPTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label className="flex-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-display">
          Output Type
        </span>
        <select
          value={outputType}
          onChange={(e) => onOutputTypeChange(e.target.value as OutputType)}
          className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground font-display outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        >
          {OUTPUT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
