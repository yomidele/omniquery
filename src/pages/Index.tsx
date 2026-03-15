import { SearchBar } from "@/components/SearchBar";
import { ResearchLogs } from "@/components/ResearchLogs";
import { ResearchReport } from "@/components/ResearchReport";
import { useResearch } from "@/hooks/useResearch";
import { BookOpen } from "lucide-react";

const Index = () => {
  const { logs, content, sources, isLoading, error, research } = useResearch();

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
        <div className="flex-1 overflow-hidden">
          <ResearchLogs logs={logs} isLoading={isLoading} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search Header */}
        <header className="px-8 py-4 border-b border-border bg-card">
          <div className="max-w-[800px] mx-auto">
            <SearchBar onSubmit={research} isLoading={isLoading} />
          </div>
        </header>

        {/* Report Area */}
        <div className="flex-1 overflow-y-auto px-8">
          <ResearchReport
            content={content}
            sources={sources}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
