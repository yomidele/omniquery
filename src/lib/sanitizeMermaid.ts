/**
 * Sanitize AI-generated Mermaid diagram syntax to prevent rendering errors.
 * Aggressively fixes common issues from LLM output.
 * Returns null if the diagram is unsalvageable.
 */

const VALID_HEADERS_RE =
  /^(graph\s+(TD|LR|RL|BT|TB)|flowchart\s+(TD|LR|RL|BT|TB)|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|mindmap|timeline|journey|quadrantChart|xychart|sankey|block-beta)/;

function hasValidHeader(chart: string): boolean {
  return VALID_HEADERS_RE.test(chart.trim());
}

/** Strip emojis and other non-ASCII symbols that break the Mermaid lexer */
function stripProblematicChars(text: string): string {
  // Remove emojis (surrogate pairs), zero-width chars, and other non-ASCII symbols
  // but keep basic accented letters (Latin Extended)
  return text.replace(
    /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{200B}-\u{200D}]|[\u{2028}\u{2029}]/gu,
    ""
  );
}

/** Remove HTML tags that LLMs sometimes inject */
function stripHTML(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/** Fix common LLM issues in node labels */
function fixNodeLabels(line: string): string {
  // Replace smart quotes with regular quotes
  let fixed = line
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'");

  // Remove semicolons at end of lines (common LLM mistake)
  fixed = fixed.replace(/;\s*$/, "");

  // Fix double arrows like "==> " to "-->"
  fixed = fixed.replace(/==>/g, "-->");

  // Remove pipe chars that aren't part of |label| syntax on edges
  // (keep |text| between arrows)

  return fixed;
}

function balanceBrackets(text: string): string {
  let result = text;
  const pairs: [string, string][] = [["[", "]"], ["(", ")"], ["{", "}"]];

  for (const [open, close] of pairs) {
    let count = 0;
    for (const ch of result) {
      if (ch === open) count++;
      else if (ch === close) count--;
    }
    while (count > 0) {
      result += close;
      count--;
    }
  }
  return result;
}

/** Remove lines that are clearly broken */
function filterBrokenLines(lines: string[]): string[] {
  return lines.filter((line, i) => {
    if (i === 0) return true; // header
    const trimmed = line.trim();
    if (!trimmed) return true; // blank lines are fine

    // Remove lines that are just punctuation or garbage
    if (/^[^\w\s]*$/.test(trimmed)) return false;

    // Remove lines with unmatched quotes
    const doubleQuotes = (trimmed.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) return false;

    return true;
  });
}

/** Truncate to last complete line */
function truncateAtLastCompleteLine(lines: string[]): string[] {
  for (let i = lines.length - 1; i >= 1; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    const openCount = (line.match(/[\[\(\{]/g) || []).length;
    const closeCount = (line.match(/[\]\)\}]/g) || []).length;
    if (openCount !== closeCount) {
      lines.splice(i, 1);
      continue;
    }
    break;
  }
  return lines;
}

export function sanitizeMermaid(raw: string): string | null {
  if (!raw || !raw.trim()) return null;

  let chart = raw.trim();

  // Strip HTML, emojis, problematic chars
  chart = stripHTML(chart);
  chart = stripProblematicChars(chart);

  // Add default header if missing
  if (!hasValidHeader(chart)) {
    if (/-->|---/.test(chart)) {
      chart = "graph TD\n" + chart;
      console.debug("[MermaidSanitizer] Added default 'graph TD' header");
    } else {
      console.debug("[MermaidSanitizer] Content doesn't look like a mermaid diagram");
      return null;
    }
  }

  // Process lines
  let lines = chart.split("\n");

  // Fix each line
  lines = lines.map((line, i) => (i === 0 ? line : fixNodeLabels(line)));

  // Filter broken lines
  lines = filterBrokenLines(lines);

  // Truncate at last complete line
  lines = truncateAtLastCompleteLine(lines);

  chart = lines.join("\n");

  // Balance brackets across entire diagram
  chart = balanceBrackets(chart);

  // Must have header + at least 1 content line
  const contentLines = chart.split("\n").filter((l) => l.trim());
  if (contentLines.length < 2) {
    console.debug("[MermaidSanitizer] Diagram too short after sanitization");
    return null;
  }

  return chart;
}
