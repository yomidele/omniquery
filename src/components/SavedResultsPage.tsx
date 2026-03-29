import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookmarkCheck, Trash2, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Source } from "@/types/research";

interface SavedItem {
  id: string;
  created_at: string;
  research_id: string;
  query: string;
  content: string;
  sources: Source[];
  research_created_at: string;
}

interface SavedResultsPageProps {
  onSelect: (item: { query: string; content: string; sources: Source[] }) => void;
}

export function SavedResultsPage({ onSelect }: SavedResultsPageProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSaved = async () => {
      setLoading(true);
      // Fetch bookmarks joined with research_history
      const { data } = await supabase
        .from("bookmarks")
        .select("id, created_at, research_id, research_history(query, content, sources, created_at)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        const mapped = data
          .filter((d: any) => d.research_history)
          .map((d: any) => ({
            id: d.id,
            created_at: d.created_at,
            research_id: d.research_id,
            query: d.research_history.query,
            content: d.research_history.content,
            sources: (d.research_history.sources as Source[]) || [],
            research_created_at: d.research_history.created_at,
          }));
        setItems(mapped);
      }
      setLoading(false);
    };
    fetchSaved();
  }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-display mb-6">Saved Reports</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center gap-2 mb-6">
        <BookmarkCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-display">Saved Reports</h1>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-2">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <BookmarkCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">No saved reports yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Download a PDF or save a research to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onSelect({ query: item.query, content: item.content, sources: item.sources })}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground font-display truncate">{item.query}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 font-body">
                      {item.content.replace(/[#*_\[\]]/g, "").slice(0, 150)}…
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Saved {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary/70">
                        <ExternalLink className="h-3 w-3" />
                        {item.sources.length} sources
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
