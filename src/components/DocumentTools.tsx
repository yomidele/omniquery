import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/posthog";
import { convertFile, CONVERSION_OPTIONS, getAcceptForPipeline, type ConversionPipeline, type ConversionResult } from "@/lib/conversionService";
import { FileUploadZone } from "./document-tools/FileUploadZone";
import { ProcessingIndicator, ErrorState } from "./document-tools/ProcessingState";
import { ConversionResult as ConversionResultView } from "./document-tools/ConversionResult";
import { ConversionPipelineUI } from "./document-tools/ConversionPipelineUI";
import type { ProcessingStatus, ProcessedResult, ConversionHistoryItem } from "./document-tools/types";

export function DocumentTools() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

  // Conversion pipeline state
  const [activeTab, setActiveTab] = useState<"extract" | "convert">("convert");
  const [selectedPipeline, setSelectedPipeline] = useState<ConversionPipeline>("pdf-to-jpg");
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Text extraction flow
  const processFile = useCallback(async (file: File) => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
      return;
    }
    setStatus("processing");
    setProgress(5);
    setResult(null);
    trackEvent("document_extraction_started", { file_type: file.type, file_name: file.name });

    try {
      let text = "";
      const type = file.type;
      if (type === "application/pdf") {
        text = await extractPdfText(file);
      } else if (type.startsWith("image/")) {
        text = await extractImageText(file);
      } else if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
        text = await extractDocxText(file);
      } else if (type === "text/plain" || file.name.endsWith(".txt")) {
        text = await file.text();
      } else {
        toast({ title: "Unsupported file type", variant: "destructive" });
        setStatus("idle");
        return;
      }

      setProgress(90);
      if (!text || text.length < 5) {
        toast({ title: "No text found", variant: "destructive" });
        setStatus("error");
        return;
      }


      setProgress(100);
      setResult({ text, fileName: file.name, fileType: type, processedAt: new Date().toISOString() });
      setStatus("done");
      setHistory(prev => [{
        id: crypto.randomUUID(),
        fileName: file.name,
        fromType: type.split("/").pop() || "unknown",
        toFormat: "txt" as const,
        text: text.slice(0, 50000),
        convertedAt: new Date().toISOString(),
      }, ...prev].slice(0, 10));
      toast({ title: "Extraction complete", description: `Extracted ${text.length.toLocaleString()} characters` });
      trackEvent("document_extraction_completed", { file_type: type, characters: text.length });
    } catch (err: any) {
      console.error("Processing error:", err);
      setStatus("error");
      toast({ title: "Processing failed", description: err.message, variant: "destructive" });
    }
  }, [extractPdfText, extractImageText, toast, user]);

  // Format conversion flow
  const handleConvert = useCallback(async (file: File) => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum 20MB.", variant: "destructive" });
      return;
    }
    setStatus("processing");
    setProgress(5);
    setConversionResult(null);
    const opt = CONVERSION_OPTIONS.find((o) => o.id === selectedPipeline);
    trackEvent("file_conversion_started", { input_format: opt?.inputFormats[0], output_format: opt?.outputFormat, pipeline: selectedPipeline });

    try {
      const result = await convertFile(file, selectedPipeline, setProgress);
      setProgress(100);
      setConversionResult(result);
      setStatus("done");

      if (user) {
        await supabase.from("file_conversions" as any).insert({
          user_id: user.id,
          input_format: opt?.inputFormats[0] || "unknown",
          output_format: opt?.outputFormat || "unknown",
          status: "completed",
          file_name: file.name,
        } as any);
      }

      toast({ title: "Conversion complete", description: `${result.blobs.length} file(s) ready for download` });
      trackEvent("file_conversion_completed", { input_format: opt?.inputFormats[0], output_format: opt?.outputFormat, files_count: result.blobs.length });
    } catch (err: any) {
      console.error("Conversion error:", err);
      setStatus("error");
      toast({ title: "Conversion failed", description: err.message, variant: "destructive" });
    }
  }, [selectedPipeline, toast, user]);

  const handleConvertFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = getAcceptForPipeline(selectedPipeline);
      fileInputRef.current.click();
    }
  }, [selectedPipeline]);

  const handleConvertFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleConvert(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleConvert]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setConversionResult(null);
  }, []);

  const handleHistorySelect = useCallback((item: ConversionHistoryItem) => {
    setResult({ text: item.text, fileName: item.fileName, fileType: item.fromType, processedAt: item.convertedAt });
    setStatus("done");
  }, []);

  const handleDownloadAll = useCallback(() => {
    if (!conversionResult) return;
    conversionResult.blobs.forEach((blob, i) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = conversionResult.fileNames[i];
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    trackEvent("file_downloaded", { files_count: conversionResult.blobs.length });
  }, [conversionResult]);

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">Document Tools</h1>
        <p className="text-sm text-muted-foreground mt-1 font-display">
          Convert files between formats or extract text with AI analysis.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab("convert"); handleReset(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "convert" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🔄 Convert Files
        </button>
        <button
          onClick={() => { setActiveTab("extract"); handleReset(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "extract" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          📄 Extract Text
        </button>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleConvertFileChange} />

      {activeTab === "convert" && status === "idle" && (
        <ConversionPipelineUI
          selectedPipeline={selectedPipeline}
          onPipelineChange={setSelectedPipeline}
          onFileSelect={handleConvertFileSelect}
        />
      )}

      {activeTab === "extract" && status === "idle" && (
        <FileUploadZone onFileSelect={processFile} />
      )}

      {status === "processing" && <ProcessingIndicator progress={progress} />}
      {status === "error" && <ErrorState onReset={handleReset} />}

      {status === "done" && activeTab === "convert" && conversionResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{conversionResult.blobs.length} file(s) converted</p>
              <p className="text-xs text-muted-foreground">{conversionResult.fileNames.join(", ")}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Download All
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                New Conversion
              </button>
            </div>
          </div>

          {/* Preview images */}
          {conversionResult.mimeType.startsWith("image/") && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {conversionResult.blobs.map((blob, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden bg-card">
                  <img
                    src={URL.createObjectURL(blob)}
                    alt={conversionResult.fileNames[i]}
                    className="w-full h-auto"
                  />
                  <p className="text-xs text-muted-foreground p-2 truncate">{conversionResult.fileNames[i]}</p>
                </div>
              ))}
            </div>
          )}

          {/* Preview PDF */}
          {conversionResult.mimeType === "application/pdf" && (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <iframe
                src={URL.createObjectURL(conversionResult.blobs[0])}
                className="w-full h-[500px]"
                title="PDF Preview"
              />
            </div>
          )}
        </div>
      )}

      {status === "done" && activeTab === "extract" && result && (
        <ConversionResultView
          result={result}
          onReset={handleReset}
          history={history}
          onHistorySelect={handleHistorySelect}
        />
      )}
    </div>
  );
}
