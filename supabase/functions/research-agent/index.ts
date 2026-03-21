import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResearchRequest {
  query: string;
  depth?: string;
  previousContent?: string;
  batchIndex?: number;
}

interface LogEntry {
  step: string;
  status: "running" | "done" | "error";
  detail?: string;
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

const DEPTH_CONFIG: Record<string, { maxSources: number; maxContent: number; model: string }> = {
  quick:    { maxSources: 2, maxContent: 1500, model: "gpt-4o-mini" },
  standard: { maxSources: 5, maxContent: 3000, model: "gpt-4o-mini" },
  deep:     { maxSources: 8, maxContent: 5000, model: "gpt-4o-mini" },
  academic: { maxSources: 10, maxContent: 6000, model: "gpt-4o-mini" },
  expert:   { maxSources: 12, maxContent: 8000, model: "gpt-4o-mini" },
};

function getSystemPrompt(depth: string): string {
  const base = `You are OmniQuery, a professional AI Research Engine. Generate a comprehensive, well-structured research report in Markdown format.

IMPORTANT: Only use information from the provided sources. Cite sources inline where relevant. Use proper Markdown formatting with headings, bullet points, tables, and structured content.

When a topic involves processes, systems, or workflows, include Mermaid.js diagrams using fenced code blocks with the language "mermaid". Example:

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[Result]
\`\`\`
`;

  if (depth === "quick") {
    return base + `\nProvide a concise answer with:
# Title
## Summary
Brief 2-3 paragraph answer with key points.
## Sources
Numbered list of sources used.`;
  }

  if (depth === "standard") {
    return base + `\nProvide a structured report:
# Title
## Executive Summary
3-5 paragraph overview.
## Detailed Analysis
In-depth exploration of the topic with examples.
## Key Findings
Bullet points of important discoveries.
## Sources
Numbered list of sources used.`;
  }

  return base + `\nYour response MUST follow this exact structure:

# [Concise Research Title]

## Executive Summary
3-5 paragraph comprehensive overview of all findings.

## Background Context
Historical context, foundational concepts, and how the topic evolved.

## Detailed Research Analysis
Break the research into multiple paths. For each path provide long explanations, real-world examples, comparisons, and technical breakdowns. Cover:
- Historical context
- Technical explanation
- Current industry practices
- Expert opinions
- Case studies
- Advantages and risks

## Data & Evidence
Include statistics, research findings, case studies, structured tables, and industry data. Use Markdown tables where appropriate.

## Visual Diagrams
Generate Mermaid.js diagrams for any processes, systems, architectures, or workflows discussed. Use fenced code blocks with language "mermaid".

## Expert Insights
Analysis from multiple expert perspectives. Include different viewpoints and schools of thought.

## Advantages & Limitations
### Advantages
- List with explanations
### Limitations
- List with explanations
### Alternative Viewpoints
- Common misconceptions addressed
### Critical Analysis
- Contradictions between sources

## Practical Applications
How the knowledge can be applied, industries affected, real-world implementation strategies.

## Future Outlook
Upcoming trends, technological developments, potential disruptions, predictions for the next 5-10 years.

## Conclusion
Comprehensive wrap-up with key takeaways and recommendations.

## Sources
Numbered list of all source URLs used.

${depth === "expert" ? "IMPORTANT: This is an EXPERT-LEVEL analysis. Go extremely deep into technical details, include multiple case studies, cross-reference sources, identify contradictions, and provide nuanced expert-level insights. Every claim must be supported by evidence from the sources." : ""}
${depth === "academic" ? "IMPORTANT: This is an ACADEMIC-LEVEL analysis. Structure the report like an academic paper with rigorous analysis, proper citations, methodology discussion, and literature review style coverage." : ""}`;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60_000; // 60 seconds for TPM rate limits

async function callLLMWithRetry(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string,
  send: (event: string, data: unknown) => void,
  log: (step: string, status: LogEntry["status"], detail?: string) => void,
  provider: "openai" | "groq",
  groqKey?: string,
): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = provider === "openai"
    ? "https://api.openai.com/v1/chat/completions"
    : "https://api.groq.com/openai/v1/chat/completions";
  const key = provider === "openai" ? apiKey : groqKey!;
  const modelName = provider === "openai" ? model : "llama-3.3-70b-versatile";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const label = provider === "openai" ? "Generating research report (OpenAI)" : "Generating research report (Groq)";
    if (attempt > 0) {
      log(label, "running", `Retry ${attempt}/${MAX_RETRIES} after rate limit`);
    } else {
      log(label, "running");
    }

    const resp = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4500,
        stream: true,
      }),
    });

    if (resp.ok && resp.body) {
      log(label, "done");
      return resp.body;
    }

    if (resp.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = parseInt(resp.headers.get("retry-after") || "60", 10);
      const waitSeconds = Math.min(retryAfter, 120);
      log(label, "running", `Rate limited. Waiting ${waitSeconds}s...`);
      send("paused", { retryAfter: waitSeconds });
      await new Promise((r) => setTimeout(r, waitSeconds * 1000));
      send("resumed", {});
      continue;
    }

    const errText = await resp.text();
    throw new Error(`${provider} error ${resp.status}: ${errText}`);
  }

  throw new Error(`${provider} failed after ${MAX_RETRIES} retries`);
}

async function callLLMWithFallback(
  systemPrompt: string,
  userPrompt: string,
  openaiKey: string,
  groqKey: string | undefined,
  model: string,
  send: (event: string, data: unknown) => void,
  log: (step: string, status: LogEntry["status"], detail?: string) => void
): Promise<ReadableStream<Uint8Array>> {
  try {
    return await callLLMWithRetry(systemPrompt, userPrompt, openaiKey, model, send, log, "openai");
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "unknown";
    log("Generating research report (OpenAI)", "error", errMsg);

    if (!groqKey) {
      throw new Error(`OpenAI failed and GROQ_API_KEY not configured. Error: ${errMsg}`);
    }

    log("Falling back to Groq AI", "running");
    try {
      return await callLLMWithRetry(systemPrompt, userPrompt, openaiKey, "llama-3.3-70b-versatile", send, log, "groq", groqKey);
    } catch (groqErr) {
      log("Falling back to Groq AI", "error", groqErr instanceof Error ? groqErr.message : "unknown");
      throw groqErr;
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, depth = "standard", previousContent = "", batchIndex = 0 } = (await req.json()) as ResearchRequest;
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const depthKey = DEPTH_CONFIG[depth] ? depth : "standard";
    const config = DEPTH_CONFIG[depthKey];

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const CHROMA_API_KEY = Deno.env.get("CHROMA_API_KEY");
    const CHROMA_ENDPOINT = Deno.env.get("CHROMA_ENDPOINT");

    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
    if (!TAVILY_API_KEY) throw new Error("TAVILY_API_KEY not configured");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        };

        const log = (step: string, status: LogEntry["status"], detail?: string) => {
          send("log", { step, status, detail });
        };

        try {
          log("Research depth", "done", `${depthKey} (${config.maxSources} sources)`);

          // Step 1: Query Chroma for existing knowledge
          let chromaResults: any[] = [];
          if (CHROMA_API_KEY && CHROMA_ENDPOINT) {
            log("Querying Chroma memory", "running");
            try {
              const embResp = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
              });
              const embData = await embResp.json();
              const queryEmbedding = embData.data?.[0]?.embedding;

              if (queryEmbedding) {
                const chromaResp = await fetch(
                  `${CHROMA_ENDPOINT}/api/v1/collections/research_agent/query`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${CHROMA_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ query_embeddings: [queryEmbedding], n_results: config.maxSources }),
                  }
                );
                if (chromaResp.ok) {
                  const chromaData = await chromaResp.json();
                  if (chromaData.documents?.[0]) {
                    chromaResults = chromaData.documents[0].map((doc: string, i: number) => ({
                      text: doc,
                      source: chromaData.metadatas?.[0]?.[i]?.source || "Chroma",
                      type: chromaData.metadatas?.[0]?.[i]?.type || "cached",
                    }));
                  }
                  log("Querying Chroma memory", "done", `Found ${chromaResults.length} cached results`);
                } else {
                  log("Querying Chroma memory", "done", "Collection may not exist yet, proceeding with web search");
                }
              }
            } catch (e) {
              log("Querying Chroma memory", "error", `Chroma error: ${e instanceof Error ? e.message : "unknown"}`);
            }
          } else {
            log("Querying Chroma memory", "done", "Chroma not configured, skipping");
          }

          // Step 2: Search with Tavily if needed
          let tavilyUrls: { url: string; title: string }[] = [];
          const isContinuation = batchIndex > 0 && previousContent;
          const needsWebSearch = !isContinuation && chromaResults.length < Math.min(3, config.maxSources);
          if (needsWebSearch) {
            log("Searching with Tavily", "running");
            try {
              const tavilyResp = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ api_key: TAVILY_API_KEY, query, max_results: config.maxSources, include_answer: false }),
              });
              const tavilyData = await tavilyResp.json();
              tavilyUrls = (tavilyData.results || []).map((r: any) => ({ url: r.url, title: r.title }));
              log("Searching with Tavily", "done", `Found ${tavilyUrls.length} sources`);
            } catch (e) {
              log("Searching with Tavily", "error", e instanceof Error ? e.message : "Search failed");
            }
          }

          // Step 3: Extract content via Firecrawl
          const extractedContent: { text: string; source: string; title: string }[] = [];
          if (tavilyUrls.length > 0) {
            log("Extracting content with Firecrawl", "running");
            const extractPromises = tavilyUrls.slice(0, config.maxSources).map(async ({ url, title }) => {
              try {
                const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
                });
                const data = await resp.json();
                const markdown = data.data?.markdown || data.markdown || "";
                const truncated = markdown.substring(0, config.maxContent);
                if (truncated) {
                  extractedContent.push({ text: truncated, source: url, title });
                }
              } catch {
                // Skip failed extractions
              }
            });
            await Promise.all(extractPromises);
            log("Extracting content with Firecrawl", "done", `Extracted ${extractedContent.length} pages`);
          }

          // Step 4: Store in Chroma
          if (extractedContent.length > 0 && CHROMA_API_KEY && CHROMA_ENDPOINT) {
            log("Storing in Chroma", "running");
            try {
              const embResp = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ model: "text-embedding-3-small", input: extractedContent.map((c) => c.text) }),
              });
              const embData = await embResp.json();
              const embeddings = embData.data?.map((d: any) => d.embedding) || [];

              if (embeddings.length > 0) {
                try {
                  await fetch(`${CHROMA_ENDPOINT}/api/v1/collections`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${CHROMA_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "research_agent", get_or_create: true }),
                  });
                } catch { /* Collection may already exist */ }

                await fetch(`${CHROMA_ENDPOINT}/api/v1/collections/research_agent/add`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${CHROMA_API_KEY}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ids: extractedContent.map((_, i) => `${Date.now()}-${i}`),
                    embeddings,
                    documents: extractedContent.map((c) => c.text),
                    metadatas: extractedContent.map((c) => ({ source: c.source, type: "article", title: c.title })),
                  }),
                });
                log("Storing in Chroma", "done", `Stored ${extractedContent.length} documents`);
              }
            } catch (e) {
              log("Storing in Chroma", "error", e instanceof Error ? e.message : "Storage failed");
            }
          }

          // Step 5: Generate response with LLM
          const allContent = [
            ...chromaResults.map((r) => `[From Memory - ${r.source}]\n${r.text}`),
            ...extractedContent.map((r) => `[From Web - ${r.source}]\n${r.text}`),
          ].join("\n\n---\n\n");

          const allSources = [
            ...chromaResults.map((r) => r.source),
            ...extractedContent.map((r) => r.source),
          ];

          const systemPrompt = getSystemPrompt(depthKey);

          let userPrompt: string;
          const isCont = batchIndex > 0 && previousContent;

          if (isCont) {
            // Truncate previous content to fit within token budget (~last 2000 chars as context)
            const contextWindow = previousContent.length > 2000 ? previousContent.slice(-2000) : previousContent;
            userPrompt = `Research Question: ${query}

Research Depth Level: ${depthKey.toUpperCase()}
Batch Index: ${batchIndex}

IMPORTANT: This is a CONTINUATION of previous research. Continue EXACTLY where the previous content stopped. Do NOT repeat any previously generated content. Maintain the same style, tone, and formatting.

Previous research context (last section):
---
${contextWindow}
---

Continue the research from where it left off. Generate the next section of the report.

Available Sources and Content:
${allContent || "Use the context from previous batches to continue."}

Source URLs:
${allSources.length > 0 ? allSources.map((s, i) => `${i + 1}. ${s}`).join("\n") : "No new sources"}`;
          } else {
            userPrompt = `Research Question: ${query}

Research Depth Level: ${depthKey.toUpperCase()}

Available Sources and Content:
${allContent || "No content was found. Please provide a general answer based on your training, and note that no external sources were available."}

Source URLs:
${allSources.length > 0 ? allSources.map((s, i) => `${i + 1}. ${s}`).join("\n") : "No sources available"}`;
          }

          const llmStream = await callLLMWithFallback(systemPrompt, userPrompt, OPENAI_API_KEY, GROQ_API_KEY, config.model, send, log);

          // Stream the LLM response
          const reader = llmStream.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  send("content", { text: content });
                }
              } catch {
                // partial JSON, skip
              }
            }
          }

          // Send sources metadata
          send("sources", {
            sources: [
              ...extractedContent.map((c) => ({ url: c.source, title: c.title })),
              ...chromaResults
                .filter((r) => r.source !== "Chroma")
                .map((r) => ({ url: r.source, title: r.source })),
            ],
          });
          // Determine if there's more to generate based on depth
          const maxBatches = depthKey === "quick" ? 1 : depthKey === "standard" ? 2 : depthKey === "deep" ? 3 : depthKey === "academic" ? 4 : 5;
          const hasMore = batchIndex + 1 < maxBatches;
          send("batch_info", { batchIndex, hasMore });

          send("done", {});
        } catch (e) {
          send("error", { message: e instanceof Error ? e.message : "Unknown error" });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("research-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
