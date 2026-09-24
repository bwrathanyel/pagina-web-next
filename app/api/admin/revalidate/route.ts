import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function revalidarDesdeBody(request: Request) {
  let paths: string[] | undefined;
  try {
    const body = (await request.json()) as { paths?: unknown };
    if (Array.isArray(body?.paths)) {
      paths = body.paths.filter((p): p is string => typeof p === "string" && p.length > 0);
    }
  } catch {
    // body vacío o no-JSON: purga total
  }
  if (paths && paths.length > 0) {
    for (const p of paths) revalidatePath(p);
  } else {
    revalidatePath("/", "layout");
  }
}

export async function POST(request: Request) {
  const revalidateSecret = process.env.REVALIDATE_SECRET;
  const secretHeader = request.headers.get("x-revalidate-secret") ?? "";
  if (revalidateSecret && secretHeader && secretHeader === revalidateSecret) {
    await revalidarDesdeBody(request);
    return NextResponse.json({ ok: true });
  }

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

  await revalidarDesdeBody(request);
  return NextResponse.json({ ok: true });
}
