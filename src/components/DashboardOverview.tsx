import { FileText, Activity, BookmarkCheck, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardOverviewProps {
  onStartResearch: () => void;
}

interface RecentItem {
  id: string;
  query: string;
  created_at: string;
}

export function DashboardOverview({ onStartResearch }: DashboardOverviewProps) {
  const { user } = useAuth();
  const [totalResearches, setTotalResearches] = useState<number | null>(null);
  const [savedReports, setSavedReports] = useState<number | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [todayCount, setTodayCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [historyRes, bookmarksRes, recentRes, todayRes] = await Promise.all([
        supabase.from("research_history").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("research_history").select("id, query, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("research_history").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", today.toISOString()),
      ]);
      setTotalResearches(historyRes.count ?? 0);
      setSavedReports(bookmarksRes.count ?? 0);
      setRecentItems((recentRes.data as RecentItem[]) ?? []);
      setTodayCount(todayRes.count ?? 0);
    };
    fetchStats();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display mb-2">
          Good {getGreeting()}{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ""}.
        </h1>
        <p className="text-base text-muted-foreground font-body">
          What are we exploring today?
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatCard icon={FileText} label="Total Researches" value={totalResearches !== null ? String(totalResearches) : "…"} />
        <StatCard icon={TrendingUp} label="Today" value={String(todayCount)} />
        <StatCard icon={BookmarkCheck} label="Saved Reports" value={savedReports !== null ? String(savedReports) : "…"} />
        <StatCard icon={Activity} label="Active Sessions" value={totalResearches !== null && totalResearches > 0 ? "1" : "0"} />
      </div>

      {/* Recent activity */}
      {recentItems.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-foreground font-display mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Research
          </h2>
          <div className="space-y-1.5">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-2.5 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={onStartResearch}
              >
                <span className="text-sm text-foreground font-body truncate max-w-[80%]">{item.query}</span>
                <span className="text-[10px] text-muted-foreground font-display whitespace-nowrap">
                  {formatRelative(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
    <div className="bg-card border border-border rounded-xl p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
        </div>
      </div>
      <p className="text-xl md:text-2xl font-bold text-foreground font-display">{value}</p>
      <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

const suggestions = [
  { category: "📝 Summarize", title: 'Summarize the methodology used in "Exploring Technology in Classrooms"' },
  { category: "📎 Citation", title: 'Generate an APA citation for "Digital Tools in Learning Outcomes"' },
  { category: "📊 Report", title: 'Research report on "Effect of Digital Tools on Learning Performance"' },
];
