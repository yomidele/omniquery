import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardOverview } from "@/components/DashboardOverview";
import { ControlBar, type OutputType, type ResearchDepth } from "@/components/ControlBar";
import { ResearchInput } from "@/components/ResearchInput";
import { ResearchSkeleton } from "@/components/ResearchSkeleton";
import { ResearchLoader } from "@/components/ResearchLoader";
import { ResearchOutput } from "@/components/ResearchOutput";
import { ModeSwitcher, type ResearchMode } from "@/components/ModeSwitcher";
import { useResearch } from "@/hooks/useResearch";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, FlaskConical, Clock, Bookmark, Settings } from "lucide-react";
import type { Source } from "@/types/research";

const DEPTH_LABELS: Record<ResearchDepth, string> = {
  quick: "quick",
  standard: "standard",
  deep: "deep",
  academic: "academic",
  expert: "expert",
};

const MODE_TO_RESEARCH_TYPE: Record<ResearchMode, string> = {
  executive: "executive",
  research: "general",
  literature: "literature",
};

const Index = () => {
  const { logs, content, sources, isLoading, isPaused, retryCountdown, error, hasMore, research, continueResearch } = useResearch();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [activeView, setActiveView] = useState<"dashboard" | "research" | "history" | "saved" | "settings">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [selectedDepth, setSelectedDepth] = useState<ResearchDepth>("standard");
  const [selectedOutputType, setSelectedOutputType] = useState<OutputType>("structured");
  const [selectedMode, setSelectedMode] = useState<ResearchMode>("research");

  const [viewedContent, setViewedContent] = useState("");
  const [viewedSources, setViewedSources] = useState<Source[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  const lastQueryRef = useRef("");
  const hasSavedRef = useRef(false);
  const [lastResearchId, setLastResearchId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isLoading && content && user && !isViewingHistory && !hasMore && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const saveToHistory = async () => {
        const { data } = await supabase.from("research_history").insert({
          user_id: user.id,
          query: lastQueryRef.current || "Research",
          content,
          sources: sources as any,
        }).select("id").single();
        if (data) setLastResearchId(data.id);
        setHistoryRefreshKey((k) => k + 1);
      };
      saveToHistory();
    }
  }, [isLoading, content, user, hasMore, isViewingHistory, sources]);

  const handleHistorySelect = useCallback((item: { query: string; content: string; sources: Source[] }) => {
    setViewedContent(item.content);
    setViewedSources(item.sources);
    setIsViewingHistory(true);
    setActiveView("research");
    setSidebarOpen(false);
  }, []);

  const handleResearch = useCallback((query: string) => {
    setIsViewingHistory(false);
    setViewedContent("");
    setViewedSources([]);
    lastQueryRef.current = query;
    hasSavedRef.current = false;
    setLastResearchId(null);
    research(query, DEPTH_LABELS[selectedDepth], MODE_TO_RESEARCH_TYPE[selectedMode]);
  }, [research, selectedDepth, selectedMode]);

  const handleRefineSection = useCallback((sectionBody: string, action: string) => {
    const actionMap: Record<string, string> = {
      simplify: "Simplify the following section, making it shorter and clearer:",
      expand: "Expand the following section with more detail and evidence:",
      decide: "Rewrite the following section to be decision-focused, with clear actionable recommendations:",
    };
    const prompt = `${actionMap[action] || "Refine:"}\n\n${sectionBody}`;
    setIsViewingHistory(false);
    setViewedContent("");
    setViewedSources([]);
    lastQueryRef.current = prompt;
    hasSavedRef.current = false;
    setLastResearchId(null);
    research(prompt, DEPTH_LABELS[selectedDepth], MODE_TO_RESEARCH_TYPE[selectedMode]);
  }, [research, selectedDepth, selectedMode]);

  const handleStartResearch = useCallback(() => {
    setActiveView("research");
    setIsViewingHistory(false);
    setViewedContent("");
    setViewedSources([]);
  }, []);

  const handleModeChange = useCallback((mode: ResearchMode) => {
    setSelectedMode(mode);
    // If content exists and not viewing history, regenerate with new mode
    if (lastQueryRef.current && content && !isViewingHistory && !isLoading) {
      hasSavedRef.current = false;
      research(lastQueryRef.current, DEPTH_LABELS[selectedDepth], MODE_TO_RESEARCH_TYPE[mode]);
    }
  }, [content, isViewingHistory, isLoading, research, selectedDepth]);

  const displayContent = isViewingHistory ? viewedContent : content;
  const displaySources = isViewingHistory ? viewedSources : sources;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mobileNavItems = [
    { id: "dashboard" as const, icon: Home, label: "Home" },
    { id: "research" as const, icon: FlaskConical, label: "Research" },
    { id: "history" as const, icon: Clock, label: "History" },
    { id: "saved" as const, icon: Bookmark, label: "Saved" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header userEmail={user?.email} onSignOut={signOut} />

      <div className="flex flex-1 min-h-0">
        {/* Mobile sidebar toggle */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed bottom-16 left-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}

        {/* Sidebar - desktop always, mobile overlay */}
        {(!isMobile || sidebarOpen) && (
          <>
            {isMobile && (
              <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            )}
            <div className={isMobile ? "fixed left-0 top-14 bottom-0 z-40" : ""}>
              <AppSidebar
                activeView={activeView}
                onViewChange={(v) => {
                  setActiveView(v);
                  setSidebarOpen(false);
                }}
                logs={logs}
                isLoading={isLoading}
                historyRefreshKey={historyRefreshKey}
                onHistorySelect={handleHistorySelect}
                collapsed={false}
              />
            </div>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {activeView === "dashboard" && (
            <DashboardOverview onStartResearch={handleStartResearch} />
          )}

          {activeView === "research" && (
            <div className="max-w-[800px] mx-auto px-4 py-6 md:py-10">
              <ResearchInput onSubmit={handleResearch} isLoading={isLoading} />

              {/* Mode Switcher */}
              <ModeSwitcher activeMode={selectedMode} onModeChange={handleModeChange} />

              <ControlBar
                depth={selectedDepth}
                outputType={selectedOutputType}
                onDepthChange={setSelectedDepth}
                onOutputTypeChange={setSelectedOutputType}
              />

              <div className="mt-8">
                {isLoading && !displayContent && <ResearchLoader isLoading={isLoading} />}
                {!isLoading && !displayContent && <ResearchSkeleton />}
                {displayContent && (
                  <ResearchOutput
                    content={displayContent}
                    sources={displaySources}
                    isLoading={isLoading}
                    isPaused={isPaused}
                    retryCountdown={retryCountdown}
                    error={isViewingHistory ? null : error}
                    hasMore={isViewingHistory ? false : hasMore}
                    onContinue={continueResearch}
                    mode={selectedMode}
                    onRefineSection={handleRefineSection}
                    researchId={lastResearchId}
                  />
                )}
              </div>
            </div>
          )}

          {activeView === "history" && (
            <div className="max-w-[800px] mx-auto px-4 py-6 md:py-10">
              <h2 className="text-xl font-bold text-foreground mb-6 font-display">Research History</h2>
              <p className="text-sm text-muted-foreground font-body">Select a research entry from the sidebar to view it.</p>
            </div>
          )}

          {activeView === "saved" && (
            <div className="max-w-[800px] mx-auto px-4 py-6 md:py-10">
              <h2 className="text-xl font-bold text-foreground mb-6 font-display">Saved Reports</h2>
              <p className="text-sm text-muted-foreground font-body">Saved reports will appear here.</p>
            </div>
          )}

          {activeView === "settings" && (
            <div className="max-w-[800px] mx-auto px-4 py-6 md:py-10">
              <h2 className="text-xl font-bold text-foreground mb-6 font-display">Settings</h2>
              <p className="text-sm text-muted-foreground font-body">Account settings coming soon.</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav with Lucide icons */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border flex items-center justify-around py-2 px-2">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors ${
                activeView === item.id
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default Index;
