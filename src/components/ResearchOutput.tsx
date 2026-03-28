import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LinkPreviewCard } from "@/components/LinkPreviewCard";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { LinkViewer } from "@/components/LinkViewer";
import { Button } from "@/components/ui/button";
import {
  ClipboardCopy, Download, PlayCircle, ChevronDown, ChevronUp,
  Minimize2, Maximize2, Target, Shield, AlertTriangle, Lightbulb,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Source } from "@/types/research";
import type { ResearchMode } from "@/components/ModeSwitcher";

interface ResearchOutputProps {
  content: string;
  sources: Source[];
  isLoading: boolean;
  isPaused: boolean;
  retryCountdown: number;
  error: string | null;
  hasMore: boolean;
  onContinue?: () => void;
  mode?: ResearchMode;
  onRefineSection?: (sectionBody: string, action: string) => void;
  researchId?: string | null;
}

// Parse markdown content into titled sections
function parseSections(content: string): Array<{ title: string; body: string; level: number }> {
  const lines = content.split("\n");
  const sections: Array<{ title: string; body: string; level: number }> = [];
  let currentTitle = "";
  let currentLevel = 0;
  let currentBody: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      if (currentTitle || currentBody.length > 0) {
        sections.push({ title: currentTitle, body: currentBody.join("\n"), level: currentLevel });
      }
      currentLevel = headingMatch[1].length;
      currentTitle = headingMatch[2];
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentTitle || currentBody.length > 0) {
    sections.push({ title: currentTitle, body: currentBody.join("\n"), level: currentLevel });
  }
  return sections;
}

// Detect section type for smart icons
function getSectionIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("risk") || lower.includes("limitation") || lower.includes("threat")) return AlertTriangle;
  if (lower.includes("verdict") || lower.includes("conclusion") || lower.includes("decision") || lower.includes("recommendation")) return CheckCircle2;
  if (lower.includes("insight") || lower.includes("finding") || lower.includes("key")) return Lightbulb;
  if (lower.includes("contradiction") || lower.includes("gap") || lower.includes("debate")) return AlertTriangle;
  if (lower.includes("evidence") || lower.includes("source") || lower.includes("credibility")) return Shield;
  return null;
}

const markdownComponents = (handleLinkClick: (url: string, title?: string) => void) => ({
  code({ className, children, ...props }: any) {
    const match = /language-mermaid/.test(className || "");
    const code = String(children).replace(/\n$/, "");
    if (match) return <MermaidDiagram chart={code} />;
    return <code className={className} {...props}>{children}</code>;
  },
  a({ href, children }: any) {
    if (!href) return <span>{children}</span>;
    return (
      <a
        href={href}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          handleLinkClick(href, typeof children === "string" ? children : undefined);
        }}
        className="text-primary cursor-pointer hover:underline"
      >
        {children}
      </a>
    );
  },
  table({ children }: any) {
    return (
      <div className="overflow-x-auto -mx-4 px-4 md:-mx-8 md:px-8">
        <table className="min-w-full">{children}</table>
      </div>
    );
  },
});

// Refine buttons for each section
function RefineButtons({ sectionBody, onAction }: { sectionBody: string; onAction?: (sectionBody: string, action: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleClick = (action: string) => {
    if (!onAction) return;
    setLoading(action);
    onAction(sectionBody, action);
    // Reset after a short delay (parent will update content)
    setTimeout(() => setLoading(null), 2000);
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <button onClick={() => handleClick("simplify")} disabled={!!loading} className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 cursor-pointer active:scale-95">
        {loading === "simplify" ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Minimize2 className="h-3 w-3" />} Simplify
      </button>
      <button onClick={() => handleClick("expand")} disabled={!!loading} className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 cursor-pointer active:scale-95">
        {loading === "expand" ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Maximize2 className="h-3 w-3" />} Expand
      </button>
      <button onClick={() => handleClick("decide")} disabled={!!loading} className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 cursor-pointer active:scale-95">
        {loading === "decide" ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Target className="h-3 w-3" />} Decision-Focus
      </button>
    </div>
  );
}

// ─── Source Credibility Badge ────────────────────────────────
function SourceCredibilityBadge({ url }: { url: string }) {
  const domain = (() => {
    try { return new URL(url).hostname; } catch { return ""; }
  })();
  const isAcademic = /\.edu|\.gov|scholar\.google|pubmed|arxiv|doi\.org|jstor|springer|wiley|nature\.com|science\.org/i.test(domain);
  const isNews = /reuters|bbc|nytimes|washingtonpost|guardian|apnews/i.test(domain);

  if (isAcademic) return <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold"><Shield className="h-2.5 w-2.5" />Academic</span>;
  if (isNews) return <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-accent/30 text-accent-foreground font-semibold">News</span>;
  return <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">Web</span>;
}

// ─── EXECUTIVE MODE ──────────────────────────────────────────
function ExecutiveLayout({ content, handleLinkClick, onRefine }: { content: string; handleLinkClick: (url: string, title?: string) => void; onRefine?: (sectionBody: string, action: string) => void }) {
  const sections = parseSections(content);
  if (sections.length <= 1) {
    return <DefaultMarkdown content={content} handleLinkClick={handleLinkClick} />;
  }

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const isVerdict = section.title.toLowerCase().includes("verdict") || section.title.toLowerCase().includes("conclusion") || section.title.toLowerCase().includes("decision");
        const isRisk = section.title.toLowerCase().includes("risk") || section.title.toLowerCase().includes("limitation");
        const SectionIcon = getSectionIcon(section.title);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`group rounded-xl border p-4 ${
              isVerdict
                ? "border-primary/30 bg-primary/5 shadow-sm"
                : isRisk
                ? "border-destructive/20 bg-destructive/5"
                : "border-border bg-card"
            }`}
          >
            {section.title && (
              <div className="flex items-center gap-2 mb-2">
                {SectionIcon && <SectionIcon className={`h-3.5 w-3.5 ${isVerdict ? "text-primary" : isRisk ? "text-destructive" : "text-muted-foreground"}`} />}
                <h3 className={`text-sm font-bold font-display ${isVerdict ? "text-primary" : isRisk ? "text-destructive" : "text-foreground"}`}>
                  {section.title}
                </h3>
              </div>
            )}
            <div className="prose prose-slate dark:prose-invert max-w-none prose-sm font-body prose-p:leading-snug prose-p:mb-1.5 overflow-x-hidden">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(handleLinkClick)}>
                {section.body.trim()}
              </ReactMarkdown>
            </div>
            <RefineButtons sectionBody={section.body.trim()} onAction={onRefine} />
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── RESEARCH MODE (collapsible panels) ──────────────────────
function ResearchLayout({ content, handleLinkClick, onRefine }: { content: string; handleLinkClick: (url: string, title?: string) => void; onRefine?: (sectionBody: string, action: string) => void }) {
  const sections = parseSections(content);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  if (sections.length <= 1) {
    return <DefaultMarkdown content={content} handleLinkClick={handleLinkClick} />;
  }

  const toggle = (idx: number) => setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="space-y-2">
      {sections.map((section, i) => {
        const SectionIcon = getSectionIcon(section.title);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group border border-border rounded-xl bg-card overflow-hidden"
          >
            {section.title && (
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {SectionIcon && <SectionIcon className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-semibold font-display text-foreground">{section.title}</span>
                </div>
                {collapsed[i] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
              </button>
            )}
            <AnimatePresence initial={false}>
              {!collapsed[i] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 prose prose-slate dark:prose-invert max-w-none prose-sm md:prose-base font-body prose-headings:font-display prose-p:leading-relaxed overflow-x-hidden">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(handleLinkClick)}>
                      {section.body.trim()}
                    </ReactMarkdown>
                  </div>
                  <div className="px-4 pb-3">
                    <RefineButtons sectionBody={section.body.trim()} onAction={onRefine} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── LITERATURE MODE (reading flow) ──────────────────────────
function LiteratureLayout({ content, handleLinkClick }: { content: string; handleLinkClick: (url: string, title?: string) => void }) {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none font-body prose-headings:font-display prose-headings:text-primary prose-p:leading-loose prose-p:text-[15px] md:prose-p:text-base prose-li:leading-loose prose-sm md:prose-base overflow-x-hidden">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(handleLinkClick)}>
        {content}
      </ReactMarkdown>
    </article>
  );
}

// ─── Default fallback ────────────────────────────────────────
function DefaultMarkdown({ content, handleLinkClick }: { content: string; handleLinkClick: (url: string, title?: string) => void }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none font-body prose-headings:font-display prose-headings:text-primary prose-p:leading-relaxed prose-li:leading-relaxed prose-sm md:prose-base overflow-x-hidden">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(handleLinkClick)}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

const MODE_LABELS: Record<ResearchMode, string> = {
  executive: "Executive Summary",
  research: "Research Report",
  literature: "Literature Review",
};

export function ResearchOutput({ content, sources, isLoading, error, hasMore, onContinue, isPaused, retryCountdown, mode = "research", onRefineSection, researchId }: ResearchOutputProps) {
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

    // Save to bookmarks if we have a research ID and user
    if (researchId) {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if already bookmarked
          const { data: existing } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", user.id)
            .eq("research_id", researchId)
            .maybeSingle();
          if (!existing) {
            await supabase.from("bookmarks").insert({
              user_id: user.id,
              research_id: researchId,
            });
          }
        }
      } catch (e) {
        console.error("Failed to save bookmark:", e);
      }
    }
  }, [researchId]);

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

      {/* Toolbar - ALWAYS visible, sticky on mobile, static on desktop */}
      {content && !isLoading && (
        <div className="flex justify-end gap-2 mb-3 sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-2 px-1">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs h-9">
            <ClipboardCopy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs h-9">
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </Button>
        </div>
      )}

      {/* Report container */}
      <div ref={reportRef} className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 px-5 pt-4 pb-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-accent/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-primary/50" />
          <span className="ml-2 text-xs text-muted-foreground font-display">{MODE_LABELS[mode]}</span>
        </div>

        <div className={`px-4 py-4 ${mode === "literature" ? "md:px-10 md:py-8" : "md:px-6 md:py-6"}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {mode === "executive" && <ExecutiveLayout content={content} handleLinkClick={handleLinkClick} onRefine={onRefineSection} />}
              {mode === "research" && <ResearchLayout content={content} handleLinkClick={handleLinkClick} onRefine={onRefineSection} />}
              {mode === "literature" && <LiteratureLayout content={content} handleLinkClick={handleLinkClick} />}
            </motion.div>
          </AnimatePresence>

          {/* Loading cursor */}
          {isLoading && content && !isPaused && (
            <span className="inline-block h-4 w-0.5 bg-primary animate-pulse-dot ml-0.5 mt-2" />
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

          {/* References with credibility badges */}
          {sources.length > 0 && !isLoading && (
            <div className="mt-8 md:mt-10 pt-4 md:pt-6 border-t border-border">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 font-display">
                References
              </h3>
              <div className="space-y-2">
                {sources.map((source, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground font-display text-xs mt-2 min-w-[1.5rem]">[{i + 1}]</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <SourceCredibilityBadge url={source.url} />
                      </div>
                      <div
                        className="cursor-pointer"
                        onClick={() => handleLinkClick(source.url, source.title)}
                      >
                        <LinkPreviewCard url={source.url} title={source.title} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
