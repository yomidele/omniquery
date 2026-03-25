export function ResearchSkeleton() {
  const lineClass = "h-3 rounded-md bg-[rgba(var(--surface),1)] omni-skeleton";
  const section = (title: string, rows = 3) => (
    <div className="pb-6 border-b border-[rgba(var(--border),.5)] last:border-0 last:pb-0">
      <h3 className="mb-3 text-lg font-semibold text-[rgb(var(--foreground))]">{title}</h3>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className={lineClass} style={{ width: `${75 - idx * 10}%`, minHeight: 14 }} />
        ))}
      </div>
    </div>
  );

  return (
    <section className="mt-10 w-full max-w-[800px] rounded-2xl border border-[rgba(var(--border),.65)] bg-[rgb(var(--surface))] p-6">
      <div className="mb-5">
        <div className="mb-3 h-8 w-2/5 rounded-lg omni-skeleton" />
        <div className="h-3 w-3/5 rounded-lg omni-skeleton" />
      </div>
      {section("Abstract", 3)}
      {section("Introduction", 4)}
      {section("Methodology", 3)}
      {section("Findings", 4)}
      {section("Discussion", 3)}
      {section("References", 2)}
    </section>
  );
}
