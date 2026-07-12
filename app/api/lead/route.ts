import { NextResponse } from "next/server";

/** Server-side proxy to the CRM's ingest-web-lead Edge Function. The
 * browser never calls that function directly: its CORS is hardcoded to
 * the production domain, so a Vercel preview URL would be rejected.
 * This route is same-origin from the browser's point of view, then
 * forwards server-to-server where CORS doesn't apply. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const url = process.env.INGEST_LEAD_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({ ok: upstream.ok }));
  return NextResponse.json(data, { status: upstream.status });
}
