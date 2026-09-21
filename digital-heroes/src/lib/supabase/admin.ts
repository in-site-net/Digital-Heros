import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file from a Client Component.
// Uses the service role key to bypass RLS for admin actions (running draws,
// managing users, marking payouts) after we've verified the caller is an admin.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
