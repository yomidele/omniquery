import { useState, useCallback } from "react";
import type { ResearchState, LogEntry, Source } from "@/types/research";

const RESEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-agent`;

export function useResearch() {
  const [state, setState] = useState<ResearchState>({
    logs: [],
    content: "",
    sources: [],
    isLoading: false,
    error: null,
  });

  const research = useCallback(async (query: string, depth: string = "standard") => {
    setState({
      logs: [],
      content: "",
      sources: [],
      isLoading: true,
      error: null,
    });

    try {
      const resp = await fetch(RESEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query, depth }),
      });

      if (!resp.ok || !resp.body) {
        const errorText = await resp.text();
        throw new Error(errorText || `Request failed with status ${resp.status}`);
      }

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
                      sources: (data as { sources: Source[] }).sources,
                    }));
                    break;
                  case "error":
                    setState((prev) => ({
                      ...prev,
                      error: (data as { message: string }).message,
                      isLoading: false,
                    }));
                    return;
                  case "done":
                    setState((prev) => ({ ...prev, isLoading: false }));
                    return;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        error: e instanceof Error ? e.message : "Unknown error",
        isLoading: false,
      }));
    }
  }, []);

  return { ...state, research };
}
