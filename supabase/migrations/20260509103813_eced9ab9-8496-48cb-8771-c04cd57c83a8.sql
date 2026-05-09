
CREATE OR REPLACE FUNCTION public.get_user_downline(_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  referred_by uuid,
  level int,
  invested numeric,
  has_active boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur_ids uuid[] := ARRAY[_user_id];
  next_ids uuid[];
  lvl int := 1;
BEGIN
  WHILE array_length(cur_ids, 1) > 0 AND lvl <= 5 LOOP
    RETURN QUERY
    SELECT
      p.user_id,
      p.full_name,
      p.email,
      p.created_at,
      p.referred_by,
      lvl AS level,
      COALESCE((SELECT SUM(i.amount) FROM public.investments i WHERE i.user_id = p.user_id AND i.status = 'confirmed'), 0)::numeric AS invested,
      EXISTS(SELECT 1 FROM public.investments i WHERE i.user_id = p.user_id AND i.status = 'confirmed') AS has_active
    FROM public.profiles p
    WHERE p.referred_by = ANY(cur_ids);

    SELECT COALESCE(array_agg(p.user_id), ARRAY[]::uuid[]) INTO next_ids
    FROM public.profiles p WHERE p.referred_by = ANY(cur_ids);

    cur_ids := next_ids;
    lvl := lvl + 1;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_downline(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_downline(uuid) TO authenticated;
