import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { ResearchLogs } from "@/components/ResearchLogs";
import { ResearchReport } from "@/components/ResearchReport";
import { ResearchHistory } from "@/components/ResearchHistory";
import { useResearch } from "@/hooks/useResearch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, LogOut, History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Source } from "@/types/research";

const Index = () => {
  const { logs, content, sources, isLoading, error, research } = useResearch();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"logs" | "history">("logs");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [viewedContent, setViewedContent] = useState("");
  const [viewedSources, setViewedSources] = useState<Source[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Save completed research to history
  useEffect(() => {
    if (!isLoading && content && user && !isViewingHistory) {
      // Find the query from the search — we get it from the last research call
      const saveToHistory = async () => {
        await supabase.from("research_history").insert({
          user_id: user.id,
          query: (document.querySelector('input[type="text"]') as HTMLInputElement)?.value || "Research",
          content,
          sources: sources as any,
        });
        setHistoryRefreshKey((k) => k + 1);
      };
      saveToHistory();
    }
  }, [isLoading, content, user]);

  const handleHistorySelect = useCallback((item: { query: string; content: string; sources: Source[] }) => {
    setViewedContent(item.content);
    setViewedSources(item.sources);
    setIsViewingHistory(true);
    setActiveTab("logs");
  }, []);

  const handleResearch = useCallback((query: string) => {
    setIsViewingHistory(false);
    setViewedContent("");
    setViewedSources([]);
    research(query);
  }, [research]);

  const displayContent = isViewingHistory ? viewedContent : content;
  const displaySources = isViewingHistory ? viewedSources : sources;

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground font-display">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-sidebar-primary" />
            <h1 className="text-base font-bold text-sidebar-primary-foreground font-display">
              Research Agent
            </h1>
          </div>
          <p className="text-[11px] text-sidebar-foreground opacity-50 mt-1 font-display">
            Autonomous AI-powered research
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sidebar-border">
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex-1 px-3 py-2 text-xs font-display flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "logs"
                ? "text-sidebar-primary border-b-2 border-sidebar-primary"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
            }`}
          >
            <Search className="h-3.5 w-3.5" /> Logs
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-3 py-2 text-xs font-display flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "history"
                ? "text-sidebar-primary border-b-2 border-sidebar-primary"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
            }`}
          >
            <History className="h-3.5 w-3.5" /> History
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === "logs" ? (
            <ResearchLogs logs={logs} isLoading={isLoading} />
          ) : (
            <div className="h-full overflow-y-auto">
              <ResearchHistory onSelect={handleHistorySelect} refreshKey={historyRefreshKey} />
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-sidebar-border flex items-center justify-between">
          <span className="text-[11px] text-sidebar-foreground/50 font-display truncate">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-7 w-7 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-4 border-b border-border bg-card">
          <div className="max-w-[800px] mx-auto">
            <SearchBar onSubmit={handleResearch} isLoading={isLoading} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8">
          <ResearchReport
            content={displayContent}
            sources={displaySources}
            isLoading={isLoading && !isViewingHistory}
            error={isViewingHistory ? null : error}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
