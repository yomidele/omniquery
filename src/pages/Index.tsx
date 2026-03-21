import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { ResearchLogs } from "@/components/ResearchLogs";
import { ResearchReport } from "@/components/ResearchReport";
import { ResearchHistory } from "@/components/ResearchHistory";
import { useResearch } from "@/hooks/useResearch";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen, LogOut, History, Search, Menu, X, Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Source } from "@/types/research";

const DEPTH_LABELS = ["quick", "standard", "deep", "academic", "expert"];

const Index = () => {
  const { logs, content, sources, isLoading, isPaused, retryCountdown, error, hasMore, research, continueResearch } = useResearch();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "history">("logs");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [viewedContent, setViewedContent] = useState("");
  const [viewedSources, setViewedSources] = useState<Source[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const lastQueryRef = useRef("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Save completed research to history
  useEffect(() => {
    if (!isLoading && content && user && !isViewingHistory) {
      const saveToHistory = async () => {
        await supabase.from("research_history").insert({
          user_id: user.id,
          query: lastQueryRef.current || "Research",
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
    setSidebarOpen(false);
  }, []);

  const handleResearch = useCallback((query: string, depth: number) => {
    setIsViewingHistory(false);
    setViewedContent("");
    setViewedSources([]);
    lastQueryRef.current = query;
    research(query, DEPTH_LABELS[depth]);
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

  const sidebarContent = (
    <>
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-sidebar-primary" />
          <h1 className="text-base font-bold text-sidebar-primary-foreground font-display">
            OmniQuery
          </h1>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
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

      {/* Menu items */}
      <div className="border-t border-sidebar-border py-2">
        <button
          onClick={() => { navigate("/api-docs"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors font-display"
        >
          <Code className="h-3.5 w-3.5" /> API Documentation
        </button>
      </div>

      {/* User footer */}
      <div className="px-4 py-3 border-t border-sidebar-border flex items-center justify-between">
        <span className="text-[11px] text-sidebar-foreground/50 font-display truncate max-w-[140px]">
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
    </>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="px-3 md:px-8 py-3 md:py-4 border-b border-border bg-card flex-shrink-0">
          <div className="max-w-[800px] mx-auto flex items-center gap-2 md:gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-9 w-9 flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <SearchBar onSubmit={handleResearch} isLoading={isLoading} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <ResearchReport
            content={displayContent}
            sources={displaySources}
            isLoading={isLoading && !isViewingHistory}
            isPaused={isPaused}
            retryCountdown={retryCountdown}
            error={isViewingHistory ? null : error}
            hasMore={isViewingHistory ? false : hasMore}
            onContinue={continueResearch}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
