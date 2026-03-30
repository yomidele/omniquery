import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type OutputFormat, OUTPUT_FORMAT_LABELS } from "./types";

interface FormatSelectorProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
  inputType: string;
}

export function FormatSelector({ value, onChange, inputType }: FormatSelectorProps) {
  // Determine available output formats based on input type
  const availableFormats: OutputFormat[] = ["txt", "md", "html"];
  
  // CSV only makes sense for table-heavy content
  if (inputType === "application/pdf" || inputType.includes("spreadsheet") || inputType.includes("excel")) {
    availableFormats.push("csv");
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium font-display text-muted-foreground whitespace-nowrap">Convert to:</span>
      <Select value={value} onValueChange={(v) => onChange(v as OutputFormat)}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableFormats.map((fmt) => (
            <SelectItem key={fmt} value={fmt} className="text-xs">
              {OUTPUT_FORMAT_LABELS[fmt]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
