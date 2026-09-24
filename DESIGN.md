---
name: Destino y Eventos Lotus 360 (web pública)
description: Un pase de abordar: ofertas que se leen como boletos, señalética de aeropuerto sobre bandas dusk y arena mate.
colors:
  dusk: "#12262b"
  dusk-2: "#1c3238"
  dusk-text: "#eaf1ef"
  dusk-text-soft: "#a9bfbc"
  sand: "#ede5d8"
  sand-2: "#e1d8c7"
  card: "#f7f1e6"
  ink: "#2c2620"
  ink-soft: "#6b5e50"
  acento: "#A83E00"
  acento-suave: "#fbe6d5"
  coral-bright: "#FC7300"
  gold: "#FBC000"
  btn-ink: "#3a1505"
  ambar: "#8a5a00"
  ambar-suave: "#f8ecd0"
  seafoam: "#3e827d"
  seafoam-text: "#255954"
  seafoam-bg: "#e4eeec"
  whatsapp: "#0f7a40"
  peligro: "#b3261e"
  peligro-suave: "#f9e1de"
  linea: "rgba(36, 31, 26, 0.14)"
  linea-fuerte: "rgba(36, 31, 26, 0.24)"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6.4vw, 5rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.02em"
    fontVariation: "wdth 82"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Space Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
  price:
    fontFamily: "Space Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  card: "16px"
  media: "12px"
  control: "12px"
  pill: "999px"
spacing:
  section: "56px"
  section-md: "96px"
  gutter: "20px"
  content-width: "1248px"
components:
  button-firma:
    backgroundColor: "{colors.coral-bright}"
    textColor: "{colors.btn-ink}"
    rounded: "{rounded.control}"
    padding: "0 32px"
    height: "56px"
  button-primario:
    backgroundColor: "{colors.acento}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
  button-secundario:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "48px"
  boleto:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  tablero-celda:
    backgroundColor: "{colors.dusk-2}"
    textColor: "{colors.dusk-text}"
    rounded: "0.18em"
---

# Design System: Destino y Eventos Lotus 360 (web pública)

## Overview

**Creative North Star: "El pase de abordar"**

Cada oferta se lee como un boleto: destino arriba, fecha y detalle al centro, precio en el talón. El sitio toma la señalética de aeropuerto (titulares condensados y en negrita, un tablero de salidas, códigos en mono) y la pone sobre bandas `dusk` con foto a sangre, alternadas con arena y crema mate. La marca evoluciona en proporción, no en color: los hex del logo y el mate calibrado por el dueño se conservan.

La pantalla es de un viajero en el teléfono que llegó desde redes. Densidad media, un solo momento orquestado (el tablero del hero), el resto es CSS quieto y respuesta táctil. El degradado del logo (`#FC7300` a `#FBC000`) queda reservado para el elemento firma: el canto del talón y el indicador activo, nunca detrás de texto.

Rechazos confirmados: la landing genérica de agencia (foto, serif y tarjetas crema), el grano `feTurbulence`, los emoji y glifos unicode como iconos, los eyebrows sobre los títulos, y la elevación con borde y sombra a la vez.

**Key Characteristics:**
- Bandas `dusk` con foto a sangre contra contenido en `sand`/`card` mate.
- Titulares en Archivo condensado bold; precios, códigos y fechas en Space Mono.
- Ofertas como boletos perforados con talón de tamaño fijo.
- Un solo momento animado: el tablero split-flap del hero, que sigue a la foto rotativa.
- Claro por defecto; oscuro y automático desde el selector de tema.
- Voz "usted", cercana y respetuosa.

## Colors

Paleta terrosa y marina: arena mate, tinta cálida, un marino profundo (`dusk`) y un naranja vivo que solo aparece donde hay que actuar.

### Primary
- **Naranja de pase** (`#FC7300`, `coral-bright`): el CTA "firma" sobre `dusk` y foto, texto encima `#3a1505` (5.9:1). Es el color de la acción principal en superficies oscuras.
- **Coral quemado** (`#A83E00`, token `acento`, alias `coral`): acento sobre claro: botón primario, foco, selección, enlaces. En oscuro pasa a `#FF8A3D`; siempre se usa por token para que gire con el tema.
- **Dorado del logo** (`#FBC000`, `gold`): cifras y señales sobre `dusk`, el final del degradado de marca. En oscuro es también el `ambar`.

### Secondary
- **Marino profundo** (`#12262b`, `dusk`; `#1c3238`, `dusk-2`): héroes, banda de confianza, footer, el tablero. Texto encima: `dusk-text` `#eaf1ef` y `dusk-text-soft` `#a9bfbc`.
- **Verde espuma** (`#3e827d`, `seafoam`; texto `#255954`, fondo `#e4eeec`): bloques informativos.
- **Verde WhatsApp** (`#0f7a40`): solo el botón de WhatsApp.

### Neutral
- **Arena mate** (`#ede5d8`, `sand`; `#e1d8c7`, `sand-2`): fondo de página. Calibrado dos veces por el dueño: no se toca.
- **Crema de tarjeta** (`#f7f1e6`, `card`): superficies elevadas por borde.
- **Tinta cálida** (`#2c2620`, `ink`; `#6b5e50`, `ink-soft`): texto. En oscuro `#eef3f1` y `#9db3b0`.
- **Línea** (`rgba(36,31,26,.14)`, `linea`; `.24`, `linea-fuerte`): bordes y perforaciones.
- **Peligro** (`#b3261e`, fondo `#f9e1de`): errores de formulario y avisos destructivos.

### Named Rules
**The Logo Gradient Rule.** El degradado `#FC7300` a `#FBC000` es de la firma: canto del talón e indicador activo. Nunca detrás de texto, nunca de fondo de sección.
**The Two Themes Rule.** Un color nuevo se define en claro y en oscuro, en las tres capas de tema y en `@theme`. Sin excepciones.
**The Orange-Where-You-Act Rule.** El naranja aparece donde hay una acción (cotizar, pagar, WhatsApp). Un ornamento naranja compite con el CTA.

## Typography

**Display Font:** Archivo, instanciada a ancho 82 (condensada), pesos 500 a 800, local.
**Body Font:** Figtree, 400 a 700, local.
**Label/Mono Font:** Space Mono 400 y 700, local.

**Character:** Archivo condensado da la señalética de aeropuerto; Figtree mantiene la cercanía del cuerpo de texto; Space Mono se reserva para lo que en un boleto va en código: precio, fecha, destino, etiqueta.

### Hierarchy
- **Display** (700, `clamp(2.75rem, 6.4vw, 5rem)`, 0.95): titular del hero, `max-w-[13ch]`.
- **Headline** (700, `text-3xl` a `md:text-5xl`, 1.02, `-0.015em`): títulos de sección, `max-w-[22ch]`, `text-balance`.
- **Title** (Archivo 700, `text-xl` a `text-3xl`): títulos de tarjeta y cifras de la banda de confianza.
- **Body** (Figtree 400, 16px, 1.75): texto corrido, 65ch como máximo. 16px mínimo en controles (iOS hace zoom por debajo).
- **Label** (Space Mono 700, 12px, `0.14em`, mayúsculas): etiqueta bajo el título de sección, códigos, insignias.
- **Price** (Space Mono 700, 16px, `tabular-nums`): talón del boleto y precios.

### Named Rules
**The 12px Floor Rule.** Ningún texto por debajo de 12px (`text-xs`). El wordmark del logo es lettering de marca y es la única excepción.
**The Mono-Is-Data Rule.** Space Mono solo para datos: precios, códigos, fechas, etiquetas. Nunca párrafos.

## Layout

Contenedor de `78rem` (`--ancho-contenido`) con gutter de 20px en móvil; ancho medio de `64rem` para formularios y lectura. Ritmo de sección de `3.5rem` en móvil y `6rem` desde `md` (`--ritmo-seccion`, `--ritmo-seccion-md`). Se alternan bandas `dusk` y arena; el primer viewport es una banda `dusk` con foto a sangre.

En móvil, barra superior `h-14` y barra inferior de 5 pestañas (Inicio, Promos, Cotizar central levantado, Favoritos, Cuenta). El resto (Empleo, IA para su negocio, moneda, tema) vive en la hoja "Más". En escritorio, barra a lo ancho de dos filas (ver Navigation). Objetivos táctiles de 44px como mínimo.

## Elevation & Depth

Superficies planas en reposo: la elevación es un borde `linea` **o** una sombra, nunca las dos. Las hojas y el carrito flotan con la sombra `chrome` sobre una capa de cierre.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 18px 50px -30px rgba(10,14,13,.45)`): tarjetas de catálogo sin borde.
- **Lift** (`box-shadow: 0 24px 60px -24px rgba(10,14,13,.35)`): hover de tarjeta elevada.
- **Chrome** (`box-shadow: 0 12px 35px rgba(10,14,13,.12)`): píldora de navegación, hojas y botones flotantes.

### Named Rules
**The Border-Or-Shadow Rule.** Una superficie se eleva con borde o con sombra. Las dos juntas ensucian el mate.

## Shapes

Radios de 12 a 16px: `card` 16px, `media` y `control` 12px, `pill` 999px solo para contadores e insignias. Nada de `rounded-md` suelto ni radios arbitrarios. La forma recurrente es el boleto: rectángulo con muesca semicircular en el corte (`boleto-v`, `boleto-h`, muesca 0.6rem) y talón separado por una perforación de 2px punteada.

## Components

### Buttons
- **Shape:** radio `control` (12px), `min-h` 44, 48 o 56px según tamaño, texto `font-semibold`.
- **Firma:** naranja `#FC7300` con texto `#3a1505`. Para CTA sobre `dusk` y foto.
- **Primario:** `acento` con texto `sobre-acento`; hover `brightness-110`.
- **Secundario / Fantasma:** contorno `linea-fuerte` sobre `card`; fantasma sin borde, hover `sand-2`.
- **WhatsApp:** verde `#0f7a40`, texto blanco. **Sobre foto:** contorno blanco al 30 % y fondo blanco al 10 %.
- **Press / Focus:** `active:scale-[0.97]` en 150ms con `ease-salida`; foco visible siempre (`acento`, dorado sobre `dusk`).

### Cards / Containers
- **Corner Style:** `card` 16px.
- **Background:** `card` sobre `sand`; `dusk-2` sobre bandas oscuras.
- **Shadow Strategy:** borde `linea` o sombra Card, no ambos.
- **Internal Padding:** 16 a 24px.

### Inputs / Fields
- **Style:** borde `linea-fuerte`, fondo `card`, radio 12px, alto mínimo 48px, texto 16px.
- **Focus:** borde `acento` y anillo `ring-4` al 20 %.
- **Error / Disabled:** `aria-invalid` pinta borde y anillo de `peligro`; deshabilitado al 60 %.
- **Opciones:** radios y casillas nativos ocultos (`sr-only`) dentro de una etiqueta que pinta el estado con `has-[:checked]` y el foco con `has-[:focus-visible]`. Tarjetas de opción: borde `acento` y fondo `acento-suave` al elegir, con un círculo de check. Etiquetas cortas: píldora que pasa a `acento`. Los grupos van en `fieldset` + `legend`.
- **Cantidades:** `− valor +` con botones de 44px y el número en mono (`Cantidad` en `CotizacionOpcionForm`).
- **Adjuntos:** `Archivo`, borde punteado y botón del sistema vestido de secundario.
- **Avisos:** `Aviso` (`error`, `ok`, `info`) en bloque con icono; los errores se anuncian con `role="alert"`.

### Cierre de solicitud
`SolicitudLista`: la confirmación de carrito, cotizador y cotización de una opción es un boleto ya emitido, con el envío por WhatsApp en el talón. El lead ya entró al CRM antes de mostrarlo; el botón solo abre la conversación.

### Navigation
Escritorio: barra a lo ancho de dos filas dentro de `--ancho-contenido`. Fila 1 (`h-16`, sticky): logo, campo "¿A dónde quiere viajar?" que abre `BuscadorGlobal`, y a la derecha Cotizar (texto), WhatsApp, favoritos, carrito, campana, cuenta y "Preferencias" (`PreferenciasPopover`: moneda y tema, mismo contenido que la hoja "Más" del móvil vía `PreferenciasControles`). Fila 2 (`h-11`, NO sticky, se va con el scroll): categorías del contenido editable (todo menos Empleo e IA, que viven en el footer y en "Más"), con indicador `layoutId` y `franja-marca`. Nada de anchos fijos: solo el campo de búsqueda se estira (`min-w-0`) y las etiquetas aparecen por breakpoint.

Sobre el hero, en móvil y escritorio, la barra es transparente con tinta `dusk-text` (clase `barra-sobre-foto`, que redefine `ink`, `ink-soft`, `sand-2` y `linea` dentro del grupo) y pasa a sólida `sand` con filete `linea` en `--dur-media` cuando el hero sale de detrás. El hero lo avisa con `useHeroBajoBarra` (`lib/layout/barraSobreFoto.ts`) y se mete bajo la barra con la utility `bajo-barra`; necesita un velo superior propio para que la tinta clara se lea. El campo de búsqueda queda fuera de `barra-sobre-foto` porque es un campo sobre `card`.

Móvil: barra superior compacta (atrás y símbolo, marca completa solo en la home) y barra inferior con pestaña central "Cotizar" en `coral-bright`. Indicador de pestaña activa con `layoutId` y el degradado de marca. Sin blur.

### Tablero de salidas (firma)
Split-flap en `dusk-2` con celdas de radio `0.18em`, línea de bisagra a media altura y sombra interior. Muestra el destino de la foto actual del hero; corta en palabra hacia los 18 caracteres y solo anima las celdas que cambian (110ms). Con `prefers-reduced-motion` queda estático.

### Boleto y talón (firma)
Tarjeta con muesca y perforación. El cuerpo lleva foto, destino y detalle; el talón, de tamaño fijo, lleva el código en mono, el precio "desde $X" convertible a Bs y el canto con el degradado de marca.

### Filtros del catálogo
`DestinoChips` y `CategoriaTabs` marcan la opción activa con un indicador `layoutId` que se desliza entre opciones. Chips sin emoji; objetivo táctil de 44px.
En listas largas (pestañas de `/catalogo/[categoria]`, chips de `/catalogo/hot-sales`) la fila se pega bajo la barra con `FILA_FIJA` (`components/layout/filaFija.ts`): `top: var(--offset-sticky)`, que `useHeaderAutoHide` baja a 0 cuando la barra del móvil se oculta. La fila sangra hasta el borde, tapa con `sand` y lleva un filete `linea` abajo. En la home los chips no se pegan.

### Favorito
`BotonFavorito`: botón de 44px con el corazón de `Icono`. El latido (`corazon-latido`) corre solo cuando la persona toca, nunca al montar, y con `prefers-reduced-motion` no anima.

### Esqueletos
`EsqueletoTarjeta` repite la proporción del boleto para que la carga no salte. Catálogo y producto tienen su `loading.tsx`.

### Home (pase de abordar premium)
Orden: hero, Hot Sales, Destinos, Acompañamiento, Más de Lotus, footer. Acompañamiento es la única banda `dusk` entre el hero y el footer.
- **Hero:** banda `dusk` bajo la barra (`bajo-barra` + `useHeroBajoBarra` + velo superior propio), `min-h-[calc(100svh-5rem)]` en móvil y `80svh` desde `lg` para que asome la primera fila de Hot Sales. Collage lugar + hospedaje: de fondo la foto del destino (Pexels, 2560 px, `public/destinos/`) y la del alojamiento dentro del pase; rotan solo los destinos con foto propia y, si ninguno tiene, cae a la foto del hotel. Tablero con el destino de la foto; segmentos tipo historias (uno por foto, con barra de tiempo, clic para saltar, pausa fuera de pantalla). Entrada `.hero-sube` (CSS, 60/120 ms): el h1 no anima porque es el LCP.
- **`PaseDestacado`:** `Boleto` vertical con la promo de la foto actual (hotel, destino y plan, "desde $X", vigencia `hasta 30 nov`, hasta 3 incluye, "Ver oferta"). Talón `clamp(7rem,34%,10.5rem)`, degradado solo en hover y foco. Cambia con `AnimatePresence popLayout`; en móvil va compacto y horizontal. Foto del alojamiento a sangre contra el borde del boleto: tira de 4,5rem a la izquierda en el teléfono, franja 16:9 arriba del nombre desde `lg`; zoom de 1,04 en hover (solo `motion-safe`). Sin foto cuando el fondo ya es la del hotel.
- **`CotizadorRapido`:** en `lg+`, barra ancha anclada al pie del hero (Servicio, Destino, Entrada y Salida, Viajeros, botón firma "Cotizar"); en móvil, un botón-campo "¿A dónde quiere viajar?" que abre una `Hoja` con los mismos datos (fechas nativas y selects de Adultos, Niños y Bebés). Las fechas se nombran según el servicio (`fechasDelServicio`): Entrada/Salida para hospedaje y paquete, Ida/Vuelta para vuelos y una sola "Fecha" para el full day. Bajo el par de fechas, en mono, "4 días · 3 noches". Los tramos van alineados arriba, no centrados, para que etiquetas y valores queden a la misma altura con esa línea debajo. Elegir la entrada abre la salida; si la entrada nueva alcanza a la salida, la salida se corre y conserva las noches. `SelectorFecha` es controlado, con `min` y `rango` (los días entre entrada y salida en `acento-suave`) y sin año cuando la fecha es del año en curso. `SelectorViajeros` es un popover con un contador por tipo (botones redondos de 44px) y un resumen "2 adultos · 1 niño" que solo nombra niños y bebés si viajan. Los dos son `next/form` GET a `/cotizador-personalizado`, que arranca el wizard en el primer paso incompleto. La barra es una superficie `card` dentro de `dusk`: lleva `.sobre-claro` para que el foco vuelva a `acento`.
- **Hot Sales:** grilla densa de 2, 3 y 4 columnas (`sm`, `lg`, `xl`) y carrusel con 1,15 tarjetas a la vista en el teléfono, en un solo árbol (`Carrusel` con `desktop`). Muestra 8 (6 en `lg`, para no dejar fila coja) y "Ver las N ofertas". Chips de destino arriba. El orden lo fija el servidor (`ordenDelDia`: manuales primero y el resto rota por día); el cliente no baraja.
- **`DestinosRail`:** tiras 3:4 con foto a sangre, el destino en Archivo bold y, tras una perforación, "N ofertas" y "desde $X" en mono dorado. Ordenadas por cantidad de ofertas; el piso solo compara montos de la misma moneda. Cada tira abre `/catalogo/hot-sales?destino=X` (HotSalesGrid lee el parámetro al hidratar y lo reescribe con `replaceState`). Con menos de 3 destinos no se monta.
- **Foco:** el radio del anillo (4px) vive en `@layer base`, así un `rounded-*` conserva su forma al recibir foco. Los carruseles dejan 8px de aire vertical para que el anillo no se recorte.

## Do's and Don'ts

### Do:
- **Do** usar tokens (`bg-acento`, `text-ink-soft`, `rounded-card`); un hex suelto rompe el modo oscuro.
- **Do** dejar el hero legible desde el primer pintado (sin `Revelar`): es candidato a LCP.
- **Do** usar `clasesBoton` y `Boton` para toda acción; `CLASE_CONTROL` para todo campo.
- **Do** escribir en usted y en oraciones cortas; el cotizador y WhatsApp siempre a un toque.
- **Do** pausar loops fuera de pantalla y respetar `prefers-reduced-motion` con estado estático.

### Don't:
- **Don't** volver a la landing de agencia con serif y tarjetas crema.
- **Don't** poner eyebrows sobre los títulos; la etiqueta va debajo.
- **Don't** usar emoji ni glifos unicode como iconos; usar `Icono`.
- **Don't** meter el degradado del logo detrás de texto ni de una sección completa.
- **Don't** usar `rounded-*` sueltos, sombras nuevas, `outline-none` sin reemplazo ni `cubic-bezier` en línea (`--ease-salida`).
- **Don't** prometer métodos de pago que la pasarela todavía no tiene.
