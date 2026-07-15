import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return NextResponse.json({ ok: false, error: "no_autenticado" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const [{ data: userData, error: userError }, { data: esAdmin, error: adminError }] = await Promise.all([
    supabase.auth.getUser(token),
    supabase.rpc("web_es_admin"),
  ]);
  if (userError || !userData.user) {
    return NextResponse.json({ ok: false, error: "sesion_invalida" }, { status: 401 });
  }
  if (adminError || esAdmin !== true) {
    return NextResponse.json({ ok: false, error: "no_autorizado" }, { status: 403 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
