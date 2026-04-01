import { CONVERSION_OPTIONS, type ConversionPipeline } from "@/lib/conversionService";
import { Upload, FileImage, FileText, Image } from "lucide-react";

interface ConversionPipelineUIProps {
  selectedPipeline: ConversionPipeline;
  onPipelineChange: (p: ConversionPipeline) => void;
  onFileSelect: () => void;
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  "Document → Image": FileImage,
  "Image → Document": FileText,
  "Image → Image": Image,
};

export function ConversionPipelineUI({ selectedPipeline, onPipelineChange, onFileSelect }: ConversionPipelineUIProps) {
  const categories = Array.from(new Set(CONVERSION_OPTIONS.map((o) => o.category)));
  const selected = CONVERSION_OPTIONS.find((o) => o.id === selectedPipeline);

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat] || FileText;
        const options = CONVERSION_OPTIONS.filter((o) => o.category === cat);
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground font-display">{cat}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onPipelineChange(opt.id)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-center ${
                    selectedPipeline === opt.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={onFileSelect}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all text-primary font-medium"
      >
        <Upload className="h-5 w-5" />
        <span>Upload file to convert ({selected?.label})</span>
      </button>
    </div>
  );
}
