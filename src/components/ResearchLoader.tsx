import { useEffect, useState } from "react";

const STEPS = [
  "Searching academic sources…",
  "Analyzing research materials…",
  "Structuring insights…",
  "Generating final report…",
];

interface ResearchLoaderProps {
  isLoading: boolean;
}

export function ResearchLoader({ isLoading }: ResearchLoaderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setActiveIndex(STEPS.length);
      return;
    }
    setActiveIndex(0);
    const timers: number[] = [];
    STEPS.forEach((_, idx) => {
      timers.push(window.setTimeout(() => setActiveIndex(idx), idx * 800));
    });
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          return (
            <div
              key={step}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                isActive ? "text-foreground" : isComplete ? "text-muted-foreground/50" : "text-foreground/80"
              }`}
            >
              <div className={`h-2 w-2 rounded-full flex-shrink-0 transition-all ${
                isActive ? "bg-primary animate-pulse-dot" : isComplete ? "bg-muted-foreground/30" : "bg-muted"
              }`} />
              <span className="font-display">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
