CREATE TABLE public.shared_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  query text NOT NULL,
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shared_research TO anon;
GRANT SELECT, INSERT, DELETE ON public.shared_research TO authenticated;
GRANT ALL ON public.shared_research TO service_role;

ALTER TABLE public.shared_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared research"
  ON public.shared_research FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can create shares"
  ON public.shared_research FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own shares"
  ON public.shared_research FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE INDEX shared_research_token_idx ON public.shared_research(token);