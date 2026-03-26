const steps = [
  {
    number: "01",
    title: "Ask Your Question",
    description: "Type any research question or topic. Choose your depth level and research type.",
  },
  {
    number: "02",
    title: "AI Researches For You",
    description: "Our AI agents search academic databases, analyze papers, and extract key findings.",
  },
  {
    number: "03",
    title: "Get Your Report",
    description: "Receive a structured, citation-backed report ready for use in your work.",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-body">
            From question to comprehensive report in three simple steps.
          </p>
        </div>

        <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center md:text-left">
              <div className="text-4xl font-extrabold text-primary/20 mb-3 font-display">{step.number}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2 font-display">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
