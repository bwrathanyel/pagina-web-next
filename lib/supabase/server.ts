import { createClient } from "@supabase/supabase-js";

/** Server-side read client — anon key, same public access the site has always used.
 * No session, no service_role: this app only ever reads the public catalog. */
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
