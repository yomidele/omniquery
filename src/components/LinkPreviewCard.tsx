import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface LinkPreviewCardProps {
  url: string;
  title?: string;
}

export function LinkPreviewCard({ url, title }: LinkPreviewCardProps) {
  const [hovered, setHovered] = useState(false);
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 group ${
        hovered
          ? "border-accent/40 bg-accent/5 shadow-sm"
          : "border-border/30 bg-muted/20"
      }`}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        alt=""
        className="h-5 w-5 rounded flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate font-display">
          {title || hostname}
        </p>
        <p className="text-xs text-muted-foreground truncate">{hostname}</p>
      </div>
      <ExternalLink className={`h-4 w-4 flex-shrink-0 transition-colors ${hovered ? "text-accent" : "text-muted-foreground/40"}`} />
    </a>
  );
}
