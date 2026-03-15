import { useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import type { Source } from "@/types/research";
import { ExternalLink, Download, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ResearchReportProps {
  content: string;
  sources: Source[];
  isLoading: boolean;
  error: string | null;
}

export function ResearchReport({ content, sources, isLoading, error }: ResearchReportProps) {
  if (error) {
    return (
      <div className="paper-view py-12">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="text-lg font-semibold text-destructive font-display mb-2">
            Research Error
          </h3>
          <p className="text-sm text-foreground font-body">{error}</p>
        </div>
      </div>
    );
  }

  if (!content && !isLoading) {
    return (
      <div className="paper-view py-24 text-center">
        <h2 className="text-2xl font-semibold text-foreground/30 font-display mb-2">
          Your research report will appear here
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Ask a question to begin autonomous research
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="paper-view py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <article className="prose prose-slate max-w-none font-body prose-headings:font-display prose-headings:text-primary prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-li:leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>

      {isLoading && !content && (
        <div className="flex items-center gap-2 py-8">
          <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
          <span className="text-sm text-muted-foreground font-display">
            Compiling research report…
          </span>
        </div>
      )}

      {isLoading && content && (
        <span className="inline-block h-3 w-0.5 bg-accent animate-pulse-dot ml-0.5" />
      )}

      {sources.length > 0 && !isLoading && (
        <div className="mt-10 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground font-display uppercase tracking-wide mb-3">
            References
          </h3>
          <ol className="space-y-1.5">
            {sources.map((source, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground font-display text-xs mt-0.5 min-w-[1.5rem]">
                  [{i + 1}]
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline flex items-center gap-1 font-display text-sm"
                >
                  {source.title || source.url}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </motion.div>
  );
}
