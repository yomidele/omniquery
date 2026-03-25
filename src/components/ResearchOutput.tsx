import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LinkPreviewCard } from "@/components/LinkPreviewCard";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { LinkViewer } from "@/components/LinkViewer";
import { Button } from "@/components/ui/button";
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

  if (error) {
    return (
      <div className="mt-8 w-full max-w-[800px] rounded-xl border border-[#eb2f96]/20 bg-[#ffe3e8] p-5">
        <p className="font-semibold text-[#9f1239]">Research Error</p>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">{error}</p>
      </div>
    );
  }

  if (!content && !isLoading) {
    return null;
  }

  return (
    <div className="mt-8 w-full max-w-[800px]">
      <div className="flex items-center justify-end gap-2 pb-2">
        <Button variant="outline" onClick={handleCopy} size="sm">Copy</Button>
        <Button variant="outline" onClick={handleDownload} size="sm">PDF</Button>
      </div>

      <article ref={reportRef} className="rounded-2xl border border-[rgba(var(--border),.7)] bg-[rgb(var(--surface))] p-6 text-sm leading-7" style={{ maxWidth: "780px" }}>
        <h2 className="text-3xl font-bold mb-4">{content.split('\n')[0] || "Research Report"}</h2>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-8 mb-3" {...props} />,
            h2: ({ node, ...props }) => <h4 className="text-lg font-semibold mt-7 mb-2" {...props} />,
            h3: ({ node, ...props }) => <h5 className="text-base font-semibold mt-6 mb-2" {...props} />,
            p: ({ node, ...props }) => <p className="mb-3 text-[rgba(var(--foreground),.95)]" {...props} />,
            a: ({ href, children }) => (
              <a href={href} className="text-[rgb(var(--accent))] hover:underline" target="_blank" rel="noreferrer">{children}</a>
            ),
            code: ({ className, children, ...props }) => {
              const codeText = String(children).replace(/\n$/, "");
              if (/language-mermaid/.test(className || "")) {
                return <MermaidDiagram chart={codeText} />;
              }
              return <code className="rounded bg-[rgba(var(--border),.5)] px-1" {...props}>{children}</code>;
            },
          }}
        >
          {content}
        </ReactMarkdown>

        {hasMore && !isPaused && (
          <div className="mt-6 flex justify-center">
            <Button onClick={onContinue} className="omni-cta">Continue Research</Button>
          </div>
        )}

        {sources.length > 0 && !isLoading && (
          <section className="mt-8 border-t border-[rgba(var(--border),.65)] pt-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wider">References</h3>
            <ul className="mt-3 space-y-2 text-xs text-[rgb(var(--muted-foreground))]">
              {sources.map((source, i) => (
                <li key={i}>
                  [{i + 1}] <span className="font-medium text-[rgb(var(--foreground))]">{source.title || source.url}</span> – <button onClick={() => setViewerUrl({ url: source.url, title: source.title })} className="text-[rgb(var(--accent))] underline">Open</button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      {viewerUrl && (
        <LinkViewer url={viewerUrl.url} title={viewerUrl.title} onClose={() => setViewerUrl(null)} />
      )}
    </div>
  );
}
