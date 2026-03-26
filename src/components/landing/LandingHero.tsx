import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-36 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 animate-fade-up">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Research Assistant
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-5 leading-[1.1] animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Research Smarter,
          <br />
          <span className="text-primary">Not Harder</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-body animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Get structured, citation-backed research reports in minutes. Powered by AI that searches, analyzes, and synthesizes academic sources for you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button size="lg" asChild className="text-base px-8 h-12 rounded-xl gap-2">
            <Link to="/signup">
              Start Researching
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="text-base px-8 h-12 rounded-xl">
            <Link to="/login">Log In</Link>
          </Button>
        </div>

        {/* Mock dashboard preview */}
        <div className="mt-16 mx-auto max-w-3xl animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
              <span className="ml-3 text-xs text-muted-foreground font-display">Research Report</span>
            </div>
            <div className="space-y-3">
              <div className="h-6 w-3/4 rounded-md bg-muted" />
              <div className="h-4 w-full rounded-md bg-muted/70" />
              <div className="h-4 w-5/6 rounded-md bg-muted/50" />
              <div className="mt-4 flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-primary/20" />
                <div className="h-8 w-24 rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
