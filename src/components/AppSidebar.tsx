import { Home, PlusCircle, Clock, BookmarkCheck, Settings } from "lucide-react";
import { ResearchLogs } from "./ResearchLogs";
import { ResearchHistory } from "./ResearchHistory";
import type { Source } from "@/types/research";
import type { LogEntry } from "@/types/research";

interface AppSidebarProps {
  activeView: "dashboard" | "research" | "history" | "saved" | "settings";
  onViewChange: (view: "dashboard" | "research" | "history" | "saved" | "settings") => void;
  logs: LogEntry[];
  isLoading: boolean;
  historyRefreshKey: number;
  onHistorySelect: (item: { query: string; content: string; sources: Source[] }) => void;
  collapsed?: boolean;
}

const navItems = [
  { id: "dashboard" as const, icon: Home, label: "Dashboard" },
  { id: "research" as const, icon: PlusCircle, label: "New Research" },
  { id: "history" as const, icon: Clock, label: "History" },
  { id: "saved" as const, icon: BookmarkCheck, label: "Saved" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
];

export function AppSidebar({
  activeView,
  onViewChange,
  logs,
  isLoading,
  historyRefreshKey,
  onHistorySelect,
  collapsed = false,
}: AppSidebarProps) {
  return (
    <aside
      className={`flex-shrink-0 border-r border-border bg-background flex flex-col transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Expanded content area */}
      {!collapsed && activeView === "history" && (
        <div className="border-t border-border flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <ResearchHistory onSelect={onHistorySelect} refreshKey={historyRefreshKey} />
          </div>
        </div>
      )}

      {!collapsed && (activeView === "research" || activeView === "dashboard") && logs.length > 0 && (
        <div className="border-t border-border flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <ResearchLogs logs={logs} isLoading={isLoading} />
          </div>
        </div>
      )}
    </aside>
  );
}
