import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Copy, Key, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/omniquery-api`;

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  body?: Record<string, string>;
  queryParams?: Record<string, string>;
  response: string;
}

const endpoints: Endpoint[] = [
  { method: "GET", path: "/", description: "API info and available endpoints", auth: false, response: '{ "name": "OmniQuery API", "version": "1.0.0", "endpoints": [...] }' },
  { method: "GET", path: "/profile", description: "Get the authenticated user's profile", auth: true, response: '{ "data": { "id": "...", "display_name": "...", "avatar_url": "...", "created_at": "..." } }' },
  { method: "PUT", path: "/profile", description: "Update user profile", auth: true, body: { display_name: "string", avatar_url: "string (optional)" }, response: '{ "data": { "id": "...", "display_name": "Updated Name", ... } }' },
  { method: "POST", path: "/search", description: "Submit a research query. Returns compiled report with sources.", auth: true, body: { query: "string (required)" }, response: '{ "data": { "query": "...", "content": "# Report...", "sources": [...] } }' },
  { method: "GET", path: "/history", description: "Get past research queries and reports", auth: true, queryParams: { limit: "number (default 20)", offset: "number (default 0)" }, response: '{ "data": [...], "total": 42, "limit": 20, "offset": 0 }' },
  { method: "POST", path: "/keys", description: "Generate a new API key", auth: true, body: { name: "string (optional)" }, response: '{ "data": { "key": "omq_...", "prefix": "omq_abcd1234...", "name": "My Key" } }' },
  { method: "GET", path: "/keys", description: "List all API keys (prefix only)", auth: true, response: '{ "data": [{ "id": "...", "key_prefix": "omq_abcd1234...", "name": "...", "is_active": true }] }' },
  { method: "DELETE", path: "/keys/:id", description: "Delete an API key", auth: true, response: '{ "message": "API key deleted" }' },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative group">
      <pre className="bg-primary/80 text-primary-foreground/80 rounded-lg p-4 text-xs overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); toast({ title: "Copied!" }); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground/50"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const curlExample = ep.method === "GET"
    ? `curl -H "x-api-key: YOUR_API_KEY" \\
  "${BASE_URL}${ep.path}"`
    : `curl -X ${ep.method} -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(ep.body || {})}' \\
  "${BASE_URL}${ep.path}"`;

  const jsExample = ep.method === "GET"
    ? `const res = await fetch("${BASE_URL}${ep.path}", {
  headers: { "x-api-key": "YOUR_API_KEY" }
});
const data = await res.json();`
    : `const res = await fetch("${BASE_URL}${ep.path}", {
  method: "${ep.method}",
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${JSON.stringify(ep.body || {})})
});
const data = await res.json();`;

  const pyExample = ep.method === "GET"
    ? `import requests

res = requests.get(
  "${BASE_URL}${ep.path}",
  headers={"x-api-key": "YOUR_API_KEY"}
)
data = res.json()`
    : `import requests

res = requests.${ep.method.toLowerCase()}(
  "${BASE_URL}${ep.path}",
  headers={"x-api-key": "YOUR_API_KEY"},
  json=${JSON.stringify(ep.body || {}).replace(/"/g, '\\"')}
)
data = res.json()`;

  return (
    <div className="border border-border/30 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left">
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${methodColors[ep.method]}`}>{ep.method}</span>
        <code className="text-sm font-mono text-foreground">{ep.path}</code>
        <span className="text-sm text-muted-foreground ml-auto hidden sm:inline">{ep.description}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/20 pt-4">
          <p className="text-sm text-muted-foreground">{ep.description}</p>
          {ep.auth && <p className="text-xs text-accent">🔐 Requires authentication (API key or Bearer token)</p>}
          {ep.body && (
            <div>
              <h4 className="text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">Request Body</h4>
              <CodeBlock code={JSON.stringify(ep.body, null, 2)} lang="json" />
            </div>
          )}
          {ep.queryParams && (
            <div>
              <h4 className="text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">Query Parameters</h4>
              <CodeBlock code={JSON.stringify(ep.queryParams, null, 2)} lang="json" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">Response</h4>
            <CodeBlock code={ep.response} lang="json" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">cURL</h4>
            <CodeBlock code={curlExample} />
            <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wide mt-3">JavaScript</h4>
            <CodeBlock code={jsExample} lang="javascript" />
            <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wide mt-3">Python</h4>
            <CodeBlock code={pyExample} lang="python" />
          </div>
        </div>
      )}
    </div>
  );
}

function ApiKeyManager() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("api_keys").select("id, key_prefix, name, created_at, last_used_at, is_active").order("created_at", { ascending: false });
    setKeys(data || []);
  }, [user]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const generateKey = async () => {
    const res = await fetch(`${BASE_URL}/keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({ name: newKeyName || "Default" }),
    });
    const result = await res.json();
    if (result.data?.key) {
      setGeneratedKey(result.data.key);
      setNewKeyName("");
      fetchKeys();
      toast({ title: "API key generated! Copy it now — it won't be shown again." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const deleteKey = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    fetchKeys();
    toast({ title: "API key deleted" });
  };

  return (
    <div className="bg-card/50 border border-border/30 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground font-display flex items-center gap-2 mb-4">
        <Key className="h-5 w-5 text-accent" /> Your API Keys
      </h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Key name (optional)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="flex-1 h-10 rounded-lg border border-border/30 bg-background px-3 text-sm text-foreground outline-none focus:border-accent/50"
        />
        <Button onClick={generateKey} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-1" /> Generate
        </Button>
      </div>
      {generatedKey && (
        <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-xs text-accent font-semibold mb-1">⚠️ Copy this key now — it won't be shown again!</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-foreground break-all flex-1">{generatedKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(generatedKey); toast({ title: "Copied!" }); }}>
              <Copy className="h-4 w-4 text-accent" />
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg">
            <div>
              <span className="text-sm font-medium text-foreground">{k.name}</span>
              <code className="text-xs text-muted-foreground ml-2 font-mono">{k.key_prefix}</code>
            </div>
            <button onClick={() => deleteKey(k.id)} className="text-destructive/60 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {keys.length === 0 && <p className="text-sm text-muted-foreground">No API keys yet.</p>}
      </div>
    </div>
  );
}

const ApiDocs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground font-display">Loading…</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold text-foreground font-display">OmniQuery</span>
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">API</span>
          </Link>
          <Button variant="outline" size="sm" onClick={() => navigate("/research")}>Dashboard</Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display mb-3">API Documentation</h1>
          <p className="text-muted-foreground max-w-2xl">
            Integrate OmniQuery's AI research capabilities into your applications. Authenticate with an API key or Bearer token to access all endpoints.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground font-display">Authentication</h2>
          <p className="text-sm text-muted-foreground">All endpoints (except <code className="text-accent">/</code>) require authentication via one of:</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border border-border/30 rounded-xl">
              <h3 className="font-semibold text-foreground text-sm mb-2">API Key (recommended)</h3>
              <CodeBlock code={`curl -H "x-api-key: omq_your_key_here" \\
  ${BASE_URL}/profile`} />
            </div>
            <div className="p-4 border border-border/30 rounded-xl">
              <h3 className="font-semibold text-foreground text-sm mb-2">Bearer Token</h3>
              <CodeBlock code={`curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  ${BASE_URL}/profile`} />
            </div>
          </div>
        </div>

        <ApiKeyManager />

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground font-display">Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((ep, i) => (
              <EndpointCard key={i} ep={ep} />
            ))}
          </div>
        </div>

        <div className="p-5 border border-border/30 rounded-xl">
          <h2 className="text-lg font-semibold text-foreground font-display mb-2">Rate Limits</h2>
          <p className="text-sm text-muted-foreground">
            API requests are rate-limited to <strong>60 requests per minute</strong> per API key. Search queries are limited to <strong>10 per minute</strong> due to AI processing costs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
