import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Los tres overrides son obligatorios (ver plan de migración, mina C): sin
// incrementalCache cada visita re-renderiza React entero; sin tagCache,
// revalidatePath("/", "layout") (app/api/admin/revalidate/route.ts) no hace
// nada; sin queue, el revalidate=3600 de app/layout.tsx no dispara. KV queda
// descartado (eventualmente consistente, ~60s -- el mismo camino que causó
// el bug original de contenido vencido en Netlify). withRegionalCache
// tampoco se usa: metería una segunda capa de caché delante de R2, y la
// latencia de R2 es espera de red, no cuenta para el límite de CPU.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: doQueue,
});
