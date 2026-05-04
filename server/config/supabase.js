const { createClient } = require("@supabase/supabase-js");

// 👇 ADD IT HERE
console.log("DEBUG ENV:", {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "exists" : "missing"
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
