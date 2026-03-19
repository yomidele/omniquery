import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepthSlider } from "@/components/DepthSlider";

interface SearchBarProps {
  onSubmit: (query: string, depth: number) => void;
  isLoading: boolean;
}

export function SearchBar({ onSubmit, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim(), depth);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2 md:space-y-3">
      <DepthSlider value={depth} onChange={setDepth} />
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 md:px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent transition-all">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a research question…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-display min-w-0"
          disabled={isLoading}
        />
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
