import { NextResponse } from "next/server";

export async function GET() {
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  if (!siteKey) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true, site_key: siteKey }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
