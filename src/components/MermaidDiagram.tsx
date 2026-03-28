import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { sanitizeMermaid } from "@/lib/sanitizeMermaid";
import { AlertTriangle } from "lucide-react";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
  suppressErrorRendering: true,
});

let counter = 0;

type RenderState = "loading" | "mermaid" | "fallback-svg" | "error";

// Simple SVG fallback: parse nodes and edges from mermaid source
function generateFallbackSVG(chart: string): string | null {
  try {
    const lines = chart.trim().split("\n").filter(l => l.trim());
    const nodes: Map<string, string> = new Map();
    const edges: Array<[string, string, string]> = [];

    for (const line of lines) {
      // Match: A[Label] --> B[Label]
      const edgeMatch = line.match(/(\w+)(?:\[([^\]]*)\])?\s*-->?\|?([^|]*)\|?\s*(\w+)(?:\[([^\]]*)\])?/);
      if (edgeMatch) {
        const [, fromId, fromLabel, edgeLabel, toId, toLabel] = edgeMatch;
        if (fromLabel) nodes.set(fromId, fromLabel);
        if (toLabel) nodes.set(toId, toLabel);
        if (!nodes.has(fromId)) nodes.set(fromId, fromId);
        if (!nodes.has(toId)) nodes.set(toId, toId);
        edges.push([fromId, toId, edgeLabel?.trim() || ""]);
        continue;
      }
      // Match standalone node: A[Label]
      const nodeMatch = line.match(/^\s*(\w+)\[([^\]]*)\]/);
      if (nodeMatch) {
        nodes.set(nodeMatch[1], nodeMatch[2]);
      }
    }

    if (nodes.size === 0) return null;

    const nodeList = Array.from(nodes.entries());
    const boxW = 160, boxH = 40, gapY = 70, paddingX = 40;
    const svgH = nodeList.length * gapY + 40;
    const svgW = boxW + paddingX * 2;
    const cx = svgW / 2;

    const nodePositions = new Map<string, { x: number; y: number }>();
    let rects = "";
    nodeList.forEach(([id, label], i) => {
      const y = 20 + i * gapY;
      nodePositions.set(id, { x: cx, y: y + boxH / 2 });
      rects += `<rect x="${cx - boxW / 2}" y="${y}" width="${boxW}" height="${boxH}" rx="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" stroke-width="1"/>`;
      rects += `<text x="${cx}" y="${y + boxH / 2 + 5}" text-anchor="middle" fill="hsl(var(--foreground))" font-size="12" font-family="Inter, sans-serif">${escapeXml(label)}</text>`;
    });

    let arrows = "";
    for (const [from, to] of edges) {
      const f = nodePositions.get(from);
      const t = nodePositions.get(to);
      if (f && t) {
        arrows += `<line x1="${f.x}" y1="${f.y + boxH / 2}" x2="${t.x}" y2="${t.y - boxH / 2}" stroke="hsl(var(--muted-foreground))" stroke-width="1.5" marker-end="url(#arrow)"/>`;
      }
    }

    return `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))"/></marker></defs>
      ${arrows}${rects}
    </svg>`;
  } catch {
    return null;
  }
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [renderState, setRenderState] = useState<RenderState>("loading");
  const [fallbackSvg, setFallbackSvg] = useState<string | null>(null);
  const idRef = useRef(`mermaid-${++counter}`);

  useEffect(() => {
    if (!ref.current) return;

    const clean = sanitizeMermaid(chart);
    if (!clean) {
      // Try fallback
      const svg = generateFallbackSVG(chart);
      if (svg) {
        setFallbackSvg(svg);
        setRenderState("fallback-svg");
      } else {
        setRenderState("error");
      }
      return;
    }

    let cancelled = false;
    const id = idRef.current;

    (async () => {
      try {
        const valid = await mermaid.parse(clean, { suppressErrors: true });
        if (!valid || cancelled) {
          if (!cancelled) {
            const svg = generateFallbackSVG(chart);
            if (svg) {
              setFallbackSvg(svg);
              setRenderState("fallback-svg");
            } else {
              setRenderState("error");
            }
          }
          return;
        }

        const { svg } = await mermaid.render(id, clean);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setRenderState("mermaid");
        }
      } catch (err) {
        console.debug("[MermaidDiagram] Render failed:", err);
        if (!cancelled) {
          const svg = generateFallbackSVG(chart);
          if (svg) {
            setFallbackSvg(svg);
            setRenderState("fallback-svg");
          } else {
            setRenderState("error");
          }
          const errorEl = document.getElementById("d" + id);
          if (errorEl) errorEl.remove();
          const errorContainer = document.querySelector(`[id="${id}"]`);
          if (errorContainer && !ref.current?.contains(errorContainer)) {
            errorContainer.remove();
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (renderState === "error") {
    return (
      <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground font-display flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        Diagram could not be rendered. Content sanitized.
      </div>
    );
  }

  if (renderState === "fallback-svg" && fallbackSvg) {
    return (
      <div className="my-4 rounded-lg bg-card border border-border p-4 space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-display">
          <AlertTriangle className="h-3 w-3" />
          Diagram rendered using alternative engine
        </div>
        <div className="flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: fallbackSvg }} />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center overflow-x-auto rounded-lg bg-card border border-border p-4"
    />
  );
}
