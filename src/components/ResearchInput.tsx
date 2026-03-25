import { useCallback, useMemo, useState } from "react";
import { Mic, Upload } from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

interface ResearchInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  defaultQuery?: string;
}

export function ResearchInput({ onSubmit, isLoading, defaultQuery = "" }: ResearchInputProps) {
  const [query, setQuery] = useState(defaultQuery);
  const { status: voiceStatus, interimText, supported: voiceSupported, toggleListening } = useVoiceSearch((value) => setQuery(value));

  const displayValue = voiceStatus === "listening" && interimText ? interimText : query;

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setQuery(event.target.result);
      }
    };
    reader.readAsText(file);
  }, []);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayValue.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  };

  return (
    <div className="omni-card p-5">
      <form onSubmit={onFormSubmit} className="space-y-4">
        <textarea
          value={displayValue}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything… get a structured, citation-backed research report"
          className="w-full min-h-[135px] max-h-[220px] rounded-xl border border-[rgba(var(--border),.75)] bg-[rgb(var(--surface))] px-4 py-3 text-base leading-[1.6] text-[rgb(var(--foreground))] outline-none transition-all duration-200 focus:border-[rgba(var(--accent),.9)] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.20)]"
          style={{ resize: "vertical" }}
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={voiceSupported ? toggleListening : undefined}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(var(--border),.85)] bg-[rgb(var(--surface))] transition hover:border-[rgba(var(--accent),.95)]"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
            <label
              htmlFor="upload-research"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[rgba(var(--border),.85)] bg-[rgb(var(--surface))] transition hover:border-[rgba(var(--accent),.95)]"
              aria-label="Upload text file"
            >
              <Upload className="h-4 w-4" />
              <input
                id="upload-research"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl px-5 text-sm font-semibold text-[rgb(var(--accent-foreground))] bg-[rgb(var(--accent))] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!displayValue.trim() || isLoading}
          >
            {isLoading ? "Researching…" : "Start Research"}
          </button>
        </div>
      </form>
    </div>
  );
}
