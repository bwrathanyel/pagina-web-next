"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client — cookie-backed session (auth) + catalog reads from
 * client components. Safe to call repeatedly; @supabase/ssr caches per tab. */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
