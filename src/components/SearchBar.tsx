import { useState, useCallback } from "react";
import { Search, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepthSlider } from "@/components/DepthSlider";
import { ResearchTypeSelector, type ResearchType } from "@/components/ResearchTypeSelector";
import { useVoiceSearch, type VoiceStatus } from "@/hooks/useVoiceSearch";

interface SearchBarProps {
  onSubmit: (query: string, depth: number, researchType: ResearchType) => void;
  isLoading: boolean;
}

function VoiceMicIcon({ status }: { status: VoiceStatus }) {
  if (status === "processing") return <Loader2 className="h-4 w-4 animate-spin" />;
  if (status === "listening") return <Mic className="h-4 w-4 text-destructive animate-pulse" />;
  return <Mic className="h-4 w-4" />;
}

export function SearchBar({ onSubmit, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState(2);
  const [researchType, setResearchType] = useState<ResearchType>("general");

  const handleVoiceResult = useCallback((transcript: string) => {
    setQuery(transcript);
  }, []);

  const { status: voiceStatus, interimText, supported: voiceSupported, toggleListening } =
    useVoiceSearch(handleVoiceResult);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim(), depth, researchType);
    }
  };

  const displayValue = voiceStatus === "listening" && interimText ? interimText : query;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2 md:space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <DepthSlider value={depth} onChange={setDepth} />
        </div>
        <div className="flex-1 min-w-0">
          <ResearchTypeSelector value={researchType} onChange={setResearchType} />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 md:px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent transition-all">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={displayValue}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={voiceStatus === "listening" ? "Listening…" : "Ask a research question…"}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-display min-w-0"
          disabled={isLoading}
        />
        {voiceSupported && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleListening}
            disabled={isLoading}
            className="h-8 w-8 flex-shrink-0"
            title={voiceStatus === "listening" ? "Stop listening" : "Voice search"}
          >
            <VoiceMicIcon status={voiceStatus} />
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!query.trim() || isLoading}
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-display text-xs px-3 md:px-4 flex-shrink-0"
        >
          {isLoading ? "Researching…" : "Research"}
        </Button>
      </div>
    </form>
  );
}
