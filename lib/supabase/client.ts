"use client";

import { createClient } from "@supabase/supabase-js";

/** Browser read client — only for client components that need catalog
 * data without a server round-trip (e.g. wizard precarga). */
export function supabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
