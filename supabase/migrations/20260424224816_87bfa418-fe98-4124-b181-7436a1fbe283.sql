-- Harden security-definer helpers so users cannot query other users' subscription/usage state
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF auth.uid() <> p_user_id AND NOT public.is_admin(auth.uid()) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status = 'authorized'
      AND (next_payment_date IS NULL OR next_payment_date > now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_analysis_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  IF auth.uid() <> p_user_id AND NOT public.is_admin(auth.uid()) THEN
    RETURN 0;
  END IF;

  RETURN (
    SELECT COUNT(*)::integer
    FROM public.analysis_usage
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('month', now())
  );
END;
$$;

-- Restrict company logo object access to owners/admins instead of allowing public listing
UPDATE storage.buckets
SET public = false
WHERE id = 'company-logos';

DROP POLICY IF EXISTS "Anyone can view company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;

CREATE POLICY "Users can view their own company logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
  )
);

CREATE POLICY "Users can upload their own company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);