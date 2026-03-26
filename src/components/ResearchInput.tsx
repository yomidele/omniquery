import { useCallback, useState } from "react";
import { Mic, Upload, Send } from "lucide-react";
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
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
      <form onSubmit={onFormSubmit}>
        <textarea
          value={displayValue}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Curious? Ask and dive into scholarly insights"
          className="w-full min-h-[100px] md:min-h-[120px] max-h-[200px] rounded-xl bg-background border border-border px-4 py-3 text-sm leading-relaxed text-foreground font-body placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-y"
          disabled={isLoading}
        />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
                  voiceStatus === "listening" ? "text-destructive border-destructive/30 bg-destructive/5" : ""
                }`}
                aria-label="Voice input"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            <label
              htmlFor="upload-research"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!displayValue.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Researching…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Research
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
