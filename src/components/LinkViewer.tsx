import { useState, useCallback } from "react";
import { X, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkViewerProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export function LinkViewer({ url, title, onClose }: LinkViewerProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    setFailed(true);
    setLoading(false);
    // Open in new tab as fallback
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }, [url, onClose]);

  const hostname = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate font-display">
            {title || hostname}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{url}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          className="h-8 w-8"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading */}
      {loading && !failed && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="ml-2 text-sm text-muted-foreground font-display">Loading…</span>
        </div>
      )}

      {/* Iframe */}
      {!failed && (
        <iframe
          src={url}
          className="flex-1 w-full border-none"
          onLoad={() => setLoading(false)}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title={title || hostname}
        />
      )}
    </div>
  );
}
