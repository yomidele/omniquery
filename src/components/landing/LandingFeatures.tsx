import { BookOpen, Brain, FileText, Quote, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Multiple AI models work together to analyze and synthesize research from diverse sources.",
  },
  {
    icon: FileText,
    title: "Structured Reports",
    description: "Get properly formatted academic reports with abstracts, methodology, findings, and conclusions.",
  },
  {
    icon: Quote,
    title: "Auto Citations",
    description: "Every claim is backed by sources. References are automatically generated and linked.",
  },
  {
    icon: BarChart3,
    title: "Visual Diagrams",
    description: "Complex relationships rendered as clean, readable diagrams embedded in your reports.",
  },
  {
    icon: BookOpen,
    title: "Multiple Depth Levels",
    description: "From quick overviews to PhD-level dissertations — control the depth of your research.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your research data is encrypted and private. Only you can access your reports.",
  },
];

export function LandingFeatures() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
            Everything You Need for Research
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
            A complete research toolkit powered by cutting-edge AI technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2 font-display">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
