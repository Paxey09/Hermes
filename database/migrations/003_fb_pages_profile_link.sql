ALTER TABLE public.fb_pages
ADD COLUMN IF NOT EXISTS connected_profile_name TEXT;
