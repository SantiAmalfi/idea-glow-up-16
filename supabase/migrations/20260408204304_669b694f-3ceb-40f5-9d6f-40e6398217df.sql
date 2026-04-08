CREATE OR REPLACE FUNCTION public.get_user_analysis_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.analysis_usage 
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', now());
$$;