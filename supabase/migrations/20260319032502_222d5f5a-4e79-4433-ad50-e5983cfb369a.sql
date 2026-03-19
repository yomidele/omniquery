-- Folders for organizing research
CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders" ON public.folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON public.folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tags for labeling research
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Bookmarks for quick reference
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  research_id uuid NOT NULL REFERENCES public.research_history(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, research_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notes attached to research
CREATE TABLE public.research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  research_id uuid NOT NULL REFERENCES public.research_history(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON public.research_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.research_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.research_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.research_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Many-to-many: research <-> tags
CREATE TABLE public.research_tags (
  research_id uuid NOT NULL REFERENCES public.research_history(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (research_id, tag_id)
);

ALTER TABLE public.research_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own research_tags" ON public.research_tags FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.research_history rh WHERE rh.id = research_id AND rh.user_id = auth.uid()));
CREATE POLICY "Users can insert own research_tags" ON public.research_tags FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.research_history rh WHERE rh.id = research_id AND rh.user_id = auth.uid()));
CREATE POLICY "Users can delete own research_tags" ON public.research_tags FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.research_history rh WHERE rh.id = research_id AND rh.user_id = auth.uid()));

-- Many-to-many: research <-> folders
CREATE TABLE public.research_folders (
  research_id uuid NOT NULL REFERENCES public.research_history(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  PRIMARY KEY (research_id, folder_id)
);

ALTER TABLE public.research_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own research_folders" ON public.research_folders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.research_history rh WHERE rh.id = research_id AND rh.user_id = auth.uid()));
CREATE POLICY "Users can insert own research_folders" ON public.research_folders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.research_history rh WHERE rh.id = research_id AND rh.user_id = auth.uid()));
CREATE POLICY "Users can delete own research_folders" ON public.research_folders FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.research_history rh WHERE rh.id = research_id AND rh.user_id = auth.uid()));