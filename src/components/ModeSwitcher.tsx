import { motion } from "framer-motion";
import { Zap, Search, BookOpen } from "lucide-react";

export type ResearchMode = "executive" | "research" | "literature";

interface ModeSwitcherProps {
  activeMode: ResearchMode;
  onModeChange: (mode: ResearchMode) => void;
}

const modes: Array<{ id: ResearchMode; label: string; shortLabel: string; icon: typeof Zap; description: string }> = [
  { id: "executive", label: "Executive", shortLabel: "Exec", icon: Zap, description: "Fast decisions" },
  { id: "research", label: "Research", shortLabel: "Research", icon: Search, description: "Balanced analysis" },
  { id: "literature", label: "Literature", shortLabel: "Lit", icon: BookOpen, description: "Deep review" },
];

export function ModeSwitcher({ activeMode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="mt-4 mb-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-display">
        Research Mode
      </span>
      <div className="relative flex bg-muted rounded-xl p-1 gap-1">
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-2 sm:px-3 rounded-lg text-sm font-medium transition-colors z-10 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mode-indicator"
                  className="absolute inset-0 bg-background shadow-sm rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <mode.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-sm">{mode.label}</span>
                <span className="sm:hidden text-xs">{mode.shortLabel}</span>
              </span>
              <span className="relative text-[9px] text-muted-foreground hidden sm:block">{mode.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
