'use strict';

// Ruleta tipo brújula: 12 gajos con los premios reales, giro cosmético, el resultado ya llegó fijo en `result`.
// Estilo corporativo plano: colores de marca desde los tokens de :root, sin degradados ni luces.
// Capas: cara con colores y rótulos (pre-renderizada, gira) + íconos que laten (cada cuadro, giran con la cara)
// + aro y centro con logo (pre-renderizado, fijo) + resaltado del gajo ganador.
// Al lado, la vitrina de premios: se enciende la tarjeta del gajo bajo el puntero y la ganadora hace pop.
(() => {
  const L = window.L360;
  const POINTER = -Math.PI / 2; // el puntero está arriba
  const WINDUP_MS = 380;
  const WINDUP = 0.14;
  const SPIN_MS = 7000;
  const TURNS = 6;
  const SETTLE_MS = 1100;
  const IDLE_SPEED = 0.08; // rad/s mientras espera
  // Solcito se pone nervioso cuando la ruleta ya pasa gajo a gajo (~7 por segundo con easeOutQuart).
  // Desde ahí también se enciende la vitrina: antes pasarían demasiados gajos por segundo.
  const MASCOT_NERVOUS_AT = 0.45;
  const MASCOT_PEEK_AT = 0.8; // último tramo: se tapa los ojos y espía entre los dedos
  const MASCOT_SAY = { spin: '¡Wiii!', nervous: '¿Será…?', peek: '¡No puedo mirar!' };
  // Latido en espera: una ola recorre la rueda y cada ícono crece un poco al pasar.
  const WAVE_MS = 3000;
  const WAVE_BUMP = 0.12;
  const WAVE_SCALE = 0.14;
  const POP_MS = 520; // el ícono ganador crece al parar
  const POP_SCALE = 0.4;
  const MARK_AT = 0.83; // radio del ícono (fracción de R); rótulo y subrótulo hacia el centro
  const TITLE_AT = 0.66;
  const SUB_AT = 0.555;
  const FONT = 'Figtree, "Segoe UI", sans-serif';
  const TAU = Math.PI * 2;
  const mod = (a, n) => ((a % n) + n) % n;
  const easeOutBack = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

  // Premios reales por id (config.json y config-cima.json). Solo estética, nunca pesos.
  // fill/ink = tokens de :root; icon = icons.js o badge (texto grande); name/detail = tarjeta de la vitrina.
  const PRIZES = {
    // ---- premios de la web (generado por web/build.mjs; ids = juegos_premios) ----
    'descuento-2': { tier: 'coupon', fill: '--gold-soft', ink: '--dusk', badge: '2%', title: 'GIFT CARD', sub: 'DESCUENTO', name: 'Descuento 2 %', detail: 'En tu próxima compra' },
    'descuento-5': { tier: 'coupon', fill: '--gold', ink: '--dusk', badge: '5%', title: 'GIFT CARD', sub: 'DESCUENTO', name: 'Descuento 5 %', detail: 'En tu próxima compra' },
    'gira-otra-vez': { tier: 'retry', fill: '--sand', ink: '--seafoam-deep', icon: 'repeat', title: 'GIRA', sub: 'OTRA VEZ', name: 'Gira otra vez', detail: 'Un giro más', stamp: '¡OTRA VEZ!' },
    'cotizacion-prioritaria': { tier: 'small', fill: '--seafoam', ink: '--text', icon: 'plane', title: 'COTIZACIÓN', sub: 'PRIORITARIA', name: 'Cotización prioritaria', detail: 'Te atendemos primero' },
    'guia-digital': { tier: 'small', fill: '--seafoam-deep', ink: '--text', icon: 'compass', title: 'GUÍA', sub: 'DIGITAL', name: 'Guía digital', detail: 'O fondo de pantalla' },
    margarita: { tier: 'big', fill: '--orange', ink: '--btn-ink', icon: 'suitcase', title: 'ESTADÍA', sub: '3 NOCHES', name: 'Estadía 3 noches', detail: 'Margarita o Mérida' },
    tucacas: { tier: 'big', fill: '--seafoam', ink: '--text', icon: 'boat', title: 'FULL DAY', sub: 'PARA 2', name: 'Full day para 2', detail: 'Colonia Tovar o Cayos' },
    'cupon-nacional': { tier: 'coupon', fill: '--gold', ink: '--dusk', badge: '10%', title: 'GIFT CARD', sub: 'DESCUENTO', name: 'Gift card 10%', detail: 'En cualquier compra' },
    'cupon-internacional': { tier: 'coupon', fill: '--gold-soft', ink: '--dusk', badge: '5%', title: 'GIFT CARD', sub: 'DESCUENTO', name: 'Gift card 5%', detail: 'En cualquier compra' },
    obsequio: { tier: 'small', fill: '--seafoam-deep', ink: '--text', icon: 'gift', title: 'SOUVENIR', sub: 'LOTUS 360', name: 'Souvenir', detail: 'De la agencia' },
    'otro-intento': { tier: 'retry', fill: '--sand', ink: '--seafoam-deep', icon: 'repeat', title: 'INTENTE', sub: 'DE NUEVO', name: 'Intente de nuevo', detail: 'Otro giro', stamp: '¡OTRA VEZ!' },
    'sigue-participando': { tier: 'fallback', fill: '--dusk-2', ink: '--text-soft', icon: 'sun', title: '¡CASI!' },
    'souvenir-plantado': { tier: 'small', fill: '--seafoam-deep', ink: '--text', icon: 'gift', title: 'SOUVENIR', sub: 'LOTUS 360', name: 'Souvenir', detail: 'De la agencia' },
    'souvenir-cima': { tier: 'small', fill: '--seafoam-deep', ink: '--text', icon: 'gift', title: 'SOUVENIR', sub: 'LOTUS 360', name: 'Souvenir', detail: 'De la agencia' },
    // Snack de Munchy (patrocinio del evento): un id por motor, como los souvenirs.
    munchy: { tier: 'small', fill: '--berry', ink: '--dusk', icon: 'snack', title: 'MUNCHY', sub: 'SNACK', name: 'Snack Munchy', detail: 'Para picar ya' },
    'munchy-plantado': { tier: 'small', fill: '--berry', ink: '--dusk', icon: 'snack', title: 'MUNCHY', sub: 'SNACK', name: 'Snack Munchy', detail: 'Para picar ya' },
    'munchy-cima': { tier: 'small', fill: '--berry', ink: '--dusk', icon: 'snack', title: 'MUNCHY', sub: 'SNACK', name: 'Snack Munchy', detail: 'Para picar ya' },
    // Cima: la gift card ya es suya (no va en la rueda); "Tercer intento" suma un giro.
    'tercer-intento': { tier: 'retry', fill: '--gold', ink: '--dusk', icon: 'repeat', title: 'TERCER', sub: 'INTENTO', name: 'Tercer intento', detail: 'Un giro más', stamp: '¡+1 GIRO!' },
  };
  // Orden de gajos: mismo premio en lados opuestos y nunca dos colores parecidos juntos.
  const WHEELS = {
    web: {
      // 6 gajos de 60°: con los 12 del stand el rótulo no cabe en una rueda de ~330 px.
      slices: ['descuento-2', 'guia-digital', 'gira-otra-vez', 'cotizacion-prioritaria', 'descuento-5', 'sigue-participando'],
      showcase: ['descuento-5', 'descuento-2', 'gira-otra-vez', 'cotizacion-prioritaria', 'guia-digital'],
    },
    main: {
      slices: ['margarita', 'cupon-internacional', 'munchy', 'tucacas', 'cupon-nacional', 'obsequio',
        'margarita', 'sigue-participando', 'cupon-internacional', 'tucacas', 'munchy', 'cupon-nacional'],
      // 18-sep evento: sin reintentos (peso 0) y un solo ¡CASI! (solo sale con Margarita bloqueada o algo agotado).
      showcase: ['margarita', 'tucacas', 'cupon-nacional', 'cupon-internacional', 'munchy', 'obsequio'],
    },
    cima: {
      slices: ['margarita', 'munchy-cima', 'souvenir-cima', 'munchy-cima', 'tucacas', 'sigue-participando',
        'margarita', 'munchy-cima', 'souvenir-cima', 'munchy-cima', 'tucacas', 'souvenir-cima'],
      showcase: ['margarita', 'tucacas', 'munchy-cima', 'souvenir-cima'],
    },
    // Giro de regalo de quien se planta: la rueda de la Brújula sin el cupón que ya ganó
    // (n1 ya tiene el de 5%, n2 el de 10%) y con el souvenir de stock propio del plantado.
    'plantado-n1': {
      slices: ['margarita', 'cupon-nacional', 'munchy-plantado', 'tucacas', 'munchy-plantado', 'souvenir-plantado',
        'margarita', 'sigue-participando', 'cupon-nacional', 'tucacas', 'munchy-plantado', 'souvenir-plantado'],
      showcase: ['margarita', 'tucacas', 'cupon-nacional', 'munchy-plantado', 'souvenir-plantado'],
    },
    // Consuelo de quien pierde en N3: la Brújula sin el cupón de 5% que ya conserva.
    'consuelo-n3': {
      slices: ['margarita', 'munchy', 'cupon-nacional', 'tucacas', 'munchy', 'obsequio',
        'margarita', 'sigue-participando', 'cupon-nacional', 'tucacas', 'munchy', 'obsequio'],
      showcase: ['margarita', 'tucacas', 'cupon-nacional', 'munchy', 'obsequio'],
    },
    'plantado-n2': {
      slices: ['margarita', 'cupon-internacional', 'munchy-plantado', 'tucacas', 'munchy-plantado', 'souvenir-plantado',
        'margarita', 'sigue-participando', 'cupon-internacional', 'tucacas', 'munchy-plantado', 'souvenir-plantado'],
      showcase: ['margarita', 'tucacas', 'cupon-internacional', 'munchy-plantado', 'souvenir-plantado'],
    },
  };

  function tokens() {
    const css = getComputedStyle(document.documentElement);
    return (name) => css.getPropertyValue(name).trim();
  }

  function tierFor(result) {
    if (result.retryToken) return 'retry';
    if (result.tier === 'big') return 'big';
    if (result.tier === 'coupon') return 'coupon';
    if (result.tier === 'small') return 'small';
    return 'fallback';
  }

  // Gajo del premio que salió; si el id no está en la rueda (config cambiada), uno del mismo tier.
  function pickSliceIndex(slices, result) {
    const byId = slices.map((id, i) => (id === result.prizeId ? i : -1)).filter((i) => i >= 0);
    const tier = tierFor(result);
    const byTier = slices.map((id, i) => (PRIZES[id].tier === tier ? i : -1)).filter((i) => i >= 0);
    const pool = byId.length ? byId : byTier.length ? byTier : slices.map((_, i) => i);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function geometry(S) {
    const rim = S * 0.03;
    return { c: S / 2, R: S / 2 - rim, rim, hub: S * 0.12 };
  }

  function makeLayer(size) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.max(1, Math.round(size * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas, ctx };
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function iconImage(name, color) {
    const svg = L.icon(name);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '128');
    svg.setAttribute('height', '128');
    svg.setAttribute('stroke', color);
    svg.setAttribute('stroke-width', '2');
    return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`);
  }

  // Textura de la gift card con esquinas redondeadas, lista para drawImage en cada cuadro.
  function roundedCard(img) {
    const w = 256;
    const h = Math.round((w * 200) / 340);
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d');
    if (g.roundRect) {
      g.beginPath();
      g.roundRect(0, 0, w, h, w * 0.05);
      g.clip();
    }
    g.drawImage(img, 0, 0, w, h);
    return cv;
  }

  function circle(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
  }

  // Texto centrado que se achica hasta caber en el ancho del gajo a ese radio.
  function fitText(ctx, text, weight, px, maxW, y) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    ctx.letterSpacing = `${Math.round(px * 0.06)}px`;
    const w = ctx.measureText(text).width;
    if (w > maxW) {
      const f = Math.max(8, Math.floor((px * maxW) / w));
      ctx.font = `${weight} ${f}px ${FONT}`;
      ctx.letterSpacing = `${Math.round(f * 0.06)}px`;
    }
    ctx.fillText(text, 0, y);
  }

  // Destello de 4 puntas centrado en (x, y).
  function sparkle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  }

  // Cara giratoria: gajos planos por premio, rótulo y subrótulo hacia el centro, separadores claros.
  // lux (la cima): premios gordos con relieve y borde dorado; "¡CASI!" más apagado.
  function renderFace(S, slices, tok, lux) {
    const { canvas, ctx } = makeLayer(S);
    const { c, R } = geometry(S);
    const seg = TAU / slices.length;
    const chord = (r) => 2 * r * Math.sin(seg / 2) * 0.84;
    ctx.translate(c, c);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    slices.forEach((id, i) => {
      const st = PRIZES[id];
      const a0 = i * seg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a0, a0 + seg);
      ctx.closePath();
      ctx.fillStyle = tok(st.fill);
      ctx.fill();
      if (lux && st.tier === 'big') {
        const g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
        g.addColorStop(0, 'rgba(11, 24, 28, 0.3)');
        g.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
        g.addColorStop(1, 'rgba(255, 255, 255, 0.18)');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.save();
        ctx.clip(); // solo la mitad interior del trazo: borde dorado dentro del gajo
        ctx.strokeStyle = tok('--gold');
        ctx.lineWidth = S * 0.014;
        ctx.stroke();
        ctx.restore();
      } else if (lux && st.tier === 'fallback') {
        ctx.fillStyle = 'rgba(11, 24, 28, 0.3)';
        ctx.fill();
      }

      ctx.save();
      ctx.rotate(a0 + seg / 2);
      ctx.translate(R * MARK_AT, 0);
      ctx.rotate(Math.PI / 2); // "arriba" del contenido apunta hacia el borde; +y va hacia el centro
      ctx.fillStyle = tok(st.ink);
      if (lux && st.tier === 'fallback') ctx.globalAlpha = 0.7;
      fitText(ctx, st.title, 800, Math.max(14, Math.round(S * 0.03)), chord(R * TITLE_AT), R * (MARK_AT - TITLE_AT));
      if (st.sub) {
        ctx.globalAlpha = 0.78;
        fitText(ctx, st.sub, 700, Math.max(10, Math.round(S * 0.019)), chord(R * SUB_AT), R * (MARK_AT - SUB_AT));
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    });
    // Separadores encima de todos los gajos para que tengan el mismo grosor.
    ctx.strokeStyle = tok('--card');
    ctx.lineWidth = Math.max(2, S * 0.005);
    for (let i = 0; i < slices.length; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(i * seg) * R, Math.sin(i * seg) * R);
      ctx.stroke();
    }
    return canvas;
  }

  // Marco fijo: aro claro y centro con el logo. lux (la cima): bisel dorado con marcas de brújula.
  function renderFrame(S, logo, tok, lux) {
    const { canvas, ctx } = makeLayer(S);
    const { c, R, rim, hub } = geometry(S);
    ctx.translate(c, c);

    if (lux) {
      const g = ctx.createLinearGradient(-R, -R, R, R);
      [[0, '--gold-soft'], [0.3, '--gold'], [0.55, '--gold-soft'], [0.8, '--gold'], [1, '--gold-soft']]
        .forEach(([at, name]) => g.addColorStop(at, tok(name)));
      ctx.strokeStyle = g;
    } else {
      ctx.strokeStyle = tok('--card');
    }
    ctx.lineWidth = rim;
    circle(ctx, R + rim / 2);
    ctx.stroke();

    if (lux) {
      ctx.strokeStyle = tok('--btn-ink');
      ctx.lineCap = 'round';
      for (let i = 0; i < 48; i += 1) {
        const a = (i / 48) * TAU;
        const len = rim * (i % 4 === 0 ? 0.55 : 0.3);
        ctx.globalAlpha = i % 4 === 0 ? 0.5 : 0.3;
        ctx.lineWidth = Math.max(1, S * (i % 4 === 0 ? 0.0035 : 0.002));
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (R + rim * 0.22), Math.sin(a) * (R + rim * 0.22));
        ctx.lineTo(Math.cos(a) * (R + rim * 0.22 + len), Math.sin(a) * (R + rim * 0.22 + len));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.lineCap = 'butt';
      ctx.strokeStyle = tok('--card');
      ctx.lineWidth = Math.max(1.5, S * 0.004);
      circle(ctx, R);
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowColor = 'rgba(11, 24, 28, 0.45)';
    ctx.shadowBlur = S * 0.03;
    ctx.shadowOffsetY = S * 0.006;
    ctx.fillStyle = tok('--card');
    circle(ctx, hub);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = tok('--gold');
    ctx.lineWidth = Math.max(2, S * 0.005);
    circle(ctx, hub * 0.84);
    ctx.stroke();
    if (logo) {
      const ls = hub * 1.1;
      ctx.drawImage(logo, -ls / 2, -ls / 2, ls, ls);
    }
    return canvas;
  }

  // Vitrina lateral: una tarjeta por premio con ícono que flota (CSS).
  // lux (la cima): los premios gordos van primero a todo el ancho, con rótulo "Premio mayor" y brillo.
  function buildShowcase(ids, lux) {
    const tiles = new Map();
    const el = L.el('div', { class: `prize-case${lux ? ' lux' : ''}` });
    ids.forEach((id, i) => {
      const st = PRIZES[id];
      const major = lux && st.tier === 'big';
      // Gift card: la tarjeta impresa animada (giftcard.js) en vez del "10%" suelto.
      const pct = st.badge ? L.giftCard.pctOf(st.badge) : null;
      const mark = pct ? L.giftCard.create({ pct, mini: true, mode: 'lite' })
        : st.badge ? L.el('b', { class: 'prize-badge' }, st.badge) : L.icon(st.icon);
      const tile = L.el('div', { class: `prize-tile${major ? ' major' : ''}${pct ? ' has-card' : ''}`, 'data-id': id, style: `--fill:var(${st.fill});--ink:var(${st.ink});--i:${i}` },
        major ? L.el('span', { class: 'prize-sheen' }) : null,
        L.el('span', { class: `prize-mark${pct ? ' card' : ''}` }, mark),
        L.el('span', { class: 'prize-text' },
          major ? L.el('small', { class: 'prize-major' }, '★ Premio mayor') : null,
          L.el('b', { class: 'prize-name' }, st.name),
          L.el('small', { class: 'prize-detail' }, st.detail)),
      );
      tiles.set(id, tile);
      el.append(tile);
    });
    let lit = null;
    return {
      el,
      light(id) {
        const tile = tiles.get(id) || null;
        if (tile === lit) return;
        if (lit) lit.classList.remove('lit');
        if (tile) tile.classList.add('lit');
        lit = tile;
      },
      win(id) {
        this.light(null);
        el.classList.add('done');
        const tile = tiles.get(id);
        if (!tile) return;
        tile.classList.add('won');
        tile.append(L.el('span', { class: 'prize-stamp' }, PRIZES[id].stamp || '¡TUYO!'));
      },
    };
  }

  L.games.brujula = {
    title: 'Brújula del viajero',
    tagline: 'Gira la brújula y descubre tu destino.',
    icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="24" cy="24" r="19"/><path d="M31 17l-5 12-12 5 5-12z" fill="currentColor" stroke="none"/><circle cx="24" cy="24" r="2.4" fill="currentColor" stroke="none"/></svg>',

    // copy (opcional, la cima de la escalera): {eyebrow, title, lead} del panel lateral.
    // wheel: 'main' (Brújula) | 'cima' (ruleta de viajes de la escalera).
    mount(stage, { result, nombre, onRevealStart, onDone, copy = {}, wheel = 'main' }) {
      const tok = tokens();
      const { slices, showcase: caseIds } = WHEELS[wheel] || WHEELS.main;
      const lux = wheel === 'cima';
      const N = slices.length;
      const SEG = TAU / N;
      const S = Math.round(Math.min((stage.clientHeight || window.innerHeight * 0.75) * 1.05, window.innerWidth * 0.86));
      const { c, R } = geometry(S);
      const canvas = L.el('canvas', { class: 'wheel-canvas' });
      const ctx = L.fitCanvas(canvas, S, S);
      const pointer = L.svg(`<svg class="wheel-pointer" viewBox="0 0 40 54" style="width:${Math.round(S * 0.075)}px;height:${Math.round(S * 0.1)}px;top:${-Math.round(S * 0.035)}px">
        <path d="M20 52 4 19C0 9 9 2 20 2s20 7 16 17z"/><circle cx="20" cy="17" r="5"/></svg>`);
      const wrap = L.el('div', { class: `wheel-wrap${lux ? ' lux' : ''}`, style: `width:${S}px;height:${S}px` }, pointer, canvas);
      const spin = L.el('button', { class: 'btn btn-primary btn-xl' }, 'Girar');
      const lead = L.el('p', { class: 'lead' }, copy.lead || 'Un solo giro. Estos son los premios:');
      const mascot = L.mascot ? L.mascot.create() : null;
      const showcase = buildShowcase(caseIds, lux);
      const side = L.el('div', { class: 'side-panel with-case' },
        mascot ? mascot.el : null,
        L.el('div', { class: 'eyebrow' }, copy.eyebrow || `${L.firstName(nombre)}, es tu turno`),
        L.el('h2', { class: 'title' }, copy.title || 'Gira y descubre tu premio'),
        lead,
        showcase.el,
        spin,
      );
      stage.append(L.el('div', { class: 'brujula' }, wrap, side));

      const inks = {};
      for (const id of new Set(slices)) inks[id] = tok(PRIZES[id].ink);
      const icons = {};
      const cards = {}; // gift cards: la tarjeta impresa (giftcard.js) como textura con esquinas redondeadas
      let face = renderFace(S, slices, tok, lux);
      let frameLayer = renderFrame(S, null, tok, lux);
      [...new Set(slices)].filter((id) => PRIZES[id].badge && L.giftCard.pctOf(PRIZES[id].badge))
        .forEach((id) => L.giftCard.image(L.giftCard.pctOf(PRIZES[id].badge), 256).then((img) => { if (img) cards[id] = roundedCard(img); }));
      Promise.all([...new Set(slices)].filter((id) => PRIZES[id].icon)
        .map((id) => iconImage(PRIZES[id].icon, inks[id]).then((img) => { icons[id] = img; })))
        .then(() => (document.fonts ? document.fonts.ready : null))
        .then(() => { face = renderFace(S, slices, tok, lux); });
      loadImage('media/logo.png').then((logo) => { frameLayer = renderFrame(S, logo, tok, lux); });
      // Destellos de los premios gordos (cima): 3 por gajo, cada uno con su fase fija.
      const sparkles = [];
      if (lux) {
        slices.forEach((id, i) => {
          if (PRIZES[id].tier !== 'big') return;
          [[0.86, -0.36], [0.86, 0.36], [0.42, 0]].forEach(([r, off]) => {
            const a = (i + 0.5 + off) * SEG;
            sparkles.push({ x: Math.cos(a) * R * r, y: Math.sin(a) * R * r, phase: sparkles.length * 2.1 });
          });
        });
      }
      const sparkleColor = tok('--card');

      let mode = 'idle'; // idle | spin | win
      let rotation = Math.random() * TAU;
      let winIdx = -1;
      let winAt = 0;
      let last = performance.now();
      const iconSize = S * 0.085;
      const badgePx = Math.round(S * 0.058);
      const cardW = S * 0.15;
      const cardH = (cardW * 200) / 340;

      function slicePath(i) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, i * SEG, (i + 1) * SEG);
        ctx.closePath();
      }

      // Ícono (o badge "5%") del gajo i, escalado desde su centro.
      function drawMark(i, scale) {
        const id = slices[i];
        const st = PRIZES[id];
        ctx.save();
        ctx.rotate((i + 0.5) * SEG);
        ctx.translate(R * MARK_AT, 0);
        ctx.rotate(Math.PI / 2);
        ctx.scale(scale, scale);
        if (lux && st.tier === 'fallback') ctx.globalAlpha = 0.7;
        if (cards[id]) {
          ctx.drawImage(cards[id], -cardW / 2, -cardH / 2, cardW, cardH);
        } else if (st.badge) {
          ctx.fillStyle = inks[id];
          ctx.font = `800 ${badgePx}px ${FONT}`;
          ctx.letterSpacing = '0px';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(st.badge, 0, 0);
        } else if (icons[id]) {
          ctx.drawImage(icons[id], -iconSize / 2, -iconSize / 2, iconSize, iconSize);
        }
        ctx.restore();
      }

      function wave(now, i) {
        const p = mod(now / WAVE_MS - i / N, 1);
        return p < WAVE_BUMP ? 1 + WAVE_SCALE * Math.sin((p / WAVE_BUMP) * Math.PI) : 1;
      }

      function draw(now) {
        ctx.clearRect(0, 0, S, S);
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(rotation);
        ctx.drawImage(face, -c, -c, S, S);
        for (let i = 0; i < N; i += 1) {
          if (mode === 'win' && i === winIdx) continue;
          drawMark(i, mode === 'idle' ? wave(now, i) : 1);
        }
        if (sparkles.length) {
          ctx.fillStyle = sparkleColor;
          for (const p of sparkles) {
            const tw = Math.sin(now / 700 + p.phase);
            if (tw < 0.05) continue;
            ctx.globalAlpha = tw;
            sparkle(ctx, p.x, p.y, S * 0.016 * (0.4 + 0.6 * tw));
          }
          ctx.globalAlpha = 1;
        }
        if (mode === 'win') {
          const k = Math.min(1, (now - winAt) / 450);
          for (let i = 0; i < N; i += 1) {
            if (i === winIdx) continue;
            slicePath(i);
            ctx.fillStyle = `rgba(11, 24, 28, ${0.55 * k})`;
            ctx.fill();
          }
          slicePath(winIdx);
          ctx.globalAlpha = k;
          ctx.strokeStyle = tok('--card');
          ctx.lineWidth = S * 0.008;
          ctx.stroke();
          ctx.globalAlpha = 1;
          drawMark(winIdx, 1 + POP_SCALE * easeOutBack(Math.min(1, (now - winAt) / POP_MS)));
        }
        ctx.restore();
        ctx.drawImage(frameLayer, 0, 0, S, S);
      }

      function idle(now) {
        if (!canvas.isConnected || mode !== 'idle') return;
        rotation += ((now - last) / 1000) * IDLE_SPEED;
        last = now;
        draw(now);
        requestAnimationFrame(idle);
      }
      requestAnimationFrame(idle);
      if (mascot) {
        setTimeout(() => { if (mode === 'idle') mascot.say('¡Gira conmigo!'); }, 500);
        spin.addEventListener('pointerenter', () => { if (mode === 'idle') mascot.hover(true); });
        spin.addEventListener('pointerleave', () => { if (mode === 'idle') mascot.hover(false); });
      }

      L.onPress(spin, () => {
        onRevealStart();
        L.busy = true;
        spin.disabled = true;
        lead.textContent = 'Buena suerte…';
        mode = 'spin';
        if (mascot) mascot.mood('ready', '¡Vamos!');
        let mascotPhase = 'ready';

        winIdx = pickSliceIndex(slices, result);
        const offset = 0.2 + Math.random() * 0.6;
        const from = rotation;
        const base = from + TAU * TURNS;
        // Ángulo final: el gajo elegido queda bajo el puntero (arriba).
        const to = base + mod(POINTER - (winIdx + offset) * SEG - base, TAU);
        const start = performance.now();
        let lastSlice = Math.floor(mod(POINTER - rotation, TAU) / SEG);
        let lastTick = 0;

        const frame = (now) => {
          if (!canvas.isConnected) return;
          const el = now - start;
          const t = (el - WINDUP_MS) / SPIN_MS;
          if (el < WINDUP_MS) {
            rotation = from - WINDUP * L.easeInOutCubic(el / WINDUP_MS);
          } else {
            rotation = from - WINDUP + (to - from + WINDUP) * L.easeOutQuart(Math.min(1, t));
          }
          const phase = el < WINDUP_MS ? 'ready' : t < MASCOT_NERVOUS_AT ? 'spin' : t < MASCOT_PEEK_AT ? 'nervous' : 'peek';
          if (mascot && phase !== mascotPhase) mascot.mood(phase, MASCOT_SAY[phase]);
          mascotPhase = phase;
          const slice = Math.floor(mod(POINTER - rotation, TAU) / SEG);
          if (t >= MASCOT_NERVOUS_AT) showcase.light(slices[slice]);
          if (slice !== lastSlice && now - lastTick > 45) {
            if (mascot && (mascotPhase === 'nervous' || mascotPhase === 'peek')) mascot.tick();
            lastSlice = slice;
            lastTick = now;
            pointer.classList.remove('tick');
            void pointer.offsetWidth;
            pointer.classList.add('tick');
            if (L.sound) L.sound.play('tick');
          }

          if (el < WINDUP_MS + SPIN_MS) {
            draw(now);
            requestAnimationFrame(frame);
            return;
          }
          rotation = to;
          mode = 'win';
          winAt = now;
          // Gajo que quedó bajo el puntero, medido con la misma fórmula del tic (lo revisan los humos).
          wrap.dataset.landed = slices[Math.floor(mod(POINTER - rotation, TAU) / SEG)];
          showcase.win(slices[winIdx]);
          if (mascot) mascot.react(tierFor(result));
          const settle = (ts) => {
            if (!canvas.isConnected) return;
            draw(ts);
            if (ts - winAt < SETTLE_MS) {
              requestAnimationFrame(settle);
              return;
            }
            // Cuadro final estático: la tarjeta con desenfoque va encima y no conviene redibujar debajo.
            L.busy = false;
            onDone();
          };
          requestAnimationFrame(settle);
        };
        requestAnimationFrame(frame);
      }, { allowBusy: true });
    },
  };
})();
