/**
 * Supabase Client Configuration
 * Two clients:
 * 1. supabase - for user-facing operations (respects RLS)
 * 2. supabaseAdmin - for admin operations (bypasses RLS)
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

// Standard client - for auth operations and RLS-protected queries
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Admin client - bypasses RLS (use for server-side operations only!)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

logger.info('✅ Supabase clients initialized');

module.exports = { supabase, supabaseAdmin };
