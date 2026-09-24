---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/layout.tsx"]
---

# Surface brief — sitio público (home + chrome global)

Scope: home, header/nav desktop, barra inferior mobile, footer, primitivas UI, sistema de tarjetas
y catálogo. Modo: **Persuade** (home, catálogo) con tramos **Operate** (producto, cotizador,
carrito, pago, cuenta).

Audiencia/tarea: viajero desde redes, en teléfono; ve la promo, entiende precio + qué incluye,
y cotiza, paga o escribe a un asesor. Voz: usted.

Restricciones: marca evolucionada (colores del logo, sand/card mate calibrados por el dueño,
claro por defecto), Archivo condensada + Figtree + Space Mono, CSP sin CDNs, fotos solo vía
Worker, edición inline del admin intacta. Referencia de nivel (2026-09-24): Airbnb (fotos
grandes, tarjetas sin caja, aire) + Booking/Despegar (precio siempre visible, buscador
protagonista, densidad de ofertas).

## Direction contract

THESIS: "Pase de abordar premium". El sitio sigue siendo un pase de abordar, pero deja de ser
una capa de estilo sobre una landing de agencia: la home abre con la promo real y el cotizador,
y cada oferta se lee como un boleto con el precio en el talón, siempre visible. Rechaza el hero
foto + texto con media pantalla vacía, la fila de relleno y las tres formas distintas de mostrar
una oferta.

OWN-WORLD: Bandas dusk (#12262b) con foto a sangre y degradado solo a la izquierda y abajo;
contenido en sand/card mate; boleto vertical como "pase destacado"; talón perforado con el
degradado del logo (#FC7300 a #FBC000) solo en el canto y el indicador activo, nunca detrás
de texto; titulares Archivo condensada bold (señalética de aeropuerto); precios, códigos y
fechas en Space Mono. Tarjetas de oferta: foto 4:3 a sangre sin caja, texto sobre sand y talón
horizontal al pie.

STORY: Ve la promo de hoy con su precio y qué incluye, sin pedir datos, y cotiza desde el
primer viewport (servicio, destino, fecha, adultos) o escribe a un asesor. Una sola regla de
precio en todo el sitio.

FIRST VIEWPORT: Desktop, hero 86svh dusk con foto rotativa de Hot Sales. Columna izquierda:
tablero split-flap grande con el destino, h1 "Su próximo viaje, a su medida.", subtítulo y CTA
firma "Cotizar" + WhatsApp. Columna derecha: "pase destacado", boleto vertical con la promo de
la foto actual (hotel, destino, plan, "desde $X", vigencia, hasta 3 incluye, "Ver oferta") que
cambia en sincronía con foto y tablero. Anclado al pie, cotizador rápido estilo Booking (Servicio,
Destino, Fecha, Adultos, botón "Cotizar"). Barra transparente sobre el hero; segmentos de
historias bajo el cotizador. Móvil: h1, pase compacto horizontal y un botón-campo "¿A dónde
quiere viajar?" que abre una hoja con los 4 campos; CTA a la altura del pulgar.

FORM: "Pase de abordar / señalética de aeropuerto", pineado por el dueño (plan 2026-09-23) y
subido de nivel (plan 2026-09-24): pinned, raise of incumbent; sin tirada de concept-seed.
Seed key: n/a (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Firma: split-flap del hero (único momento orquestado de carga) + talón perforado. Movimiento:
CSS primero, motion/react para hojas, modales, layoutId y el cambio del pase destacado;
reduced-motion = estático con cambio de estado. Verificación: sin navegador (código + capturas
del dueño), comp-led liviano con comps de OpenRouter en `.impeccable/mocks/decision/`, sin gates
build-phase/comp-diff.

Pendiente: pasarelas de pago en construcción (no prometer métodos).
