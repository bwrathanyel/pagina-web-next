# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Viajero venezolano que llega desde redes (Instagram ~500k, TikTok + Facebook ~400k), casi
siempre en el teléfono. Vio una promo o un video, entra a ver Hot Sales, paquetes, hoteles o
tours, y quiere saber precio, qué incluye y cómo reservar. Audiencias secundarias:
postulantes a empleo (`/trabaja-con-nosotros`) y negocios interesados en IA
(`/ia-para-tu-negocio`).

## Product Purpose

Sitio público de Destino y Eventos Lotus 360 (agencia de viajes, Venezuela) en
`destinoyeventoslotus360.com`: catálogo de promociones, paquetes todo incluido, hoteles,
full days / tours y vuelos, con cotizador, carrito, favoritos y cuenta de usuario.
Éxito = el visitante pide una cotización, paga en línea o contacta a un asesor. Las tres
importan; la dirección del dueño (2026-09-23) es empujar más **cotizador** y **pago en
línea**, con WhatsApp como respaldo siempre visible. Las pasarelas de pago todavía se
están montando: no prometer métodos de pago que no existan.

## Positioning

Agencia con asesores reales (6) detrás de cada cotización y un catálogo que sale del
tarifario vivo de la empresa: las promos vigentes de la web son las mismas que venden los
asesores ese día.

## Operating Context

- Leads de la web entran al CRM interno (Supabase compartido) y los atiende un asesor.
- Contenido editable por el admin en línea (`EditableText` / `SiteContentProvider`).
- Precios y vigencias salen del tarifario; nunca se inventan.
- Selector de moneda y tema claro/oscuro (claro por defecto, pedido del dueño).

## Capabilities and Constraints

- Next.js 16 + Tailwind v4 + `motion`, desplegado en Cloudflare Workers (OpenNext).
- Fotos solo vía el Worker `fotos.destinoyeventoslotus360.com` (derivados); nunca
  originales de Supabase.
- CSP estricta (`next.config.ts`): fuentes y assets locales, sin CDNs nuevos.
- Deploy solo con OK explícito del dueño.
- Pago en línea: en construcción. Tratarlo como flujo presente pero incompleto.

## Brand Commitments

- Nombre: "Destino y Eventos Lotus 360". Logo con degradado naranja `#FC7300` → dorado
  `#FBC000`.
- Voz: **usted**, cercana y respetuosa, igual que el bot de ventas por WhatsApp. Apta
  para toda la familia.
- Decisión 2026-09-23: evolucionar la marca (mantener colores de logo), no reemplazarla.

## Evidence on Hand

Fotos reales de hoteles y destinos (tarifario, servidas por el Worker), promos y precios
vigentes desde Supabase. No hay testimonios, reseñas ni cifras de clientes verificadas en
el repo: no fabricarlas.

## Product Principles

1. El precio y lo que incluye se ven antes de pedir cualquier dato.
2. Cotizar o pagar tiene que poder hacerse con el pulgar, sin salir del flujo.
3. Un asesor humano siempre está a un toque.
4. Lo que muestra la web es lo que se vende hoy: nada vencido, nada inventado.

## Accessibility & Inclusion

Mayoría en teléfonos de gama media y datos móviles: peso bajo, objetivos táctiles ≥44px,
contraste AA en ambos temas, respetar `prefers-reduced-motion`.
