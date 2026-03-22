import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
});

let counter = 0;

const VALID_STARTS = [
  "graph ", "graph\n", "flowchart ", "flowchart\n",
  "sequenceDiagram", "classDiagram", "stateDiagram",
  "erDiagram", "gantt", "pie", "gitGraph", "mindmap",
  "timeline", "journey", "quadrantChart", "xychart",
  "sankey", "block-beta",
];

function isValidMermaidSyntax(chart: string): boolean {
  const trimmed = chart.trim();
  return VALID_STARTS.some((s) => trimmed.startsWith(s));
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (!isValidMermaidSyntax(chart)) {
      setError(true);
      return;
    }
    const id = `mermaid-${++counter}`;
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => setError(true));
  }, [chart]);

  if (error) {
    return (
      <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono text-foreground">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center overflow-x-auto rounded-lg bg-card border border-border p-4"
    />
  );
}
