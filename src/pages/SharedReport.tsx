import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { ResearchOutput } from "@/components/ResearchOutput";
import { Button } from "@/components/ui/button";
import type { Source } from "@/types/research";

interface SharedItem {
  query: string;
  content: string;
  sources: Source[];
  created_at: string;
}

const SharedReport = () => {
  const { token } = useParams<{ token: string }>();
  const [item, setItem] = useState<SharedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await supabase
        .from("shared_research")
        .select("query, content, sources, created_at")
        .eq("token", token)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
      } else {
        setItem({
          query: data.query,
          content: data.content,
          sources: ((data.sources as unknown) as Source[]) || [],
          created_at: data.created_at,
        });
      }
      setLoading(false);
    })();
  }, [token]);

  const title = item ? `${item.query.slice(0, 70)} — OmniQuery` : "Shared Research — OmniQuery";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={item ? item.content.replace(/[#*_\[\]]/g, "").slice(0, 155) : "Shared research report on OmniQuery."} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && <div className="text-sm text-muted-foreground">Loading shared report…</div>}
        {notFound && (
          <div className="text-center py-20">
            <h1 className="text-xl font-bold mb-2">Share link not found</h1>
            <p className="text-sm text-muted-foreground mb-6">This share may have been removed or never existed.</p>
            <Button asChild><Link to="/">Back to home</Link></Button>
          </div>
        )}
        {item && (
          <>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Shared research</p>
              <h1 className="text-2xl md:text-3xl font-bold font-display">{item.query}</h1>
            </div>
            <ResearchOutput
              content={item.content}
              sources={item.sources}
              isLoading={false}
              error={null}
              hasMore={false}
              onContinue={() => {}}
              isPaused={false}
              retryCountdown={0}
              mode="research"
            />
          </>
        )}
      </main>
    </div>
  );
};

export default SharedReport;
