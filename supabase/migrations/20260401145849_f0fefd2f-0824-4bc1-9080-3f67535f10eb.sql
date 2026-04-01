CREATE TABLE public.file_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  original_file_url text,
  converted_file_url text,
  input_format text NOT NULL,
  output_format text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  file_name text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.file_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversions" ON public.file_conversions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversions" ON public.file_conversions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversions" ON public.file_conversions FOR DELETE TO authenticated USING (auth.uid() = user_id);