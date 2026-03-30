export type ProcessingStatus = "idle" | "uploading" | "processing" | "converting" | "done" | "error";
export type OutputFormat = "txt" | "md" | "html" | "csv" | "pdf";
export type OutputAction = "summarize" | "explain" | "blog" | "keypoints";

export interface ProcessedResult {
  text: string;
  fileName: string;
  fileType: string;
  processedAt: string;
}

export interface ConversionHistoryItem {
  id: string;
  fileName: string;
  fromType: string;
  toFormat: OutputFormat;
  text: string;
  convertedAt: string;
}

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  txt: "Plain Text (.txt)",
  md: "Markdown (.md)",
  html: "HTML (.html)",
  csv: "CSV (.csv)",
  pdf: "PDF (.pdf)",
};

export const AI_ACTIONS: { id: OutputAction; label: string; prompt: string }[] = [
  { id: "summarize", label: "Summarize", prompt: "Summarize the following document content concisely:" },
  { id: "explain", label: "Explain Simply", prompt: "Explain the following document content like I'm a beginner:" },
  { id: "blog", label: "Turn into Article", prompt: "Rewrite the following content as a well-structured blog article:" },
  { id: "keypoints", label: "Key Points", prompt: "Extract only the key points from the following document:" },
];
