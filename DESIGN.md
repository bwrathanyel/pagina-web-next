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

La pantalla es de un viajero en el teléfono que llegó desde redes. Densidad media, un momento de firma (el tablero del hero) y movimiento con propósito en el resto: cada animación explica un cambio de estado, una relación o una continuidad (ver Motion). El degradado del logo (`#FC7300` a `#FBC000`) queda reservado para el elemento firma: el canto del talón y el indicador activo, nunca detrás de texto.

Rechazos confirmados: la landing genérica de agencia (foto, serif y tarjetas crema), el grano `feTurbulence`, los emoji y glifos unicode como iconos, los eyebrows sobre los títulos, y la elevación con borde y sombra a la vez.

**Key Characteristics:**
- Bandas `dusk` con foto a sangre contra contenido en `sand`/`card` mate.
- Titulares en Archivo condensado bold; precios, códigos y fechas en Space Mono.
- Ofertas como boletos perforados con talón de tamaño fijo.
- Movimiento con propósito: el tablero split-flap del hero es la firma; el resto son respuestas cortas (≤ 300 ms) que explican qué cambió.
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

## Motion

**Movimiento con propósito** (decisión del dueño, 16-nov-2026). Una animación se queda solo si quitarla hace perder información: qué se tocó, qué cambió, de dónde viene lo nuevo. Decorar no es un propósito.

### Presupuesto
- **Duración:** ≤ 300 ms por animación (`--dur-rapida` 160 ms para respuesta, `--dur-media` 280 ms para cambios de estado y entradas). La salida es más corta que la entrada. `--dur-lenta` (600 ms) queda solo para la entrada del hero.
- **Escalonado:** 40 ms entre hermanos, con tope en el séptimo (≤ 240 ms de retraso total).
- **Propiedades:** solo `transform` y `opacity` (y `box-shadow` en el hover de tarjeta). Nada de animar `width`, `height`, `top`, `margin`: sin layout thrash.
- **Curvas:** `--ease-salida` para llegar, `--ease-entrada-salida` para lo que va y vuelve (flap). Nunca `cubic-bezier` en línea; en `motion` las mismas curvas como arreglo (`EASE_SALIDA` en `Hoja`).
- **Loops:** solo los del hero (Ken Burns, barra de segmentos) y se pausan fuera de pantalla o con la pestaña oculta (`.en-pausa`).
- **Movimiento reducido:** sin desplazamiento ni escala; las entradas quedan como fundido corto (`aparecer-suave`), los loops se quitan, lo que se revela al hacer scroll ya está en su lugar y las view transitions no animan.

### Momentos permitidos
1. **Firma:** tablero split-flap del hero (110 ms por celda, solo las que cambian), `.hero-sube` y el efecto tablero en montos (`flap-caer`: `MontoTablero`, `.monto-flap`).
2. **Respuesta al tocar:** `active:scale-[0.97]` en botones; `PRESION_TARJETA` (0.985) en tarjetas; latido del favorito y rebote del carrito solo tras la acción.
3. **Estado:** hover de tarjeta (`ELEVA_HOVER`, `FOTO_HOVER`), opción elegida (`ELEGIDO` / `ELEGIBLE`), indicador activo con `layoutId` (pestañas, chips, barra inferior), el sello del destino que se estampa en el boleto del resumen al cambiar de destino (`estampa`).
4. **Continuidad en la página:** hojas y modales con entrada y salida (`Hoja`, 280 ms entrada, 220 ms salida); paneles de pestañas del cotizador entran desde el lado de su pestaña (`.panel-entra`); el hotel elegido sube a «Su hotel» (`.hotel-sube`).
5. **Continuidad entre páginas:** el contenido cruza en su lugar (`.pagina`, el cromo queda quieto y `root` no anima). Lo único que viaja es la foto del producto u hotel: tarjeta → galería de la ficha → `/cotizar`, con `<ViewTransition name={nombreFoto(...)} share="morph" default="none">` y el grupo `.morph` en `globals.css`.
6. **Listas:** entrada escalonada (`ENTRA_ESCALONADO` + `escalon(i)`, keyframe `surge`) cuando una lista aparece como lista (cambio de destino, resultados). Nunca en cada tecla.
7. **Scroll:** `Revelar` con `animation-timeline: view()` donde el navegador lo soporta (CSS puro, sin esperar a hidratar); donde no, cae al `IntersectionObserver`. El hero y lo que ya está en pantalla nunca se revelan.

Las constantes viven en `components/ui/movimiento.ts`: usarlas en vez de escribir duraciones y escalas a mano.

### Named Rules
**The Purpose Rule.** Si al quitar una animación no se pierde nada, se quita.
**The 300ms Rule.** Ninguna animación de interfaz pasa de 300 ms; la firma del hero es la única excepción.

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
- **Cantidades:** `− valor +` con botones de 44px y el número en mono (`SelectorViajeros`; `Cantidad` local en `WhatsAppLeadButton`).
- **Adjuntos:** `Archivo`, borde punteado y botón del sistema vestido de secundario.
- **Avisos:** `Aviso` (`error`, `ok`, `info`) en bloque con icono; los errores se anuncian con `role="alert"`.

### Cierre de solicitud
`SolicitudLista`: la confirmación del carrito y del cotizador es un boleto ya emitido, con el envío por WhatsApp en el talón. El lead ya entró al CRM antes de mostrarlo; el botón solo abre la conversación.

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

### Catálogo y ficha de producto (etapa 3)
- **`TicketCard`:** foto 4:3 con filas de alto fijo, sin `backdrop-blur` en móvil; el talón muestra el precio con `precioTarjeta` (una sola regla para Promos, catálogo y Hot Sales) y el monto se ajusta de tamaño para que no desborde. En táctil solo se montan la portada y la foto siguiente.
- **Listas:** `/catalogo/[categoria]` y `/catalogo/hot-sales` son grilla con chips de destino y orden Recomendadas / Menor precio (cliente, sobre el monto de `precioTarjeta`). Favoritos usa la misma tarjeta, en "usted".
- **`GaleriaProducto`:** una sola pista para los dos tamaños: en el teléfono se desliza con snap, una foto por pantalla; desde `lg` pasa a grilla, 1 foto grande y 4 chicas. Tocar una foto abre el visor (`Hoja`) con todas. `sizes` según la celda.
- **`CajaPrecio`:** el boleto de la tarjeta con la tarifa destacada arriba y, en el talón, Cotizar y WhatsApp. Pegada en escritorio junto a la columna de texto; en el teléfono es un bloque más y el CTA fijo es `ProductoFooterMobile`.

### Home (pase de abordar premium)
Orden: hero, Hot Sales, Destinos, Acompañamiento, Más de Lotus, footer. Acompañamiento es la única banda `dusk` entre el hero y el footer.
- **Hero:** banda `dusk` bajo la barra (`bajo-barra` + `useHeroBajoBarra` + velo superior propio), `min-h-[calc(100svh-5rem)]` en móvil y `80svh` desde `lg` para que asome la primera fila de Hot Sales. Collage lugar + hospedaje: de fondo la foto del destino (Pexels, 2560 px, `public/destinos/`) y la del alojamiento dentro del pase; rotan solo los destinos con foto propia y, si ninguno tiene, cae a la foto del hotel. Tablero con el destino de la foto; segmentos tipo historias (uno por foto, con barra de tiempo, clic para saltar, pausa fuera de pantalla). Entrada `.hero-sube` (CSS, 60/120 ms): el h1 no anima porque es el LCP.
- **`PaseDestacado`:** `Boleto` vertical con la promo de la foto actual (hotel, destino y plan, "desde $X", vigencia `hasta 30 nov`, hasta 3 incluye, "Ver oferta"). Talón `clamp(7rem,34%,10.5rem)`, degradado solo en hover y foco. Cambia con `AnimatePresence popLayout`; en móvil va compacto y horizontal. Foto del alojamiento a sangre contra el borde del boleto: tira de 4,5rem a la izquierda en el teléfono, franja 16:9 arriba del nombre desde `lg`; zoom de 1,04 en hover (solo `motion-safe`). Sin foto cuando el fondo ya es la del hotel.
- **`CotizadorRapido`:** en `lg+`, barra ancha anclada al pie del hero (Servicio, Destino, Entrada y Salida, Viajeros, botón firma "Cotizar"); en móvil, un botón-campo "¿A dónde quiere viajar?" que abre una `Hoja` con los mismos datos (fechas nativas y selects de Adultos, Niños y Bebés). Las fechas se nombran según el servicio (`fechasDelServicio`): Entrada/Salida para hospedaje y paquete, Ida/Vuelta para vuelos y una sola "Fecha" para el full day. Bajo el par de fechas, en mono, "4 días · 3 noches". Los tramos van alineados arriba, no centrados, para que etiquetas y valores queden a la misma altura con esa línea debajo. Elegir la entrada abre la salida; si la entrada nueva alcanza a la salida, la salida se corre y conserva las noches. `SelectorFecha` es controlado, con `min` y `rango` (los días entre entrada y salida en `acento-suave`) y sin año cuando la fecha es del año en curso. `SelectorViajeros` es un popover con un contador por tipo (botones redondos de 44px) y un resumen "2 adultos · 1 niño" que solo nombra niños y bebés si viajan. Los dos son `next/form` GET a `/cotizador-personalizado`, que arranca el wizard en el primer paso incompleto. La barra es una superficie `card` dentro de `dusk`: lleva `.sobre-claro` para que el foco vuelva a `acento`.
- **Hot Sales:** grilla densa de 2, 3 y 4 columnas (`sm`, `lg`, `xl`) y carrusel con 1,15 tarjetas a la vista en el teléfono, en un solo árbol (`Carrusel` con `desktop`). Muestra 8 (6 en `lg`, para no dejar fila coja) y "Ver las N ofertas". Chips de destino arriba. El orden lo fija el servidor (`ordenDelDia`: manuales primero y el resto rota por día); el cliente no baraja.
- **`DestinosRail`:** tiras 3:4 con foto a sangre, el destino en Archivo bold y, tras una perforación, "N ofertas" y "desde $X" en mono dorado. Ordenadas por cantidad de ofertas; el piso solo compara montos de la misma moneda. Cada tira abre `/catalogo/hot-sales?destino=X` (HotSalesGrid lee el parámetro al hidratar y lo reescribe con `replaceState`). Con menos de 3 destinos no se monta.
- **Foco:** el radio del anillo (4px) vive en `@layer base`, así un `rounded-*` conserva su forma al recibir foco. Los carruseles dejan 8px de aire vertical para que el anillo no se recorte.

### Cotizador (`/cotizar`, "Arme su viaje")
Un solo flujo para toda la web: el hero, `BottomTabBar`, `CajaPrecio`, las tarjetas y las promos abren `/cotizar` (con `hotel=` y `tarifa=` si vienen de un hotel u oferta). Las rutas viejas (`/cotizador-personalizado`, `/cotizar/[tipo]`, `/cotizar/producto/[id]`, `/cotizar/promocion/[id]`) solo redirigen. Todo el estado vive en la URL (`lib/cotizador/estado.ts`).
- **Estructura:** en `lg+`, dos columnas (`minmax(0,1fr)_23rem`): armado a la izquierda y "Su cotización" pegajosa a la derecha. En móvil, una columna y una barra fija con el estimado que abre el resumen en una `Hoja`.
- **`BarraViaje`:** destino, fechas, viajeros y chips multiselección de servicios (Hospedaje, Vuelo, Full day y tours; "Paquete completo" marca hospedaje y vuelo). Pasos numerados; al marcar uno, el foco va a su título.
- **Hospedaje:** `OfertasHospedaje` (tarjetas por `prioridadOferta`; con stop sale en las fechas, "Sin disponibilidad" y no se elige) y `DetalleHotel` (galería, planes, habitaciones con foto). El estimado sale de `estimarEstadia()`; sin tarifa aplicable, "Precio a confirmar por el asesor", nunca un número.
- **Vuelo y tours:** `SeccionVuelo` copia ruta, fechas y pasajeros del viaje y permite fechas propias; `SeccionTours` lista tours del destino, que no suman al estimado.
- **Resumen:** `ResumenViaje` en formato boleto, estimado con `aria-live`, contacto junto a Enviar. El borrador se guarda en localStorage (7 días) y se ofrece retomarlo. La confirmación es `SolicitudLista`; si el CRM falla se avisa y se ofrece WhatsApp directo.

### Checkout (`/reservar`, mostrador de embarque)
- **Una vista (2026-11-18, pedido del dueño):** sin aside. En `lg` dos columnas de tramos: Fechas y Habitación (+ política) | Pago, Datos y cierre. Desde `xl` tres (la derecha se disuelve con `xl:contents`): Fechas y Habitación | Pago + política | Datos y cierre; habitaciones con scroll propio (`max-h` según `100dvh`), características en una línea de texto, datos un campo por renglón. Así el botón «Reservar y pagar» queda sobre el pliegue en laptop. Política plegada en todas las pantallas (primer párrafo + «Leer completa» en `Hoja`).
- **Cabecera:** teléfono, franja baja (`min-h-24`) con la foto real de fondo, nombre con `titulo-marca` sobre el velo `dusk`; desde `lg`, tarjeta con la foto en miniatura, nombre, destino con `SelloDestino` y el total del pase (`PaseCabecera`). La foto lleva `<ViewTransition name={nombreFoto(hotel.id)} share="morph">`: llega volando desde `/cotizar` o la ficha.
- **Tramos (`Tramo`):** Fechas y viajeros (viajeros en una fila al lado de las fechas desde `lg`, abre su `Hoja`), Habitación, Forma de pago y Sus datos, numerados. Terminado = sin errores (`lib/checkout/tramos.ts`). En el teléfono el terminado se pliega a una línea de resumen con «Cambiar» (solo `max-lg:hidden`, el contenido sigue montado) y al terminar uno el foco y el scroll pasan al siguiente pendiente; reabierto, «Listo» lo pliega. Desde `lg` todos abiertos: el terminado lleva check y canto `franja-marca`.
- **Opciones:** radio nativo `sr-only` y círculo de check (`MarcaElegida`). Habitación en fila compacta: miniatura (`MiniFotos`, abre el visor), nombre, plan y una línea de detalle, total en mono y precio por noche. La miniatura y el «+N» (`VerFotos`) van fuera del `<label>`. Rieles en `radiogroup` con moneda en mono y horas de cupo; el detalle entra con `panel-entra`.
- **Pase:** en la cabecera (`PaseCabecera`, «Ver detalle» abre la `Hoja` con filas Fechas, Habitación y Pago que aparecen al terminarse su tramo); total con `MontoTablero convertir={false}` (siempre USD). En el teléfono, `BarraTotalMovil` abre el pase completo en una `Hoja`.
- **Datos:** con sesión, nombre y correo de la cuenta y «No soy yo». `TelefonoPais` sin banderas: ISO y prefijo en mono sobre un `<select>` nativo.

### Pago (`/pagar/[token]`, el talón)
- **`TalonPago`:** talón arriba con el monto exacto (`MontoTablero convertir={false}`, moneda del riel), `ChipPlazo` al lado (solo compra web) y la nota con equivalente y tasa BCV; debajo de la perforación, los `DatoCopiable` del riel y «Copiar todo» (`textoCopiarTodo`). Tres pasos fijos: Pague en su banco, Suba el comprobante, Le confirmamos.
- **`AvisoPago`:** comprobante como zona tocable con vista previa, Cambiar y Quitar. Las fotos se reducen en el cliente (`lib/pago/comprimir.ts`, WebP o JPEG ≤ 1,5 MB); el PDF va tal cual hasta 5 MB. Referencia y captura sobreviven a recargar (sessionStorage por token).
- **Estados:** `EstadoSimple arte=` y `Encabezado arte=` ponen la ilustración (`EstadoIlustrado`) en lugar del icono; el texto no cambia. Confirmada: sello con `estampa`, «Agregar al calendario» (`.ics` de `lib/pago/ics.ts`) y «Compartir mi reserva».
- **«Guarde este enlace»** en el teléfono va justo debajo del talón; desde `lg`, al pie del aside.

### Arte generado
Piezas de GPT Image (OpenRouter) hechas con `CRM/scripts/generar-arte.mjs` desde `scripts/arte/manifiesto.json` (guía de estilo, prompts y gasto en `costos.json`, tope US$ 10). Siempre compuestas con piezas propias del sistema; **nunca reemplazan fotos reales** de hoteles ni de destinos que ya tienen foto.
- **`SelloDestino`:** sello de pasaporte por destino, tinta única sobre transparente, pintado con `mask-image` y `currentColor` de un token (`text-acento`, `text-dusk-text`), así gira con el tema. En `SelectorDestino`, el boleto de `ResumenViaje` (se estampa al cambiar destino, `estampa`, 280 ms) y `SolicitudLista`.
- **`EstadoIlustrado`:** ilustración en una ventanilla `dusk` fija (igual en claro y oscuro): sin resultados, sin cupo, error, 404 y solicitud enviada. Siempre decorativa (`alt=""`); el texto del estado sigue diciendo todo.
- **Fondos `dusk`:** panorámicas de bajo contraste detrás de bandas `dusk` (footer, cabecera del catálogo) con velo en degradado desde `dusk` sobre el lado del texto y capa `[contain:strict]`.
- **Portadas:** solo para destinos sin ninguna foto real, marcadas `generada: true` en el manifiesto y aprobadas por el dueño antes de publicar. Hoy todos los destinos tienen foto: no hay ninguna.

**The Real-Photo Rule.** Lo que se vende (hotel, habitación, destino con foto) se muestra con foto real. El arte generado acompaña; nunca representa un producto.

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
