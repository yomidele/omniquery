import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResearchRequest {
  query: string;
  depth?: string;
  researchType?: string;
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

const RESEARCH_TYPE_STRUCTURES: Record<string, string> = {
  undergraduate: `Structure the report as an Undergraduate Project Work with these sections:
- Title Page (generate a proper academic title)
- Abstract (150–300 words)
- Introduction (background, problem statement, objectives)
- Literature Review (review relevant works, identify gaps)
- Methodology (approach, tools, techniques)
- Results / Findings (present data, tables, charts)
- Discussion (interpret results, compare with literature)
- Conclusion & Recommendations
- References (list all cited sources)
- Appendices (optional supplementary material)`,

  masters: `Structure the report as a Master's Thesis with these sections:
- Title Page (generate a proper academic title)
- Abstract (250–500 words)
- Introduction (context, research questions, significance)
- Literature Review / Theoretical Framework (comprehensive review, theoretical basis)
- Methodology (research design, data collection, analysis methods)
- Results (detailed findings with supporting evidence)
- Discussion (interpretation, implications, limitations)
- Conclusion & Recommendations (key contributions, future research directions)
- References (comprehensive bibliography)
- Appendices (data tables, instruments, supplementary analysis)`,

  phd: `Structure the report as a PhD Dissertation with these sections:
- Title Page (generate a formal dissertation title)
- Abstract (350–500 words)
- Acknowledgements
- Table of Contents / List of Figures / Tables
- Introduction (research problem, questions, scope, significance, structure overview)
- Literature Review / Theoretical Framework (exhaustive review, conceptual framework, research gaps)
- Methodology / Research Design (philosophical stance, approach, methods, validity, ethics)
- Results / Findings (multi-part if needed, with thorough data presentation)
- Discussion / Interpretation (synthesis with literature, theoretical contributions, practical implications)
- Conclusion / Contributions to Knowledge (original contributions, limitations, future research agenda)
- References (extensive bibliography)
- Appendices (raw data, instruments, ethical approvals, supplementary analyses)`,

  general: `Structure as a standard research report:
- Title / Topic Overview
- Background / Context
- Key Findings / Summary (organized with clear subheadings)
- References`,
};

function getSystemPrompt(depth: string, researchType: string = "general"): string {
  const base = `You are OmniQuery, a professional AI Research Engine. Generate a comprehensive, well-structured research report in Markdown format.

IMPORTANT: Only use information from the provided sources. Cite sources inline where relevant. Use proper Markdown formatting with headings, bullet points, tables, and structured content. Write in formal academic language.

When a topic involves processes, systems, or workflows, include Mermaid.js diagrams using fenced code blocks with the language "mermaid". Example:

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[Result]
\`\`\`
`;

  const structurePrompt = RESEARCH_TYPE_STRUCTURES[researchType] || RESEARCH_TYPE_STRUCTURES.general;

  if (depth === "quick") {
    return base + `\nResearch Level: ${researchType.toUpperCase()}\nProvide a concise answer highlighting key points.\n\n${structurePrompt}\n\nKeep sections brief — 1-2 paragraphs each. Focus on key points only.`;
  }

  if (depth === "standard") {
    return base + `\nResearch Level: ${researchType.toUpperCase()}\nProvide moderate detail with examples and explanations.\n\n${structurePrompt}\n\nUse moderate detail — include examples, explanations, and proper citations.`;
  }

  // deep, academic, expert
  return base + `\nResearch Level: ${researchType.toUpperCase()}\n\n${structurePrompt}

Provide fully detailed, in-depth discussion and analysis for every section. Include:
- Historical context and evolution of the topic
- Technical explanations with real-world examples
- Case studies and expert opinions
- Statistical data and evidence in Markdown tables
- Mermaid.js diagrams for processes and workflows
- Critical analysis with multiple viewpoints
- Practical applications and future outlook

${depth === "expert" ? "IMPORTANT: This is an EXPERT-LEVEL analysis. Go extremely deep into technical details, include multiple case studies, cross-reference sources, identify contradictions, and provide nuanced expert-level insights. Every claim must be supported by evidence." : ""}
${depth === "academic" ? "IMPORTANT: This is an ACADEMIC-LEVEL analysis. Structure with rigorous analysis, proper citations, methodology discussion, and literature review style coverage." : ""}`;
}

// --- Round-Robin Provider System ---

interface Provider {
  name: string;
  url: string;
  keyEnv: string;
  model: string;
}

const PROVIDERS: Provider[] = [
  {
    name: "Gemini Flash",
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    keyEnv: "LOVABLE_API_KEY",
    model: "google/gemini-2.5-flash",
  },
  {
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyEnv: "GROQ_API_KEY",
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "Together AI",
    url: "https://api.together.xyz/v1/chat/completions",
    keyEnv: "TOGETHER_API_KEY",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  },
];

// Simple round-robin counter (resets per cold start, which is fine)
let roundRobinIndex = 0;

const MAX_RETRIES_PER_PROVIDER = 1;

async function callProvider(
  provider: Provider,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  send: (event: string, data: unknown) => void,
  log: (step: string, status: LogEntry["status"], detail?: string) => void,
): Promise<ReadableStream<Uint8Array>> {
  const label = `Generating report (${provider.name})`;
  log(label, "running");

  const resp = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
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

  if (resp.status === 429) {
    const retryAfter = parseInt(resp.headers.get("retry-after") || "30", 10);
    const errText = await resp.text();
    throw new Error(`RATE_LIMIT:${retryAfter}:${provider.name}: ${errText}`);
  }

  const errText = await resp.text();
  throw new Error(`${provider.name} error ${resp.status}: ${errText}`);
}

async function callLLMRoundRobin(
  systemPrompt: string,
  userPrompt: string,
  send: (event: string, data: unknown) => void,
  log: (step: string, status: LogEntry["status"], detail?: string) => void,
): Promise<ReadableStream<Uint8Array>> {
  const startIdx = roundRobinIndex;
  // Advance counter for next request
  roundRobinIndex = (roundRobinIndex + 1) % PROVIDERS.length;

  const errors: string[] = [];

  // Try each provider starting from the round-robin index
  for (let i = 0; i < PROVIDERS.length; i++) {
    const idx = (startIdx + i) % PROVIDERS.length;
    const provider = PROVIDERS[idx];
    const apiKey = Deno.env.get(provider.keyEnv);

    if (!apiKey) {
      errors.push(`${provider.name}: key not configured`);
      continue;
    }

    try {
      const stream = await callProvider(provider, apiKey, systemPrompt, userPrompt, send, log);
      return stream;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "unknown";
      errors.push(`${provider.name}: ${errMsg}`);
      log(`Generating report (${provider.name})`, "error", errMsg);

      // If rate limited, notify client and try next provider
      if (errMsg.startsWith("RATE_LIMIT:")) {
        const parts = errMsg.split(":");
        const waitSec = parseInt(parts[1], 10) || 30;
        send("paused", { retryAfter: Math.min(waitSec, 5) }); // brief pause indicator
        send("resumed", {});
        log(`Skipping ${provider.name}, trying next provider`, "running");
      }
    }
  }

  // All providers failed
  throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, depth = "standard", researchType = "general", previousContent = "", batchIndex = 0 } = (await req.json()) as ResearchRequest;
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

    // OpenAI key is now optional (used for embeddings only, not for main LLM)
    // Main LLM uses round-robin: Gemini (LOVABLE_API_KEY), Groq, Together AI
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

          const systemPrompt = getSystemPrompt(depthKey, researchType);

          let userPrompt: string;
          const isCont = batchIndex > 0 && previousContent;

          if (isCont) {
            // Truncate previous content to fit within token budget (~last 2000 chars as context)
            const contextWindow = previousContent.length > 2000 ? previousContent.slice(-2000) : previousContent;
            userPrompt = `Research Question: ${query}

Research Depth Level: ${depthKey.toUpperCase()}
Research Type: ${researchType.toUpperCase()}
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
Research Type: ${researchType.toUpperCase()}

Available Sources and Content:
${allContent || "No content was found. Please provide a general answer based on your training, and note that no external sources were available."}

Source URLs:
${allSources.length > 0 ? allSources.map((s, i) => `${i + 1}. ${s}`).join("\n") : "No sources available"}`;
          }

          const llmStream = await callLLMRoundRobin(systemPrompt, userPrompt, send, log);

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
