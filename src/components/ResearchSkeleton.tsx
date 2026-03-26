export function ResearchSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-1.5 mb-6">
        <div className="h-2.5 w-2.5 rounded-full bg-muted" />
        <div className="h-2.5 w-2.5 rounded-full bg-muted" />
        <div className="h-2.5 w-2.5 rounded-full bg-muted" />
      </div>
      <div className="space-y-6">
        <div>
          <div className="h-7 w-2/5 rounded-lg omni-skeleton mb-3" />
          <div className="h-4 w-3/5 rounded-md omni-skeleton" />
        </div>
        {["Abstract", "Introduction", "Methodology", "Findings"].map((title) => (
          <div key={title} className="space-y-2">
            <div className="h-5 w-28 rounded-md omni-skeleton" />
            <div className="h-3 w-full rounded-md omni-skeleton" />
            <div className="h-3 w-5/6 rounded-md omni-skeleton" />
            <div className="h-3 w-3/4 rounded-md omni-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
