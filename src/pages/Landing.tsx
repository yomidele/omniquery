import { Link } from "react-router-dom";
import { BookOpen, Search, Globe, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Nav */}
      <header className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold text-primary-foreground font-display tracking-wide">
            SCRIPTURA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-accent font-display tracking-wider mb-4" style={{ fontFamily: "'Merriweather', serif" }}>
          OMNIQUERY
        </h1>
        <p className="text-primary-foreground/60 text-lg mb-2 font-display italic">
          Your AI Research Assistant
        </p>
        <p className="text-primary-foreground/80 max-w-xl text-base mb-10 font-body leading-relaxed">
          Autonomous AI-powered research agent. Ask any question and receive
          comprehensive, source-backed reports generated in real time.
        </p>
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 text-base px-8" asChild>
          <Link to="/signup">
            Start Researching <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-3xl w-full">
          {[
            { icon: Search, title: "Deep Search", desc: "Searches the web with Tavily and extracts content with Firecrawl" },
            { icon: Globe, title: "Vector Memory", desc: "Stores knowledge in Chroma for smarter, faster future queries" },
            { icon: Sparkles, title: "AI Reports", desc: "Generates structured research reports with dual-LLM fallback" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-primary-foreground font-display font-semibold">{title}</h3>
              <p className="text-primary-foreground/50 text-sm font-body">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-primary-foreground/30 text-xs font-display">
        © 2026 Scriptura Research Agent
      </footer>
    </div>
  );
};

export default Landing;
