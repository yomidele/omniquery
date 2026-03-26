import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Source } from "@/types/research";

interface HistoryItem {
  id: string;
  query: string;
  content: string;
  sources: Source[];
  created_at: string;
}

interface ResearchHistoryProps {
  onSelect: (item: { query: string; content: string; sources: Source[] }) => void;
  refreshKey: number;
}

export function ResearchHistory({ onSelect, refreshKey }: ResearchHistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        setItems(data.map((d: any) => ({
          ...d,
          sources: (d.sources as Source[]) || [],
        })));
      }
      setLoading(false);
    };
    fetchHistory();
  }, [refreshKey]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("research_history").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) {
    return (
      <div className="px-4 py-6 text-center">
        <span className="text-xs text-muted-foreground">Loading history…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <Clock className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground/60 font-display">No research history yet</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect({ query: item.query, content: item.content, sources: item.sources })}
          className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors group"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-foreground font-display truncate flex-1">{item.query}</p>
            <button
              onClick={(e) => handleDelete(item.id, e)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-display">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </p>
        </button>
      ))}
    </div>
  );
}
