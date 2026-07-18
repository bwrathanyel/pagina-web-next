const OBJECT_PREFIX = "/storage/v1/object/public/";
const RENDER_PREFIX = "/storage/v1/render/image/public/";

/** Custom next/image loader (no server-side optimizer runs on Workers, so the
 * default one is off). Rewrites Supabase Storage URLs to the project's free
 * on-demand image transform endpoint, sized per breakpoint from each
 * component's `sizes` prop. Anything else (local /public assets) passes
 * through untouched -- there's no transform service for those. */
export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.includes(OBJECT_PREFIX)) return src;
  const q = quality ?? 75;
  const base = src.replace(OBJECT_PREFIX, RENDER_PREFIX);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}width=${width}&quality=${q}`;
}
