import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Trash2, Search, ExternalLink, BookmarkPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Source } from "@/types/research";

interface HistoryItem {
  id: string;
  query: string;
  content: string;
  sources: Source[];
  created_at: string;
}

interface HistoryPageProps {
  onSelect: (item: { query: string; content: string; sources: Source[] }) => void;
  refreshKey: number;
}

export function HistoryPage({ onSelect, refreshKey }: HistoryPageProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) {
        setItems(data.map((d: any) => ({ ...d, sources: (d.sources as Source[]) || [] })));
      }
      setLoading(false);
    };
    fetchHistory();
  }, [user, refreshKey]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("research_history").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Research deleted");
  };

  const handleSave = async (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("research_id", item.id)
        .maybeSingle();
      if (existing) {
        toast.info("Already saved");
        return;
      }
      await supabase.from("bookmarks").insert({ user_id: user.id, research_id: item.id });
      toast.success("Saved to reports");
    } catch {
      toast.error("Failed to save");
    }
  };

  const filtered = search
    ? items.filter((item) => item.query.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-display mb-6">Research History</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-display">Research History</h1>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-2">{items.length}</span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your research history…"
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            {search ? "No results matching your search." : "No research history yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.02 }}
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
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary/70">
                        <ExternalLink className="h-3 w-3" />
                        {item.sources.length} sources
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={(e) => handleSave(item, e)}
                      title="Save to reports"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(item.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
