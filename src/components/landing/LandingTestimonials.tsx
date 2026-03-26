const testimonials = [
  {
    quote: "OmniQuery cut my literature review time from weeks to hours. The citations are accurate and the structure is publication-ready.",
    name: "Dr. Sarah Chen",
    role: "PhD Researcher, MIT",
  },
  {
    quote: "As a master's student, this tool has been invaluable. The depth control lets me get exactly the level of detail I need.",
    name: "James Rodriguez",
    role: "Graduate Student, Stanford",
  },
  {
    quote: "The AI-generated diagrams and structured outputs make complex topics accessible. A game-changer for our research team.",
    name: "Prof. Emily Walsh",
    role: "Department Head, Oxford",
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
            Trusted by Researchers
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Join thousands of academics and professionals who research smarter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-card border border-border rounded-xl p-6">
              <p className="text-sm text-foreground leading-relaxed mb-5 font-body italic">
                "{t.quote}"
              </p>
              <div>
                <p className="text-sm font-semibold text-foreground font-display">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
