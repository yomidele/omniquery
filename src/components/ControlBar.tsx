import { useMemo } from "react";

export type ResearchDepth = "quick" | "standard" | "deep" | "academic" | "expert";
export type OutputType = "structured" | "summary" | "bullet" | "review";

interface ControlBarProps {
  depth: ResearchDepth;
  outputType: OutputType;
  onDepthChange: (depth: ResearchDepth) => void;
  onOutputTypeChange: (value: OutputType) => void;
}

const DEPTH_OPTIONS: Array<{value: ResearchDepth; label: string}> = [
  { value: "quick", label: "Quick" },
  { value: "standard", label: "Standard" },
  { value: "deep", label: "Deep" },
  { value: "academic", label: "Academic" },
  { value: "expert", label: "Expert" },
];

const OUTPUT_OPTIONS: Array<{value: OutputType; label: string}> = [
  { value: "structured", label: "Structured Report" },
  { value: "summary", label: "Executive Summary" },
  { value: "bullet", label: "Bullet Insights" },
  { value: "review", label: "Literature Review" },
];

export function ControlBar({ depth, outputType, onDepthChange, onOutputTypeChange }: ControlBarProps) {
  const sharedClass = "h-14 w-full rounded-xl border border-[rgba(var(--border),.8)] bg-[rgb(var(--surface))] px-3 text-sm text-[rgb(var(--foreground))] focus:outline-none focus:border-[rgba(var(--accent),.9)] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.20)]";

  return (
    <div className="mt-6 flex w-full max-w-[800px] items-center gap-4">
      <label className="flex-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--muted-foreground))]">Research Depth</span>
        <select value={depth} onChange={(e) => onDepthChange(e.target.value as ResearchDepth)} className={sharedClass}>
          {DEPTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="flex-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--muted-foreground))]">Output Type</span>
        <select value={outputType} onChange={(e) => onOutputTypeChange(e.target.value as OutputType)} className={sharedClass}>
          {OUTPUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
