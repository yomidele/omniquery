import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LinkPreviewCard } from "@/components/LinkPreviewCard";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { LinkViewer } from "@/components/LinkViewer";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, Download, PlayCircle } from "lucide-react";
import type { Source } from "@/types/research";

interface ResearchOutputProps {
  content: string;
  sources: Source[];
  isLoading: boolean;
  isPaused: boolean;
  retryCountdown: number;
  error: string | null;
  hasMore: boolean;
  onContinue?: () => void;
}

export function ResearchOutput({ content, sources, isLoading, error, hasMore, onContinue, isPaused, retryCountdown }: ResearchOutputProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [viewerUrl, setViewerUrl] = useState<{ url: string; title?: string } | null>(null);

  const handleCopy = useCallback(async () => {
    const text = `${content}\n\n${sources.length > 0 ? "References:\n" + sources.map((s, i) => `[${i + 1}] ${s.title || s.url} - ${s.url}`).join("\n") : ""}`;
    await navigator.clipboard.writeText(text);
  }, [content, sources]);

  const handleDownload = useCallback(async () => {
    if (!reportRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf().set({ margin: 0.5, filename: "omniquery_report.pdf", html2canvas: { scale: 2 }, jsPDF: { unit: "in", format: "a4" } }).from(reportRef.current).save();
  }, []);

  const handleLinkClick = useCallback((url: string, title?: string) => {
    setViewerUrl({ url, title });
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <p className="font-semibold text-destructive text-sm font-display">Research Error</p>
        <p className="text-sm text-muted-foreground mt-1 font-body">{error}</p>
      </div>
    );
  }

  if (!content && !isLoading) return null;

  return (
    <div className="w-full">
      {viewerUrl && <LinkViewer url={viewerUrl.url} title={viewerUrl.title} onClose={() => setViewerUrl(null)} />}

      {/* Toolbar */}
      {content && !isLoading && (
        <div className="flex justify-end gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            <ClipboardCopy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      )}

      {/* Report header dots */}
      <div ref={reportRef} className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 px-5 pt-4 pb-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
          <span className="ml-2 text-xs text-muted-foreground font-display">Research Report</span>
        </div>

        <article className="px-4 md:px-8 py-4 md:py-6">
          <div className="prose prose-slate dark:prose-invert max-w-none font-body prose-headings:font-display prose-headings:text-primary prose-p:leading-relaxed prose-li:leading-relaxed prose-sm md:prose-base overflow-x-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-mermaid/.test(className || "");
                  const code = String(children).replace(/\n$/, "");
                  if (match) return <MermaidDiagram chart={code} />;
                  return <code className={className} {...props}>{children}</code>;
                },
                a({ href, children }) {
                  if (!href) return <span>{children}</span>;
                  return (
                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(href, typeof children === "string" ? children : undefined);
                      }}
                      className="text-primary cursor-pointer hover:underline"
                    >
                      {children}
                    </a>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto -mx-4 px-4 md:-mx-8 md:px-8">
                      <table className="min-w-full">{children}</table>
                    </div>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Loading cursor */}
          {isLoading && content && !isPaused && (
            <span className="inline-block h-4 w-0.5 bg-primary animate-pulse-dot ml-0.5" />
          )}

          {/* Continue button */}
          {hasMore && !isLoading && content && (
            <div className="mt-8 flex justify-center">
              <Button onClick={onContinue} className="gap-2 rounded-xl">
                <PlayCircle className="h-4 w-4" />
                Continue Research
              </Button>
            </div>
          )}

          {isLoading && content && !isPaused && (
            <div className="mt-6 flex justify-center">
              <Button disabled className="gap-2 opacity-70 rounded-xl">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating…
              </Button>
            </div>
          )}

          {/* References */}
          {sources.length > 0 && !isLoading && (
            <div className="mt-8 md:mt-10 pt-4 md:pt-6 border-t border-border">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 font-display">
                References
              </h3>
              <div className="space-y-2">
                {sources.map((source, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground font-display text-xs mt-2 min-w-[1.5rem]">[{i + 1}]</span>
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => handleLinkClick(source.url, source.title)}
                    >
                      <LinkPreviewCard url={source.url} title={source.title} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
