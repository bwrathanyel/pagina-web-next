# Web pública Lotus 360

Nueva web pública de Destino y Eventos Lotus 360. Combina catálogo y promociones
desde Supabase, cotizadores, carrito, favoritos, cuenta de cliente y herramientas de
edición para administradores.

## Stack y arquitectura

- Next.js 16 con App Router, React 19 y TypeScript estricto.
- Tailwind CSS 4 para estilos.
- Supabase para catálogo, autenticación, favoritos y roles.
- Netlify con `@netlify/plugin-nextjs` como plataforma prevista de despliegue.
- Fuentes locales en `app/fonts/`; el build no depende de Google Fonts.
- `proxy.ts` refresca la sesión de Supabase en las rutas configuradas.

Las áreas principales son:

- `app/`: rutas, layouts, metadata y endpoint `/api/lead`.
- `components/`: portada, catálogo, cotizadores, cuenta y controles administrativos.
- `lib/supabase/`: clientes y consultas compartidas.
- `lib/leads/`: construcción de solicitudes de cotización.
- `types/`: tipos del catálogo y categorías canónicas.

El CRM/Supabase es la fuente principal de leads y catálogo. El endpoint `/api/lead`
envía la solicitud al backend configurado mediante `INGEST_LEAD_URL`; no deben
hardcodearse secretos, teléfonos de asesores ni reglas de asignación en el cliente.

## Variables de entorno

Crear `.env.local` solo en el entorno local. Nunca versionar sus valores.

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública protegida por RLS |
| `NEXT_PUBLIC_SITE_URL` | URL canónica, sitemap, robots y JSON-LD |
| `NEXT_PUBLIC_WHATSAPP_CORPORATIVO` | Contacto corporativo mostrado al cliente |
| `INGEST_LEAD_URL` | Backend server-side que recibe solicitudes de leads |

## Desarrollo y validación

En Windows, usar `npm.cmd` si PowerShell bloquea `npm.ps1`.

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

Home, catálogo, producto y cotizador se renderizan en vivo en cada visita (`dynamic =
"force-dynamic"` en `app/layout.tsx`) — no HTML estático cacheado. El ISR con
`revalidate` que se usaba antes se quedó sirviendo contenido vencido indefinidamente en
Netlify (Cache-Status `hit; fwd=stale` mucho después del revalidate window, confirmado
en producción el 2026-07-16); esto garantiza que las ediciones del panel admin/modo
edición se vean de inmediato, a cambio de no tener caché estático por página.

Antes de considerar un cambio listo:

1. Ejecutar lint y build sin warnings nuevos.
2. Revisar portada, navegación, catálogo y cotización en 390 px y escritorio.
3. Verificar que no haya overflow horizontal ni errores de consola.
4. Probar login, favoritos y controles admin cuando el cambio toque esas áreas.
5. No usar datos reales de clientes como fixtures ni exponer PII en logs o URLs.

## Despliegue y rollback

`netlify.toml` fija Node 24, ejecuta `npm run build` y activa el plugin oficial de
Next.js. Un commit local o un build verde no autorizan por sí solos un despliegue.

Para publicar:

1. Crear un deploy preview del commit candidato.
2. Ejecutar smoke tests en móvil y escritorio.
3. Confirmar variables por nombre, redirects, metadata y envío de leads.
4. Promover el deploy solo con autorización explícita.

Rollback: restaurar en Netlify el último deploy validado y, si hubo un cambio de
dominio, revertir también la configuración DNS documentada. La web legacy no debe
retirarse hasta completar el inventario de URLs y redirects 301.

## Estado conocido

- La web aún está en transición desde `CRM/redireccion-whatsapp`.
- Faltan pruebas automatizadas para cotizadores, carrito, auth, admin y `/api/lead`.
- Antes del cambio de dominio se requiere QA E2E, baseline de conversión y rollback
  probado.
