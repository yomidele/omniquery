import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type ResearchType = "general";

interface ResearchTypeSelectorProps {
  value: ResearchType;
  onChange: (value: ResearchType) => void;
}

export function ResearchTypeSelector({ value, onChange }: ResearchTypeSelectorProps) {
  return (
    <div className="hidden" />
  );
}
