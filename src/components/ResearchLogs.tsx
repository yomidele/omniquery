import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe, FileText, Database, Sparkles, Check, AlertCircle } from "lucide-react";
import type { LogEntry } from "@/types/research";

const stepIcons: Record<string, React.ReactNode> = {
  "Querying Chroma memory": <Database className="h-4 w-4" />,
  "Searching with Tavily": <Globe className="h-4 w-4" />,
  "Extracting content with Firecrawl": <FileText className="h-4 w-4" />,
  "Storing in Chroma": <Database className="h-4 w-4" />,
  "Generating research report": <Sparkles className="h-4 w-4" />,
};

function StatusDot({ status }: { status: LogEntry["status"] }) {
  if (status === "running") return <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse-dot" />;
  if (status === "done") return <Check className="h-3.5 w-3.5 text-success" />;
  return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
}

interface ResearchLogsProps {
  logs: LogEntry[];
  isLoading: boolean;
}

export function ResearchLogs({ logs, isLoading }: ResearchLogsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-semibold text-foreground font-display uppercase tracking-wider">
            Research Logs
          </h2>
          {isLoading && <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse-dot ml-auto" />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div
              key={log.step}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.05 }}
              className="research-log-item"
            >
              <div className="flex items-center gap-2 text-foreground">
                <span className="text-primary/60">{stepIcons[log.step] || <Search className="h-4 w-4" />}</span>
                <span className="text-xs font-medium flex-1 truncate">{log.step}</span>
                <StatusDot status={log.status} />
              </div>
              {log.detail && (
                <p className="text-[11px] text-muted-foreground mt-0.5 ml-6 leading-tight">{log.detail}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && !isLoading && (
          <div className="px-4 py-8 text-center">
            <Search className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground/60">Submit a query to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
