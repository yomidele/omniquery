import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileUploadZone } from "./document-tools/FileUploadZone";
import { ProcessingIndicator, ErrorState } from "./document-tools/ProcessingState";
import { ConversionResult } from "./document-tools/ConversionResult";
import type { ProcessingStatus, ProcessedResult, ConversionHistoryItem } from "./document-tools/types";

export function DocumentTools() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

  const extractPdfText = useCallback(async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress(Math.round((i / pdf.numPages) * 80));
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      fullText += `\n--- Page ${i} ---\n${pageText}`;
    }
    return fullText.trim();
  }, []);

  const extractImageText = useCallback(async (file: File): Promise<string> => {
    const Tesseract = await import("tesseract.js");
    setProgress(20);
    const result = await Tesseract.recognize(file, "eng", {
      logger: (m: any) => {
        if (m.status === "recognizing text" && m.progress) {
          setProgress(20 + Math.round(m.progress * 60));
        }
      },
    });
    return result.data.text.trim();
  }, []);

  const extractDocxText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const raw = decoder.decode(arrayBuffer);
    const bodyMatch = raw.match(/<w:body[^>]*>([\s\S]*?)<\/w:body>/);
    if (bodyMatch) {
      return bodyMatch[1]
        .replace(/<w:p[^>]*>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }
    return raw.replace(/<[^>]+>/g, " ").replace(/\s{3,}/g, "\n").trim().slice(0, 50000);
  };

  const processFile = useCallback(async (file: File) => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
      return;
    }

    setStatus("processing");
    setProgress(5);
    setResult(null);

    try {
      let text = "";
      const type = file.type;

      if (type === "application/pdf") {
        text = await extractPdfText(file);
      } else if (type.startsWith("image/")) {
        text = await extractImageText(file);
      } else if (
        type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        text = await extractDocxText(file);
      } else if (type === "text/plain" || file.name.endsWith(".txt")) {
        text = await file.text();
      } else {
        toast({ title: "Unsupported file type", description: "Please upload a PDF, image (PNG/JPG/WEBP), DOCX, or TXT file.", variant: "destructive" });
        setStatus("idle");
        return;
      }

      setProgress(90);

      if (!text || text.length < 5) {
        toast({ title: "No text found", description: "Could not extract readable text from this file.", variant: "destructive" });
        setStatus("error");
        return;
      }

      if (user) {
        await supabase.from("research_history").insert({
          user_id: user.id,
          query: `[Document] ${file.name}`,
          content: text.slice(0, 50000),
          sources: [] as any,
        });
      }

      setProgress(100);
      const processed: ProcessedResult = {
        text,
        fileName: file.name,
        fileType: type,
        processedAt: new Date().toISOString(),
      };
      setResult(processed);
      setStatus("done");

      // Add to local history
      setHistory(prev => [{
        id: crypto.randomUUID(),
        fileName: file.name,
        fromType: type.split("/").pop() || "unknown",
        toFormat: "txt" as const,
        text: text.slice(0, 50000),
        convertedAt: new Date().toISOString(),
      }, ...prev].slice(0, 10));

      toast({ title: "Extraction complete", description: `Extracted ${text.length.toLocaleString()} characters from ${file.name}` });
    } catch (err: any) {
      console.error("Processing error:", err);
      setStatus("error");
      toast({ title: "Processing failed", description: err.message || "An error occurred.", variant: "destructive" });
    }
  }, [extractPdfText, extractImageText, toast, user]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setResult(null);
  }, []);

  const handleHistorySelect = useCallback((item: ConversionHistoryItem) => {
    setResult({
      text: item.text,
      fileName: item.fileName,
      fileType: item.fromType,
      processedAt: item.convertedAt,
    });
    setStatus("done");
  }, []);

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">Document Tools</h1>
        <p className="text-sm text-muted-foreground mt-1 font-display">
          Upload files to extract, convert, and download in any format — or analyze with AI.
        </p>
      </div>

      {status === "idle" && <FileUploadZone onFileSelect={processFile} />}
      {status === "processing" && <ProcessingIndicator progress={progress} />}
      {status === "error" && <ErrorState onReset={handleReset} />}
      {status === "done" && result && (
        <ConversionResult
          result={result}
          onReset={handleReset}
          history={history}
          onHistorySelect={handleHistorySelect}
        />
      )}
    </div>
  );
}
