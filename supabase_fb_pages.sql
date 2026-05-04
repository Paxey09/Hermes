-- ============================================
-- FACEBOOK PAGES TABLE - MIGRATION
-- ============================================

-- Create fb_pages table for Facebook integration
CREATE TABLE IF NOT EXISTS public.fb_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id TEXT UNIQUE,
  fb_name TEXT,
  fb_token TEXT,
  business_type TEXT,
  product_services TEXT,
  product_service_price_ranges TEXT,
  website_link TEXT,
  shoppe_link TEXT,
  lazada_link TEXT,
  tiktok_link TEXT,
  access_mode TEXT DEFAULT 'enable' CHECK (access_mode IN ('enable', 'disable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_fb_pages_page_id ON public.fb_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_fb_pages_created_at ON public.fb_pages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.fb_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Allow all authenticated users to read
CREATE POLICY "Authenticated users can view fb_pages" ON public.fb_pages FOR SELECT USING (true);

-- RLS Policy - Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert fb_pages" ON public.fb_pages FOR INSERT WITH CHECK (true);

-- RLS Policy - Allow authenticated users to update
CREATE POLICY "Authenticated users can update fb_pages" ON public.fb_pages FOR UPDATE USING (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_fb_pages_updated_at ON public.fb_pages;
CREATE TRIGGER update_fb_pages_updated_at BEFORE UPDATE ON public.fb_pages
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.fb_pages TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
