import { useEffect, useState } from "react";

const STEPS = [
  "Searching academic sources...",
  "Analyzing research materials...",
  "Structuring insights...",
  "Generating final report...",
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
    const timers: Array<number> = [];

    STEPS.forEach((_, idx) => {
      timers.push(window.setTimeout(() => {
        setActiveIndex(idx);
      }, idx * 700));
    });

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="mt-10 w-full max-w-[600px] rounded-xl border border-[rgba(var(--border),.65)] bg-[rgb(var(--surface))] p-4">
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          return (
            <p
              key={step}
              className={`text-sm leading-relaxed ${isActive ? "font-medium opacity-100 animate-pulse-dot" : "font-light"} ${isComplete ? "text-[rgba(var(--muted-foreground),.65)]" : "text-[rgba(var(--foreground),.9)]"}`}
              style={{ transition: "opacity 250ms ease, color 250ms ease" }}
            >
              {step}
            </p>
          );
        })}
      </div>
    </div>
  );
}
