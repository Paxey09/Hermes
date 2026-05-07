import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Admin client - bypasses RLS (server-side operations only)
export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// Fetch all users (admin only)
export async function fetchAllProfilesAdmin() {
  if (!supabaseAdmin) {
    // Fallback to regular client if no service role key
    const { supabase } = await import('./supabaseClient.js');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  }

  const BATCH = 1000;
  let from = 0;
  let all = [];
  
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + BATCH - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    all = [...all, ...data];
    if (data.length < BATCH) break;
    from += BATCH;
  }
  
  return { data: all, error: null };
}
