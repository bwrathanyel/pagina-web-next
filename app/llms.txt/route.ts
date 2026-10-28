import { llmsTxt } from "@/lib/seo/llms";

export const revalidate = 3600;

export function GET() {
  return new Response(llmsTxt(false), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
