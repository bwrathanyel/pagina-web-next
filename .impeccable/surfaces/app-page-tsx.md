---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/layout.tsx"]
---

# Surface brief — sitio público (home + chrome global)

Scope: home, header/nav desktop, barra inferior mobile, footer, primitivas UI. Modo: **Persuade**
(home, catálogo) con tramos **Operate** (cotizador, carrito, pago, cuenta).

Audiencia/tarea: viajero desde redes, en teléfono; ve la promo, entiende precio + qué incluye,
y cotiza, paga o escribe a un asesor. Voz: usted.

Restricciones: marca evolucionada (colores del logo, sand/card mate calibrados por el dueño,
claro por defecto), Figtree y Space Mono se mantienen como assets incumbentes, CSP sin CDNs,
fotos solo vía Worker, edición inline del admin intacta.

## Direction contract

THESIS: El sitio es un pase de abordar: cada oferta se lee como un boleto (destino, fecha,
precio en el talón). Rechaza la landing de agencia genérica: foto + serif + tarjetas crema.

OWN-WORLD: Bandas dusk (#12262b) con foto a sangre; contenido en sand/card mate; talón
perforado con degradado del logo (#FC7300→#FBC000) solo en precio/CTA; titulares en Archivo
condensado bold (señalética de aeropuerto); códigos, fechas y precios en Space Mono.

STORY: Ve lo que se vende hoy → entiende precio y qué incluye sin pedir datos → cotiza o paga
con el pulgar; el asesor queda a un toque.

FIRST VIEWPORT: Hero dusk a sangre con foto rotativa de Hot Sales; abajo-izquierda un tablero
split-flap con el destino actual (cambia con la foto), titular Archivo, CTA primario
"Cotizar mi viaje" + secundario WhatsApp; mobile: CTA a la altura del pulgar, barra inferior
con Cotizar central.

FORM: "Pase de abordar / señalética de aeropuerto", pineado por el usuario (plan aprobado
2026-09-23); sin tirada de concept-seed. Seed key: n/a (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Firma: split-flap del hero (único momento orquestado) + talón perforado. Movimiento: CSS primero,
motion/react para hojas, modales, layoutId; reduced-motion = estático con cambio de estado.

Pendiente: pasarelas de pago en construcción (no prometer métodos).
