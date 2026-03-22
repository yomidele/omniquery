import { useRef, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import type { Source } from "@/types/research";
import { Download, ClipboardCopy, Pause, Timer, PlayCircle } from "lucide-react";
import { LinkPreviewCard } from "@/components/LinkPreviewCard";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { LinkViewer } from "@/components/LinkViewer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface ResearchReportProps {
  content: string;
  sources: Source[];
  isLoading: boolean;
  isPaused: boolean;
  retryCountdown: number;
  error: string | null;
  hasMore: boolean;
  onContinue?: () => void;
}

export function ResearchReport({ content, sources, isLoading, isPaused, retryCountdown, error, hasMore, onContinue }: ResearchReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [viewerUrl, setViewerUrl] = useState<{ url: string; title?: string } | null>(null);

  const handleCopy = useCallback(async () => {
    const text = content + (sources.length > 0
      ? "\n\nReferences:\n" + sources.map((s, i) => `[${i + 1}] ${s.title || s.url} - ${s.url}`).join("\n")
      : "");
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }, [content, sources]);

  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf()
      .set({ margin: 0.5, filename: "research-report.pdf", html2canvas: { scale: 2 }, jsPDF: { unit: "in", format: "a4" } })
      .from(reportRef.current)
      .save();
  }, []);

  const handleLinkClick = useCallback((url: string, title?: string) => {
    setViewerUrl({ url, title });
  }, []);

  if (error) {
    return (
      <div className="paper-view py-8 px-2">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-destructive font-display mb-2">Research Error</h3>
          <p className="text-xs md:text-sm text-foreground font-body">{error}</p>
        </div>
      </div>
    );
  }

  if (!content && !isLoading) {
    return (
      <div className="paper-view py-12 md:py-24 text-center px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground/30 font-display mb-2">
          Your research report will appear here
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground font-body">
          Ask a question to begin autonomous research
        </p>
      </div>
    );
  }

  return (
    <div>
      {viewerUrl && (
        <LinkViewer
          url={viewerUrl.url}
          title={viewerUrl.title}
          onClose={() => setViewerUrl(null)}
        />
      )}

      {content && !isLoading && (
        <div className="paper-view pt-4 flex justify-end gap-2 px-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <ClipboardCopy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      )}

      {/* Paused / Rate limit banner */}
      {isPaused && (
        <motion.div
          className="paper-view px-2 pt-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Pause className="h-5 w-5 text-accent flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground font-display">
                  Research limit reached for this minute
                </p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  AI will continue generating more results in the background.
                </p>
              </div>
            </div>
            {retryCountdown > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground font-display flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5" />
                    Next segment available in {retryCountdown}s
                  </span>
                </div>
                <Progress value={Math.max(0, 100 - (retryCountdown / 60) * 100)} className="h-1.5" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      <motion.div
        className="paper-view py-4 md:py-8 px-2"
        ref={reportRef}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <article className="prose prose-slate max-w-none font-body prose-headings:font-display prose-headings:text-primary prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-li:leading-relaxed prose-sm md:prose-base overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-mermaid/.test(className || "");
                const code = String(children).replace(/\n$/, "");
                if (match) {
                  return <MermaidDiagram chart={code} />;
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
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
                    className="text-accent cursor-pointer hover:underline"
                  >
                    {children}
                  </a>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto -mx-2 px-2">
                    <table>{children}</table>
                  </div>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        {isLoading && !content && (
          <div className="flex items-center gap-2 py-8">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
            <span className="text-sm text-muted-foreground font-display">Compiling research report…</span>
          </div>
        )}

        {isLoading && content && !isPaused && (
          <span className="inline-block h-3 w-0.5 bg-accent animate-pulse-dot ml-0.5" />
        )}

        {/* Continue Research button */}
        {hasMore && !isLoading && content && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={onContinue}
              className="gap-2 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent/70 font-display"
            >
              <PlayCircle className="h-4 w-4" />
              Continue Research
            </Button>
          </div>
        )}

        {isLoading && content && !isPaused && (
          <div className="mt-6 flex justify-center">
            <Button disabled className="gap-2 font-display opacity-70">
              <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating…
            </Button>
          </div>
        )}

        {sources.length > 0 && !isLoading && (
          <div className="mt-8 md:mt-10 pt-4 md:pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground font-display uppercase tracking-wide mb-3">
              References
            </h3>
            <div className="space-y-2">
              {sources.map((source, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground font-display text-xs mt-3 min-w-[1.5rem]">[{i + 1}]</span>
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
      </motion.div>
    </div>
  );
}
