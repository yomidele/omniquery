import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { sanitizeMermaid } from "@/lib/sanitizeMermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
  suppressErrorRendering: true,
});

let counter = 0;

export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const idRef = useRef(`mermaid-${++counter}`);

  useEffect(() => {
    if (!ref.current) return;

    const clean = sanitizeMermaid(chart);
    if (!clean) {
      setError(true);
      return;
    }

    let cancelled = false;
    const id = idRef.current;

    (async () => {
      try {
        // Validate first — this avoids mermaid injecting error elements
        const valid = await mermaid.parse(clean, { suppressErrors: true });
        if (!valid || cancelled) {
          if (!cancelled) setError(true);
          return;
        }

        const { svg } = await mermaid.render(id, clean);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(false);
        }
      } catch (err) {
        console.debug("[MermaidDiagram] Render failed:", err);
        if (!cancelled) {
          setError(true);
          // Clean up any error elements mermaid injected into the body
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

  if (error) {
    return (
      <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground font-display">
        Mermaid diagram could not be rendered. Content sanitized.
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
