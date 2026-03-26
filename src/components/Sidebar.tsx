// Legacy sidebar - kept for backwards compatibility
// The app now uses AppSidebar instead
import { ResearchLogs } from "./ResearchLogs";
import { ResearchHistory } from "./ResearchHistory";
import { Button } from "@/components/ui/button";
import { type Source } from "@/types/research";

interface SidebarProps {
  userEmail?: string;
  logs: Array<any>;
  isLoading: boolean;
  activeTab: "logs" | "history";
  historyRefreshKey: number;
  onTabChange: (tab: "logs" | "history") => void;
  onHistorySelect: (item: { query: string; content: string; sources: Source[] }) => void;
  onSignOut: () => void;
}

export function Sidebar({ userEmail, logs, isLoading, activeTab, historyRefreshKey, onTabChange, onHistorySelect, onSignOut }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold font-display">Research</h2>
      </div>
      <div className="mb-3 flex flex-col gap-2">
        <button className={`rounded-lg py-2 text-sm ${activeTab === "logs" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} onClick={() => onTabChange("logs")}>Logs</button>
        <button className={`rounded-lg py-2 text-sm ${activeTab === "history" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} onClick={() => onTabChange("history")}>History</button>
      </div>
      <div className="h-[42vh] overflow-auto rounded-lg border border-border p-1">
        {activeTab === "logs" ? (
          <ResearchLogs logs={logs} isLoading={isLoading} />
        ) : (
          <ResearchHistory onSelect={onHistorySelect} refreshKey={historyRefreshKey} />
        )}
      </div>
      <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <p>Logged in as:</p>
        <p className="truncate font-medium">{userEmail}</p>
        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={onSignOut}>Sign out</Button>
      </div>
    </aside>
  );
}
