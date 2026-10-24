import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Los tres overrides son obligatorios (ver plan de migración, mina C): sin
// incrementalCache cada visita re-renderiza React entero; sin tagCache,
// revalidatePath("/", "layout") (app/api/admin/revalidate/route.ts) no hace
// nada; sin queue, el revalidate=3600 de app/layout.tsx no dispara. KV queda
// descartado (eventualmente consistente, ~60s -- el mismo camino que causó
// el bug original de contenido vencido en Netlify).
// withRegionalCache (2026-10-22): antes se descartó porque la espera de R2 no
// cuenta para el límite de CPU, pero sí cuenta para el visitante: un HIT de
// ISR tardaba 0,9-1,6 s de TTFB contra 0,75 s de un archivo estático. Ahora el
// HIT sale de la Cache API del data center y R2 se relee en segundo plano.
// La consulta al tag cache (D1) se mantiene en cada HIT (bypassTagCacheOnCacheHit
// queda en false, el default de Next 16), así que revalidatePath sigue siendo
// instantáneo sin configurar purga de caché.
// enableCacheInterception: un HIT de ISR se sirve desde R2 sin cargar NextServer
// (Error 1102 del plan Free, 10 ms de CPU). Incompatible con PPR, que no se usa.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  tagCache: d1NextTagCache,
  queue: doQueue,
  enableCacheInterception: true,
});
