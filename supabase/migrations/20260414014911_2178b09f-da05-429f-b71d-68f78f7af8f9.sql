
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    substring(gen_random_uuid()::text from 1 for 8),
    CASE 
      WHEN NEW.raw_user_meta_data->>'referred_by' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'referred_by' != ''
      THEN (NEW.raw_user_meta_data->>'referred_by')::uuid 
      ELSE NULL 
    END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'investor');
  
  RETURN NEW;
END;
$function$;
