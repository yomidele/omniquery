import { useState } from "react";
import { ExternalLink, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Source } from "@/types/research";

interface CitationsPanelProps {
  sources: Source[];
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function CitationsPanel({ sources }: CitationsPanelProps) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  const list = (
    <ol className="space-y-2.5">
      {sources.map((s, i) => (
        <li key={i} className="flex gap-2.5 text-sm">
          <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary text-[11px] font-semibold font-display">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block text-foreground font-medium font-display leading-snug hover:text-primary transition-colors line-clamp-2"
            >
              {s.title || s.url}
            </a>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              {domainOf(s.url)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      {/* Mobile: collapsible card */}
      <section
        aria-label="Citations"
        className="lg:hidden bg-card border border-border rounded-xl mb-4 overflow-hidden"
      >
        <Button
          variant="ghost"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full justify-between rounded-none h-12 px-4"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold font-display">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            Citations
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-1">
              {sources.length}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </Button>
        {open && <div className="px-4 pb-4 pt-1 border-t border-border">{list}</div>}
      </section>

      {/* Desktop: sticky sidebar */}
      <aside
        aria-label="Citations"
        className="hidden lg:block sticky top-20 self-start max-h-[calc(100dvh-6rem)] overflow-y-auto bg-card border border-border rounded-xl p-4"
      >
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold font-display mb-3">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          Citations
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-1">
            {sources.length}
          </span>
        </h2>
        {list}
      </aside>
    </>
  );
}
