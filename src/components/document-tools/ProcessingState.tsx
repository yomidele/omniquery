import { Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProcessingStateProps {
  progress: number;
}

export function ProcessingIndicator({ progress }: ProcessingStateProps) {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm font-medium font-display text-foreground mb-3">Processing your document…</p>
        <div className="w-full max-w-xs mx-auto bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{progress}% complete</p>
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  onReset: () => void;
}

export function ErrorState({ onReset }: ErrorStateProps) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="p-8 text-center">
        <X className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-3 font-display">Processing failed</p>
        <Button onClick={onReset} variant="outline" size="sm">Try Again</Button>
      </CardContent>
    </Card>
  );
}
