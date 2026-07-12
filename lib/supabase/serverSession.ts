import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Session-aware server client — reads/writes the auth cookie via next/headers.
 * Use in Server Components/Route Handlers/Server Actions that need to know
 * the logged-in user (auth pages, favoritos, admin checks). Separate from
 * supabaseServer() in server.ts, which stays session-less for the public
 * catalog reads that ISR/static pages rely on. */
export async function supabaseServerSession() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render (no response to attach
            // cookies to) — middleware.ts below covers session refresh.
          }
        },
      },
    },
  );
}
