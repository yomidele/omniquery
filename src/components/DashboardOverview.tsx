import { FileText, Activity, BookmarkCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardOverviewProps {
  onStartResearch: () => void;
}

export function DashboardOverview({ onStartResearch }: DashboardOverviewProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display mb-2">
          Good {getGreeting()}.
        </h1>
        <p className="text-base text-muted-foreground font-body">
          What are we exploring today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon={FileText} label="Total Researches" value="—" />
        <StatCard icon={Activity} label="Active Sessions" value="—" />
        <StatCard icon={BookmarkCheck} label="Saved Reports" value="—" />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <Button
          onClick={onStartResearch}
          size="lg"
          className="w-full sm:w-auto gap-2 h-12 rounded-xl text-base px-8"
        >
          Start New Research
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestion Cards */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={onStartResearch}
            className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <p className="text-xs text-primary font-semibold mb-1.5 font-display">{s.category}</p>
            <p className="text-sm text-foreground font-medium leading-snug font-display">{s.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground font-display">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

const suggestions = [
  { category: "📝 Summarize", title: 'Summarize the methodology used in "Exploring Technology in Classrooms"' },
  { category: "📎 Citation", title: 'Generate an APA citation for "Digital Tools in Learning Outcomes"' },
  { category: "📊 Report", title: 'Research report on "Effect of Digital Tools on Learning Performance"' },
];
