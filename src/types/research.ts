export interface LogEntry {
  step: string;
  status: "running" | "done" | "error";
  detail?: string;
}

export interface Source {
  url: string;
  title: string;
}

export interface ResearchState {
  logs: LogEntry[];
  content: string;
  sources: Source[];
  isLoading: boolean;
  isPaused: boolean;
  retryCountdown: number;
  error: string | null;
  hasMore: boolean;
  batchIndex: number;
}
