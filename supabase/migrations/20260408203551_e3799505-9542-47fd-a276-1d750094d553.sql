-- Report settings table
CREATE TABLE public.report_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'professional',
  header_title TEXT DEFAULT NULL,
  header_subtitle TEXT DEFAULT NULL,
  primary_color TEXT DEFAULT '#0f172a',
  secondary_color TEXT DEFAULT '#10b981',
  accent_color TEXT DEFAULT '#94a3b8',
  font_family TEXT DEFAULT 'helvetica',
  logo_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report settings"
ON public.report_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own report settings"
ON public.report_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report settings"
ON public.report_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report settings"
ON public.report_settings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_report_settings_updated_at
BEFORE UPDATE ON public.report_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);