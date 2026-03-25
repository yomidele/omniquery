import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ControlBar, type OutputType, type ResearchDepth } from "@/components/ControlBar";
import { ResearchInput } from "@/components/ResearchInput";
import { ResearchSkeleton } from "@/components/ResearchSkeleton";
import { ResearchLoader } from "@/components/ResearchLoader";
import { ResearchOutput } from "@/components/ResearchOutput";
import { useResearch } from "@/hooks/useResearch";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { Source } from "@/types/research";

const DEPTH_LABELS: Record<ResearchDepth, string> = {
  quick: "quick",
  standard: "standard",
  deep: "deep",
  academic: "academic",
  expert: "expert",
};

const Index = () => {
  const { logs, content, sources, isLoading, isPaused, retryCountdown, error, hasMore, research, continueResearch } = useResearch();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "history">("logs");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [selectedDepth, setSelectedDepth] = useState<ResearchDepth>("standard");
  const [selectedOutputType, setSelectedOutputType] = useState<OutputType>("structured");

  const [viewedContent, setViewedContent] = useState("");
  const [viewedSources, setViewedSources] = useState<Source[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  const lastQueryRef = useRef("");
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isLoading && content && user && !isViewingHistory && !hasMore && !hasSavedRef.current) {
      hasSavedRef.current = true;
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
  }, [isLoading, content, user, hasMore, isViewingHistory, sources]);

  const handleHistorySelect = useCallback((item: { query: string; content: string; sources: Source[] }) => {
    setViewedContent(item.content);
    setViewedSources(item.sources);
    setIsViewingHistory(true);
    setActiveTab("logs");
    setSidebarOpen(false);
  }, []);

  const handleResearch = useCallback((query: string) => {
    setIsViewingHistory(false);
    setViewedContent("");
    setViewedSources([]);
    lastQueryRef.current = query;
    hasSavedRef.current = false;
    research(query, DEPTH_LABELS[selectedDepth], "general");
  }, [research, selectedDepth]);

  const displayContent = isViewingHistory ? viewedContent : content;
  const displaySources = isViewingHistory ? viewedSources : sources;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <span className="text-sm text-[rgb(var(--muted-foreground))]">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--background))]">
      <Header />
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 gap-6 px-4 py-6">
        {!isMobile && (
          <Sidebar
            userEmail={user?.email}
            logs={logs}
            isLoading={isLoading}
            activeTab={activeTab}
            historyRefreshKey={historyRefreshKey}
            onTabChange={setActiveTab}
            onHistorySelect={handleHistorySelect}
            onSignOut={signOut}
          />
        )}

        <section className="flex-1">
          <div className="mx-auto max-w-[800px]">
            <ResearchInput onSubmit={handleResearch} isLoading={isLoading} />
            <ControlBar
              depth={selectedDepth}
              outputType={selectedOutputType}
              onDepthChange={setSelectedDepth}
              onOutputTypeChange={setSelectedOutputType}
            />

            <div className="mt-10">
              {isLoading && <ResearchLoader isLoading={isLoading} />}
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
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
