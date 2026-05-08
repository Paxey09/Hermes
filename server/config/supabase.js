const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Support both new sb_secret_/sb_publishable_ format and legacy eyJ... JWT format
const isValidKey = supabaseKey && (
  supabaseKey.startsWith('sb_secret_') ||
  supabaseKey.startsWith('sb_publishable_') ||
  supabaseKey.startsWith('eyJ')
);

if (!supabaseUrl || !isValidKey) {
  throw new Error("Missing SUPABASE_URL or valid SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY in server environment");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws
  }
});

module.exports = { supabase };
