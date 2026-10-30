import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServerSession } from "@/lib/supabase/serverSession";
import { COOKIE_RETORNO_AUTH, rutaInterna } from "@/lib/utils/rutaInterna";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const cookieStore = await cookies();
  const retorno = rutaInterna(cookieStore.get(COOKIE_RETORNO_AUTH)?.value);
  cookieStore.delete(COOKIE_RETORNO_AUTH);

  const fallo = () =>
    NextResponse.redirect(new URL(`/cuenta/login?error=google&next=${encodeURIComponent(retorno)}`, request.url));
  if (!code) return fallo();

  const sb = await supabaseServerSession();
  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fallo();

  // Solo en el primer ingreso: con perfil existente web_crear_perfil pisaría
  // el nombre elegido. Si algo falla, AuthProvider autocura el perfil y
  // toma el nombre de user_metadata.nombre.
  const { data: perfil, error: errorPerfil } = await sb
    .from("web_perfiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!perfil && !errorPerfil) {
    const meta = data.user.user_metadata ?? {};
    const nombre: string | null = meta.nombre ?? meta.full_name ?? meta.name ?? null;
    const { error: errorRpc } = await sb.rpc("web_crear_perfil", { p_nombre: nombre });
    if (errorRpc && nombre && !meta.nombre) await sb.auth.updateUser({ data: { nombre } });
  }

  return NextResponse.redirect(new URL(retorno, request.url));
}
