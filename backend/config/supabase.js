/**
 * Supabase Client Configuration
 * Two clients:
 * 1. supabase - for user-facing operations (respects RLS)
 * 2. supabaseAdmin - for admin operations (bypasses RLS)
 */

const { createClient } = require("@supabase/supabase-js");
const logger = require("./logger");

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error("❌ Missing Supabase environment variables! Starting in degraded mode.");
  // Use dummy values to prevent crash on startup so Cloud Run can serve the frontend
  supabaseUrl = "https://dummy.supabase.co";
  supabaseAnonKey = "dummy-key";
}

// Standard client - for auth operations and RLS-protected queries
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Admin client - bypasses RLS (use for server-side operations only!)
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

logger.info("✅ Supabase clients initialized");

module.exports = { supabase, supabaseAdmin };
