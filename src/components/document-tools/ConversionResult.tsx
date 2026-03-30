import { useState, useCallback } from "react";
import { FileText, Copy, Check, Download, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FormatSelector } from "./FormatSelector";
import { ConversionHistory } from "./ConversionHistory";
import { type ProcessedResult, type OutputFormat, type OutputAction, type ConversionHistoryItem, AI_ACTIONS } from "./types";

interface ConversionResultProps {
  result: ProcessedResult;
  onReset: () => void;
  history: ConversionHistoryItem[];
  onHistorySelect: (item: ConversionHistoryItem) => void;
}

function convertText(text: string, format: OutputFormat): string {
  switch (format) {
    case "md":
      return text
        .replace(/^--- Page (\d+) ---$/gm, "\n## Page $1\n")
        .replace(/\n{3,}/g, "\n\n");
    case "html":
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const paragraphs = escaped.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("\n");
      return `<!DOCTYPE html>\n<html><head><meta charset="utf-8"><title>Converted Document</title></head>\n<body>\n${paragraphs}\n</body></html>`;
    case "csv":
      return text
        .split("\n")
        .map(line => `"${line.replace(/"/g, '""')}"`)
        .join("\n");
    default:
      return text;
  }
}

function getDownloadMime(format: OutputFormat): string {
  const mimes: Record<OutputFormat, string> = {
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
    csv: "text/csv",
    pdf: "application/pdf",
  };
  return mimes[format];
}

export function ConversionResult({ result, onReset, history, onHistorySelect }: ConversionResultProps) {
  const { toast } = useToast();
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("txt");
  const [copied, setCopied] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const convertedText = convertText(result.text, outputFormat);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard", description: "Content copied successfully." });
    setTimeout(() => setCopied(false), 2000);
  }, [toast]);

  const handleDownload = useCallback(() => {
    const baseName = result.fileName.replace(/\.[^.]+$/, "");
    const downloadName = `${baseName}_converted.${outputFormat}`;
    const blob = new Blob([convertedText], { type: getDownloadMime(outputFormat) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download started", description: downloadName });
  }, [result.fileName, outputFormat, convertedText, toast]);

  const handleAiAction = useCallback(async (action: OutputAction) => {
    if (!result.text) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const actionConfig = AI_ACTIONS.find(a => a.id === action);
      const prompt = `${actionConfig?.prompt}\n\n${result.text.slice(0, 15000)}`;
      const { data, error } = await supabase.functions.invoke("research-agent", {
        body: { query: prompt, depth: "quick", research_type: "executive" },
      });
      if (error) throw error;
      setAiResult(data?.content || "No response generated.");
    } catch (err: any) {
      toast({ title: "AI processing failed", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }, [result, toast]);

  return (
    <div className="space-y-4">
      {/* File Info Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium font-display text-foreground truncate">{result.fileName}</p>
            <p className="text-xs text-muted-foreground">{result.text.length.toLocaleString()} characters extracted</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <FormatSelector value={outputFormat} onChange={setOutputFormat} inputType={result.fileType} />
          <Button size="sm" variant="outline" onClick={() => handleCopy(convertedText)}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
          </Button>
          <Button size="sm" variant="default" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            <span className="ml-1.5">Download</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="ml-1.5">New</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="converted" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="converted" className="flex-1">Converted Output</TabsTrigger>
          <TabsTrigger value="ai" className="flex-1">AI Analysis</TabsTrigger>
          {history.length > 0 && (
            <TabsTrigger value="history" className="flex-1">History ({history.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="converted">
          <Card>
            <CardContent className="p-4">
              <pre className="text-xs text-foreground whitespace-pre-wrap max-h-[400px] overflow-y-auto font-mono leading-relaxed">
                {convertedText}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {AI_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleAiAction(action.id)}
                disabled={aiLoading}
                className="text-xs"
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {action.label}
              </Button>
            ))}
          </div>
          <Card>
            <CardContent className="p-4">
              {aiLoading && (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground font-display">Analyzing document…</span>
                </div>
              )}
              {!aiLoading && aiResult && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(aiResult)}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none">
                    {aiResult}
                  </div>
                </div>
              )}
              {!aiLoading && !aiResult && (
                <p className="text-sm text-muted-foreground text-center py-8 font-display">
                  Choose an AI action above to analyze the extracted text.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {history.length > 0 && (
          <TabsContent value="history">
            <ConversionHistory items={history} onSelect={onHistorySelect} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
