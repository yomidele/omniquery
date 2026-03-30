import { useRef, useCallback, useState } from "react";
import { Upload, FileText, Image, FileDown } from "lucide-react";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
}

const conversionOptions = [
  { label: "PDF → Text", icon: FileText, accept: ".pdf", desc: "Extract text from PDF documents" },
  { label: "Image → Text (OCR)", icon: Image, accept: ".png,.jpg,.jpeg,.webp", desc: "Extract text from images" },
  { label: "Word → Text", icon: FileText, accept: ".docx", desc: "Extract text from Word documents" },
  { label: "TXT Upload", icon: FileDown, accept: ".txt", desc: "Upload and analyze text files" },
];

export function FileUploadZone({ onFileSelect }: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onFileSelect]);

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 md:p-16 text-center transition-all duration-200 ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-base font-medium font-display text-foreground">
          Drop your file here or <span className="text-primary">browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          PDF, Images (PNG, JPG, WEBP), Word (.docx), TXT — Max 20MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {conversionOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = opt.accept;
                fileInputRef.current.click();
              }
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-center group"
          >
            <opt.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-medium font-display text-foreground">{opt.label}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
          </button>
        ))}
      </div>
    </>
  );
}
