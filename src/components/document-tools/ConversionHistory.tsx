import { FileText, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { type ConversionHistoryItem, OUTPUT_FORMAT_LABELS } from "./types";

interface ConversionHistoryProps {
  items: ConversionHistoryItem[];
  onSelect: (item: ConversionHistoryItem) => void;
}

export function ConversionHistory({ items, onSelect }: ConversionHistoryProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback(async (item: ConversionHistoryItem) => {
    await navigator.clipboard.writeText(item.text);
    setCopiedId(item.id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  }, [toast]);

  const handleDownload = useCallback((item: ConversionHistoryItem) => {
    const blob = new Blob([item.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.fileName}_converted.${item.toFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground font-display">No conversion history yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => onSelect(item)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium font-display text-foreground truncate">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.fromType} → {OUTPUT_FORMAT_LABELS[item.toFormat]} · {new Date(item.convertedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleCopy(item)}>
                  {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownload(item)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
