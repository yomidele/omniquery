import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResearchRequest {
  query: string;
}

interface LogEntry {
  step: string;
  status: "running" | "done" | "error";
  detail?: string;
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = (await req.json()) as ResearchRequest;
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const CHROMA_API_KEY = Deno.env.get("CHROMA_API_KEY");
    const CHROMA_ENDPOINT = Deno.env.get("CHROMA_ENDPOINT");

    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
    if (!TAVILY_API_KEY) throw new Error("TAVILY_API_KEY not configured");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    // Set up SSE stream
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
          // Step 1: Query Chroma for existing knowledge
          let chromaResults: any[] = [];
          if (CHROMA_API_KEY && CHROMA_ENDPOINT) {
            log("Querying Chroma memory", "running");
            try {
              // Get embedding for the query
              const embResp = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "text-embedding-3-small",
                  input: query,
                }),
              });
              const embData = await embResp.json();
              const queryEmbedding = embData.data?.[0]?.embedding;

              if (queryEmbedding) {
                // Query Chroma collection
                const chromaResp = await fetch(
                  `${CHROMA_ENDPOINT}/api/v1/collections/research_agent/query`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${CHROMA_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      query_embeddings: [queryEmbedding],
                      n_results: 10,
                    }),
                  }
                );
                if (chromaResp.ok) {
                  const chromaData = await chromaResp.json();
                  if (chromaData.documents?.[0]) {
                    chromaResults = chromaData.documents[0].map(
                      (doc: string, i: number) => ({
                        text: doc,
                        source: chromaData.metadatas?.[0]?.[i]?.source || "Chroma",
                        type: chromaData.metadatas?.[0]?.[i]?.type || "cached",
                      })
                    );
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

          // Step 2: If insufficient results, search with Tavily
          let tavilyUrls: { url: string; title: string }[] = [];
          const needsWebSearch = chromaResults.length < 3;

          if (needsWebSearch) {
            log("Searching with Tavily", "running");
            try {
              const tavilyResp = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  api_key: TAVILY_API_KEY,
                  query,
                  max_results: 5,
                  include_answer: false,
                }),
              });
              const tavilyData = await tavilyResp.json();
              tavilyUrls = (tavilyData.results || []).map((r: any) => ({
                url: r.url,
                title: r.title,
              }));
              log("Searching with Tavily", "done", `Found ${tavilyUrls.length} sources`);
            } catch (e) {
              log("Searching with Tavily", "error", e instanceof Error ? e.message : "Search failed");
            }
          }

          // Step 3: Extract content from URLs via Firecrawl
          const extractedContent: { text: string; source: string; title: string }[] = [];
          if (tavilyUrls.length > 0) {
            log("Extracting content with Firecrawl", "running");
            const extractPromises = tavilyUrls.slice(0, 5).map(async ({ url, title }) => {
              try {
                const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    url,
                    formats: ["markdown"],
                    onlyMainContent: true,
                  }),
                });
                const data = await resp.json();
                const markdown = data.data?.markdown || data.markdown || "";
                // Truncate to ~3000 chars per source
                const truncated = markdown.substring(0, 3000);
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
              // Get embeddings for extracted content
              const embResp = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "text-embedding-3-small",
                  input: extractedContent.map((c) => c.text),
                }),
              });
              const embData = await embResp.json();
              const embeddings = embData.data?.map((d: any) => d.embedding) || [];

              if (embeddings.length > 0) {
                // Ensure collection exists
                try {
                  await fetch(`${CHROMA_ENDPOINT}/api/v1/collections`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${CHROMA_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      name: "research_agent",
                      get_or_create: true,
                    }),
                  });
                } catch {
                  // Collection may already exist
                }

                // Add documents
                await fetch(
                  `${CHROMA_ENDPOINT}/api/v1/collections/research_agent/add`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${CHROMA_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      ids: extractedContent.map((_, i) => `${Date.now()}-${i}`),
                      embeddings,
                      documents: extractedContent.map((c) => c.text),
                      metadatas: extractedContent.map((c) => ({
                        source: c.source,
                        type: "article",
                        title: c.title,
                      })),
                    }),
                  }
                );
                log("Storing in Chroma", "done", `Stored ${extractedContent.length} documents`);
              }
            } catch (e) {
              log("Storing in Chroma", "error", e instanceof Error ? e.message : "Storage failed");
            }
          }

          // Step 5: Compile all content and generate response with OpenAI
          log("Generating research report", "running");

          const allContent = [
            ...chromaResults.map((r) => `[From Memory - ${r.source}]\n${r.text}`),
            ...extractedContent.map((r) => `[From Web - ${r.source}]\n${r.text}`),
          ].join("\n\n---\n\n");

          const allSources = [
            ...chromaResults.map((r) => r.source),
            ...extractedContent.map((r) => r.source),
          ];

          const systemPrompt = `You are an AI Research Agent. Generate a comprehensive, well-structured research report in Markdown format.

Your response MUST follow this exact structure:
# {Concise Title}

**Summary:**

{3-5 paragraphs of well-researched, structured summary. Use the provided source content to synthesize accurate findings. Do not hallucinate.}

**Sources:**

{Numbered list of all source URLs used}

**Deep Insights:**

{Additional analysis: comparisons between sources, contradictions found, key takeaways, and areas that need further research}

IMPORTANT: Only use information from the provided sources. Cite sources inline where relevant.`;

          const userPrompt = `Research Question: ${query}

Available Sources and Content:
${allContent || "No content was found. Please provide a general answer based on your training, and note that no external sources were available."}

Source URLs:
${allSources.length > 0 ? allSources.map((s, i) => `${i + 1}. ${s}`).join("\n") : "No sources available"}`;

          const openaiResp = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt },
                ],
                stream: true,
              }),
            }
          );

          if (!openaiResp.ok) {
            const errText = await openaiResp.text();
            throw new Error(`OpenAI error ${openaiResp.status}: ${errText}`);
          }

          log("Generating research report", "done");

          // Stream the OpenAI response
          const reader = openaiResp.body!.getReader();
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

          send("done", {});
        } catch (e) {
          send("error", {
            message: e instanceof Error ? e.message : "Unknown error",
          });
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
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
