import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Refreshes the Supabase auth session cookie on every request — standard
 * @supabase/ssr pattern. Without this, sessions silently expire mid-visit
 * because Server Components can't write cookies themselves. */
export async function middleware(request: NextRequest) {
  // Si el flujo OAuth falla del lado de Supabase (ej. bad_oauth_state: volvió
  // en otra pestaña o el estado venció), Supabase cae al site_url, que es la
  // home, con ?error_code=… y la home no lo muestra en ningún lado.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.get("error_code")?.startsWith("bad_oauth")) {
    return NextResponse.redirect(new URL("/cuenta/login?error=google", request.url));
  }

  // Sin cookie de Supabase no hay sesión que refrescar: la mayoría de las
  // visitas (y los prefetch RSC) no pagan la consulta a Auth.
  if (!request.cookies.getAll().some(({ name }) => name.startsWith("sb-"))) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
