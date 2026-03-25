import { useState, useCallback, useRef, useEffect } from "react";
import type { ResearchState, LogEntry, Source } from "@/types/research";

const RESEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-agent`;

export function useResearch() {
  const [state, setState] = useState<ResearchState>({
    logs: [],
    content: "",
    sources: [],
    isLoading: false,
    isPaused: false,
    retryCountdown: 0,
    error: null,
    hasMore: false,
    batchIndex: 0,
  });

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastQueryRef = useRef("");
  const lastDepthRef = useRef("standard");
  const lastResearchTypeRef = useRef("general");
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setState((prev) => ({ ...prev, isPaused: true, retryCountdown: seconds }));
    countdownRef.current = setInterval(() => {
      setState((prev) => {
        const next = prev.retryCountdown - 1;
        if (next <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return { ...prev, retryCountdown: 0 };
        }
        return { ...prev, retryCountdown: next };
      });
    }, 1000);
  }, []);

  const processStream = useCallback(async (resp: Response, append: boolean) => {
    if (!resp.body) return;
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);

        if (line.startsWith("event: ")) {
          const eventType = line.slice(7);
          const dataIdx = buffer.indexOf("\n");
          if (dataIdx === -1) {
            buffer = line + "\n" + buffer;
            break;
          }
          const dataLine = buffer.slice(0, dataIdx).trim();
          buffer = buffer.slice(dataIdx + 1);

          if (dataLine.startsWith("data: ")) {
            const jsonStr = dataLine.slice(6);
            try {
              const data = JSON.parse(jsonStr);

              switch (eventType) {
                case "log":
                  setState((prev) => {
                    const existingIdx = prev.logs.findIndex(
                      (l) => l.step === (data as LogEntry).step
                    );
                    const newLogs = [...prev.logs];
                    if (existingIdx >= 0) {
                      newLogs[existingIdx] = data as LogEntry;
                    } else {
                      newLogs.push(data as LogEntry);
                    }
                    return { ...prev, logs: newLogs };
                  });
                  break;
                case "content":
                  setState((prev) => ({
                    ...prev,
                    content: prev.content + (data as { text: string }).text,
                  }));
                  break;
                case "sources":
                  setState((prev) => ({
                    ...prev,
                    sources: append
                      ? [...prev.sources, ...(data as { sources: Source[] }).sources.filter(
                          (s) => !prev.sources.some((ps) => ps.url === s.url)
                        )]
                      : (data as { sources: Source[] }).sources,
                  }));
                  break;
                case "batch_info":
                  setState((prev) => ({
                    ...prev,
                    hasMore: (data as { hasMore: boolean }).hasMore,
                    batchIndex: (data as { batchIndex: number }).batchIndex,
                  }));
                  break;
                case "paused":
                  startCountdown((data as { retryAfter: number }).retryAfter);
                  break;
                case "resumed":
                  if (countdownRef.current) clearInterval(countdownRef.current);
                  setState((prev) => ({
                    ...prev,
                    isPaused: false,
                    retryCountdown: 0,
                  }));
                  break;
                case "error":
                  setState((prev) => ({
                    ...prev,
                    error: (data as { message: string }).message,
                    isLoading: false,
                    isPaused: false,
                    retryCountdown: 0,
                  }));
                  return;
                case "done":
                  setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    isPaused: false,
                    retryCountdown: 0,
                  }));
                  return;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    setState((prev) => ({ ...prev, isLoading: false, isPaused: false, retryCountdown: 0 }));
  }, [startCountdown]);

  const doRequest = useCallback(async (query: string, depth: string, researchType: string, previousContent: string, batchIndex: number, append: boolean) => {
    try {
      const resp = await fetch(RESEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query, depth, researchType, previousContent, batchIndex }),
      });

      if (!resp.ok || !resp.body) {
        const errorText = await resp.text();
        throw new Error(errorText || `Request failed with status ${resp.status}`);
      }

      await processStream(resp, append);
    } catch (e) {
      setState((prev) => ({
        ...prev,
        error: e instanceof Error ? e.message : "Unknown error",
        isLoading: false,
        isPaused: false,
        retryCountdown: 0,
      }));
    }
  }, [processStream]);

  const research = useCallback(async (query: string, depth: string = "standard", researchType: string = "general") => {
    lastQueryRef.current = query;
    lastDepthRef.current = depth;
    lastResearchTypeRef.current = researchType;
    setState({
      logs: [],
      content: "",
      sources: [],
      isLoading: true,
      isPaused: false,
      retryCountdown: 0,
      error: null,
      hasMore: false,
      batchIndex: 0,
    });
    await doRequest(query, depth, researchType, "", 0, false);
  }, [doRequest]);

  const continueResearch = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      hasMore: false,
    }));
    const currentContent = stateRef.current.content;
    const nextBatch = stateRef.current.batchIndex + 1;
    await doRequest(lastQueryRef.current, lastDepthRef.current, lastResearchTypeRef.current, currentContent, nextBatch, true);
  }, [doRequest]);

  return { ...state, research, continueResearch, lastQuery: lastQueryRef.current };
}
