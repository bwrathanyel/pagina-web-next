'use strict';

// Utilidades compartidas. Todo el azar de este archivo y de los juegos es cosmético:
// el premio ya viene decidido por el servidor antes de cualquier animación.
(() => {
  const L = (window.L360 = window.L360 || {});
  L.games = {};
  L.busy = false;

  L.el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style') node.style.cssText = v;
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return node;
  };

  // SVG estático (íconos propios, nunca texto de usuario).
  L.svg = (markup) => {
    const t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  };

  L.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  L.easeOutQuart = (t) => 1 - (1 - t) ** 4;
  L.easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  L.firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';
  L.plain = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

  L.store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* sin almacenamiento */ } },
  };

  L.api = async (method, url, body, pin) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, {
        method,
        signal: ctrl.signal,
        headers: { 'content-type': 'application/json', ...(pin ? { 'x-admin-pin': pin } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const isJson = (res.headers.get('content-type') || '').includes('json');
      const data = isJson ? await res.json() : await res.text();
      if (!res.ok) {
        const err = new Error((data && data.message) || 'Algo salió mal. Intenta de nuevo.');
        err.code = data && data.error;
        err.status = res.status;
        throw err;
      }
      return data;
    } catch (e) {
      if (e.name === 'AbortError' || e instanceof TypeError) {
        const err = new Error('El servidor no responde. Revisa que la ventana del servidor siga abierta.');
        err.code = 'sin_servidor';
        throw err;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };

  // Tolerancia a clics errados: solo cuenta si se presiona y se suelta sobre el mismo
  // elemento, se ignora un segundo toque en menos de 600 ms y todo mientras hay animación.
  let lastPress = 0;
  const click = () => { if (L.sound) L.sound.play('tap'); };
  // gapMs: juegos de ritmo rápido (memoria, rompecabezas) acortan la pausa entre toques.
  L.onPress = (node, handler, { allowBusy = false, silent = false, gapMs = 600 } = {}) => {
    let pressed = false;
    node.addEventListener('pointerdown', (e) => {
      pressed = e.button === 0;
    });
    node.addEventListener('pointerleave', () => { pressed = false; });
    node.addEventListener('pointercancel', () => { pressed = false; });
    node.addEventListener('pointerup', (e) => {
      if (!pressed || e.button !== 0) return;
      pressed = false;
      if (node.disabled || node.getAttribute('aria-disabled') === 'true') return;
      if (L.busy && !allowBusy) return;
      const now = performance.now();
      if (now - lastPress < gapMs) return;
      lastPress = now;
      if (!silent) click();
      handler(e);
    });
    node.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.repeat || node.disabled || (L.busy && !allowBusy)) return;
      e.preventDefault();
      if (!silent) click();
      handler(e);
    });
  };

  L.toast = (message, ms = 4200) => {
    const t = document.getElementById('toast');
    t.textContent = message;
    t.hidden = false;
    clearTimeout(L.toast.timer);
    L.toast.timer = setTimeout(() => { t.hidden = true; }, ms);
  };

  // Kiosco: sin menú contextual, zoom, arrastres, selección ni navegación atrás.
  L.installGuards = () => {
    const block = (e) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('selectstart', (e) => {
      if (!(e.target instanceof Element) || !e.target.closest('input, textarea')) e.preventDefault();
    });
    window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && ['+', '-', '=', '0', 'p', 's', 'o', 'r', 'f', 'u'].includes(k)) e.preventDefault();
      if (['f5', 'f3', 'f7', 'browserback', 'browserforward'].includes(k)) e.preventDefault();
      if (e.altKey && (k === 'arrowleft' || k === 'arrowright')) e.preventDefault();
    });
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => history.pushState(null, '', location.href));
    document.addEventListener('mouseup', (e) => { if (e.button === 3 || e.button === 4) e.preventDefault(); });
  };

  // Canvas nítido en pantallas con escala (DPR) y tamaño en CSS px.
  L.fitCanvas = (canvas, width, height) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  };

  L.logo = new Image();
  L.logo.src = 'media/logo.png';
})();
;
'use strict';

// Íconos propios: 24×24, trazo 1.6 con puntas redondas, color heredado (currentColor).
// Ilustraciones SVG de destino para fondos y tarjetas. Todo estático, nunca texto de usuario.
(() => {
  const L = window.L360;

  const PATHS = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    envelope: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    ticket: '<path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1z"/><path d="M15 6.8v10.4" stroke-dasharray="1.6 2"/>',
    board: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M6.5 13h5M6.5 16.5h5M14.5 13h3M14.5 16.5h3"/>',
    plane: '<path d="M21 3L3 10.5l7 3L13.5 21z"/><path d="M21 3L10 13.5"/>',
    umbrella: '<path d="M21 12a9 9 0 0 0-18 0z"/><path d="M12 12v6.5a2 2 0 0 0 4 0"/><path d="M12 3v1"/>',
    palm: '<path d="M12 21c0-5 .6-9 2-12"/><path d="M14 9c-2-3-6-3.5-8.5-1.5 2.5 0 5 .5 8.5 1.5zM14 9c1.5-3 5-4 7.5-2.5-2.5.3-5 1.2-7.5 2.5zM14 9c-.5-2.5-2.5-4.5-5-5 1.5 1.5 3 3 5 5z"/><path d="M5 21h14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    sunset: '<path d="M3 17c2 0 2-1.5 4.5-1.5S9.5 17 12 17s2.5-1.5 4.5-1.5S19 17 21 17M6 20.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/><path d="M6.5 13a5.5 5.5 0 0 1 11 0"/><path d="M12 3.5v2M5.2 6.2l1.3 1.3M18.8 6.2l-1.3 1.3"/>',
    wave: '<path d="M2.5 9.5c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2M2.5 15.5c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
    snack: '<path d="M6.5 5.5h11l.7 2.5-.7 8.5.7 2.5H5.8l.7-2.5-.7-8.5z"/><path d="M6.5 5.5 6 3.5h12l-.5 2M6.5 16.5 6 20.5h12l-.5-4"/><circle cx="12" cy="11.5" r="2.4"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8c-1-3-5-4-5-1.5C7 8 12 8 12 8zM12 8c1-3 5-4 5-1.5C17 8 12 8 12 8z"/>',
    percent: '<path d="M18.5 5.5l-13 13"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".7" fill="currentColor" stroke="none"/>',
    suitcase: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M8.5 7.5v-2A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5v2M3 12.5h18M10 12.5v2h4v-2"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M7.5 12h9"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    sparkles: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    click: '<path d="M9.5 9.5l10 4-4.3 1.5-1.7 4.5z"/><path d="M5 4.5l1.3 1.3M3.5 9.5h1.8M9.5 3.5v1.8M13.2 5.2l-1.2 1.2"/>',
    arrow: '<path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5"/>',
    repeat: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    mountain: '<path d="M2.5 19.5l6.5-11 4 6.5 2.5-3.5 6 8z"/><path d="M6.8 12.2l2.2 1.3 2-1.3"/>',
    waterfall: '<path d="M3 5.5h18"/><path d="M8 5.5v9M12 5.5v12M16 5.5v9"/><path d="M4.5 19c1.5 0 2-1 3.5-1s2 1 4 1 2.5-1 4-1 2 1 3.5 1"/>',
    boat: '<path d="M12 3.5v13"/><path d="M12 4.5l6.5 10H12z"/><path d="M11 7.5l-5 7h5"/><path d="M3.5 17.5h17l-2.5 3h-12z"/>',
    fish: '<path d="M3 12c3-4.5 9-6 14-2.5L21 7v10l-4-2.5C12 18 6 16.5 3 12z"/><circle cx="8" cy="11.2" r=".9" fill="currentColor" stroke="none"/>',
    chalet: '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5M7.5 12.5h2M14.5 12.5h2"/>',
    dune: '<path d="M2.5 17.5c2.5-4 5.5-6 9-6s6.5 2 10 6"/><path d="M2.5 20.5h19"/><circle cx="17" cy="6" r="2"/>',
    volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  };

  L.icon = (name, cls = '') => L.svg(
    `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`,
  );

  // Escena de atardecer en la playa: cielo, sol con franjas, mar y palmera.
  let uid = 0;
  L.beachScene = (cls = '') => {
    const id = `bs${++uid}`;
    return L.svg(`
<svg class="${cls}" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#12262b"/><stop offset=".45" stop-color="#6b3a3a"/>
      <stop offset=".62" stop-color="#e2733a"/><stop offset=".7" stop-color="#fbc000"/>
    </linearGradient>
    <linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3e827d"/><stop offset="1" stop-color="#0b181c"/>
    </linearGradient>
    <linearGradient id="${id}sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff1b8"/><stop offset="1" stop-color="#fc9a00"/>
    </linearGradient>
    <clipPath id="${id}clip"><rect x="0" y="0" width="390" height="590"/></clipPath>
  </defs>
  <rect width="390" height="844" fill="url(#${id}sky)"/>
  <g clip-path="url(#${id}clip)">
    <circle class="scene-sun" cx="195" cy="560" r="120" fill="url(#${id}sun)"/>
    <g fill="#e2733a" opacity=".55"><rect x="60" y="520" width="270" height="7"/><rect x="60" y="545" width="270" height="10"/><rect x="60" y="572" width="270" height="14"/></g>
  </g>
  <rect y="590" width="390" height="254" fill="url(#${id}sea)"/>
  <g class="scene-waves" stroke="#fbc000" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M40 630h90M200 650h140M90 690h120M250 720h80M30 760h110"/>
  </g>
  <g fill="#0b181c">
    <path d="M300 844c-8-120-4-230 26-330l10 3c-26 100-30 206-22 327z"/>
    <path d="M331 512c-40-40-110-44-150-10 50-6 100 2 150 14zM331 512c30-44 96-58 140-30-50 2-96 12-140 34zM331 512c-6-46-40-80-86-88 30 26 58 56 86 90zM331 512c16-40 56-64 100-62-40 14-72 34-100 64zM331 512c-46-4-88 20-108 58 34-26 72-44 108-56z"/>
  </g>
</svg>`);
  };
})();
;
'use strict';

// Gift card de Lotus 360 dibujada en SVG, con la estética de las tarjetas impresas: 5% = cielo con
// nubes y regalo naranja; 10% = playa con palmeras y regalo azul y amarillo. Todo el movimiento es CSS
// (transform/opacity, ver .gc en styles.css); el SVG es solo dibujo.
//   create({ pct, code, mode }) -> nodo DOM. mode: 'full' (todo se mueve) | 'lite' (solo el brillo) | 'still'.
//   image(pct, px) -> Promise<Image|null> estática (para canvas, sin textos chicos).
// El % viene del premio ("Gift card 10%"); si no se puede leer, quien llama usa su ícono de siempre.
(() => {
  const L = window.L360;
  const W = 340;
  const H = 200;
  let uid = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  const THEMES = {
    sky: {
      lid: '#f5a41c', body: '#f5a41c', ribbon: '#2b3c8c', band: '#f5a41c', bow: '#f5a41c', medal: '#1f2b66', peak: '#ffffff',
      brand: '#f5a41c', box: '#ffffff', ink: '#1f2b66',
    },
    beach: {
      lid: '#1d2b63', body: '#f2b31b', ribbon: '#1d2b63', band: '#2b3b80', bow: '#1d2b63', medal: '#ffffff', peak: '#1d2b63',
      brand: '#ffffff', box: '#ffffff', ink: '#1d2b63',
    },
  };

  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="6" rx="36" ry="12" fill="#b9cffc" opacity=".55"/>`
    + '<g fill="#fff"><ellipse rx="34" ry="12"/><circle cx="-14" cy="-9" r="14"/><circle cx="6" cy="-15" r="18"/><circle cx="24" cy="-6" r="12"/></g></g>';

  const frond = (x, y, a, l) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 0Q${l * 0.5} ${-l * 0.34} ${l} 0Q${l * 0.5} ${-l * 0.02} 0 0Z"/>`;

  const palm = (bx, by, tx, ty, s, delay) => `<g class="gc-palm" style="transform-origin:${bx}px ${by}px;animation-delay:${delay}s">`
    + `<path d="M${bx} ${by}C${bx - 10} ${by - (by - ty) * 0.5} ${tx + 12} ${ty + (by - ty) * 0.3} ${tx} ${ty}" stroke="#c8b48c" stroke-width="${(3.6 * s).toFixed(1)}" fill="none" stroke-linecap="round"/>`
    + `<g fill="#2c9440">${[-165, -125, -70, -20, 25, 160].map((a, i) => frond(tx, ty, a, (i % 2 ? 24 : 27) * s)).join('')}</g>`
    + `<g fill="#1d7431">${[-145, -45, 8].map((a) => frond(tx, ty, a, 20 * s)).join('')}</g></g>`;

  const spark = (x, y, k) => `<g transform="translate(${x} ${y})"><path class="gc-spark" style="animation-delay:${-k * 0.9}s" fill="#fff" d="M0-6Q0 0 6 0Q0 0 0 6Q0 0-6 0Q0 0 0-6Z"/></g>`;

  function background(theme, id) {
    if (theme === 'sky') {
      return `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#2f4fd0"/><stop offset=".55" stop-color="#1c2f9a"/><stop offset="1" stop-color="#10195f"/></linearGradient></defs>`
        + `<rect width="${W}" height="${H}" fill="url(#${id}b)"/>`
        + `<g class="gc-drift">${cloud(58, 92, 1.3)}${cloud(28, 40, 0.8)}${cloud(120, 150, 0.7)}</g>`
        + `<g class="gc-drift gc-rev">${cloud(282, 66, 1.45)}${cloud(300, 128, 0.9)}${cloud(232, 22, 0.7)}</g>`
        + `<rect y="112" width="${W}" height="88" fill="url(#${id}o)"/>`
        + `<defs><linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10195f" stop-opacity="0"/><stop offset="1" stop-color="#10195f" stop-opacity=".82"/></linearGradient></defs>`;
    }
    return `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8f7"/><stop offset="1" stop-color="#5cc3ea"/></linearGradient>`
      + `<linearGradient id="${id}w" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#22b0e3"/><stop offset=".5" stop-color="#1279c6"/><stop offset="1" stop-color="#0b2f86"/></linearGradient>`
      + `<linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2f86" stop-opacity="0"/><stop offset="1" stop-color="#0b2f86" stop-opacity=".85"/></linearGradient></defs>`
      + `<rect width="${W}" height="${H}" fill="url(#${id}w)"/><rect width="${W}" height="48" fill="url(#${id}s)"/>`
      + `<g fill="#fff">${[[34, 74, 40], [70, 96, 30], [20, 122, 26], [96, 66, 22]].map(([x, y, w], k) => `<rect class="gc-glint" style="--k:${k}" x="${x}" y="${y}" width="${w}" height="2.4" rx="1.2"/>`).join('')}</g>`
      + `<path d="M${W} 76C314 84 298 112 262 152L${W} 164Z" fill="#efe9d6"/>`
      + `${palm(326, 132, 240, 32, 1, 0)}${palm(336, 124, 324, 56, 0.8, -2.4)}`
      + `<rect y="100" width="${W}" height="100" fill="url(#${id}o)"/>`;
  }

  // Regalo con lazo y el sello de Lotus (montaña sobre olas) en la cinta.
  function gift(t) {
    return '<g class="gc-gift">'
      + `<g fill="${t.bow}"><ellipse cx="150" cy="26" rx="19" ry="10" transform="rotate(-14 150 26)"/><ellipse cx="190" cy="26" rx="19" ry="10" transform="rotate(14 190 26)"/></g>`
      + `<rect x="118" y="36" width="104" height="24" rx="8" fill="${t.lid}"/>`
      + `<path d="M126 62h88v46a9 9 0 0 1-9 9h-70a9 9 0 0 1-9-9z" fill="${t.body}"/>`
      + `<rect x="126" y="58" width="88" height="4" fill="${t.ribbon}"/>`
      + `<path d="M158 30H182V116L170 104 158 116Z" fill="${t.band}" stroke="${t.ribbon}" stroke-width="3" stroke-linejoin="round"/>`
      + `<circle cx="170" cy="53" r="11.5" fill="${t.medal}"/>`
      + `<path d="M162 57l4.5-9 3.5 5 3.5-7 6 11z" fill="${t.peak}"/>`
      + `<path d="M161.5 60.5q2-2 4 0t4 0 4 0 4 0" fill="none" stroke="${t.peak}" stroke-width="1.4" stroke-linecap="round"/>`
      + '</g>';
  }

  function svg(pct, { code = '', mini = false } = {}) {
    const theme = pct >= 10 ? 'beach' : 'sky';
    const t = THEMES[theme];
    const id = `gc${(uid += 1)}`;
    const font = 'font-family="Arial Black, Arial, sans-serif" font-weight="900"';
    const txt = `${pct}%`;
    let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`;
    out += background(theme, id);
    out += `<g fill="#fff">${spark(96, 34, 0)}${spark(252, 92, 1)}${spark(226, 20, 2)}</g>`;
    out += gift(t);
    if (mini) {
      out += `<text x="170" y="192" text-anchor="middle" font-size="${txt.length > 2 ? 78 : 88}" fill="#fff" ${font}>${txt}</text>`;
    } else {
      out += `<text x="14" y="142" font-size="13" fill="#fff" letter-spacing="1.5" font-family="Arial, sans-serif" font-weight="800">VALOR</text>`;
      out += `<text x="12" y="188" font-size="${txt.length > 2 ? 42 : 52}" fill="#fff" ${font}>${txt}</text>`;
      out += `<text x="170" y="150" text-anchor="middle" font-size="16" fill="${t.brand}" letter-spacing="1.5" font-family="Arial, sans-serif" font-weight="800">LOTUS360</text>`;
      out += `<text x="170" y="170" text-anchor="middle" font-size="18" fill="${t.brand}" letter-spacing="1" font-family="Arial, sans-serif" font-weight="800">GIFT CARD</text>`;
      if (code) {
        out += `<rect x="238" y="132" width="90" height="52" rx="7" fill="${t.box}"/>`
          + `<text x="283" y="146" text-anchor="middle" font-size="7.5" fill="#6b7280" letter-spacing="1.5" font-family="Arial, sans-serif" font-weight="700">CÓDIGO</text>`
          + `<text x="283" y="172" text-anchor="middle" font-size="21" fill="${t.ink}" letter-spacing="2" font-family="Consolas, 'Courier New', monospace" font-weight="700">${esc(code)}</text>`;
      }
    }
    return `${out}</svg>`;
  }

  L.giftCard = {
    // "Gift card de 10% de descuento…" -> 10; null si no hay porcentaje.
    pctOf(text) {
      const m = /(\d{1,3})\s*%/.exec(String(text || ''));
      return m ? Number(m[1]) : null;
    },

    create({ pct, code = '', mode = 'full', mini = false }) {
      return L.el('div', { class: `gc gc-${pct >= 10 ? 'beach' : 'sky'} ${mode}${mini ? ' mini' : ''}`, role: 'img', 'aria-label': `Gift card ${pct}%` },
        L.svg(svg(pct, { code, mini })),
        mode === 'still' ? null : L.el('i', { class: 'gc-sheen' }));
    },

    // Imagen estática (para canvas): solo dibujo, sin animación.
    image(pct, px = 170) {
      const h = Math.round((px * H) / W);
      const markup = svg(pct, { mini: true }).replace('<svg ', `<svg width="${px}" height="${h}" `);
      return new Promise((resolve) => {
        const img = new Image(px, h);
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
      });
    },
  };
})();
;
'use strict';

// Sonido 100% sintetizado con Web Audio: groove R&B de turismo con capas por pantalla y efectos fijos.
// Todo es opcional: si el navegador no deja sonar, la experiencia visual queda completa.
(() => {
  const L = window.L360;
  const KEY = 'l360-audio';
  const settings = { music: true, sfx: true, musicVol: 0.55, sfxVol: 0.75, ...(L.store.get(KEY) || {}) };

  let ctx = null;
  let master, musicBus, duckBus, sfxBus, reverbIn, noise;
  let scratchGain = null;

  const midi = (n) => 440 * 2 ** ((n - 69) / 12);

  // Ruido con semilla fija (mulberry32): el reverb y cada golpe suenan igual en cada arranque.
  function seeded(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -16;
    master.ratio.value = 3;
    master.connect(ctx.destination);

    duckBus = ctx.createGain();
    duckBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = settings.music ? settings.musicVol : 0;
    musicBus.connect(duckBus);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = settings.sfx ? settings.sfxVol : 0;
    sfxBus.connect(master);

    // Reverb con respuesta al impulso sintética (ruido que decae): sala cálida, sin archivos.
    // Cola de 1,2 s (antes 2,6): la convolución es lo que más CPU gasta del audio en la laptop.
    const len = Math.floor(ctx.sampleRate * 1.2);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    const rnd = seeded(360);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * (1 - i / len) ** 3;
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    reverbIn = ctx.createGain();
    reverbIn.connect(conv).connect(wet).connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    return ctx;
  }

  const ready = () => ctx && ctx.state === 'running';

  // ---------- primitivas ----------

  // Envolvente percusiva: ataque corto y caída exponencial.
  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function out(node, bus, pan = 0, send = 0) {
    let last = node;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      last = last.connect(p);
    }
    last.connect(bus);
    if (send) {
      const s = ctx.createGain();
      s.gain.value = send;
      last.connect(s).connect(reverbIn);
    }
  }

  function osc(type, freq, t, stop) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.start(t);
    o.stop(stop);
    return o;
  }

  // Siempre el mismo tramo del ruido: cada golpe suena idéntico (nada al azar).
  function noiseSrc(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.start(t, 0, Math.min(dur, noise.duration));
    return s;
  }

  // Piano eléctrico FM: tono redondo con brillo inicial que se apaga.
  function epiano(t, note, vel, bus, { pan = 0, send = 0.25, decay = 1.8 } = {}) {
    const f = midi(note);
    const end = t + decay + 0.1;
    const car = osc('sine', f, t, end);
    const mod = osc('sine', f, t, end);
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(f * 1.1, t);
    modGain.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.5);
    mod.connect(modGain).connect(car.frequency);
    const g = ctx.createGain();
    env(g, t, vel, 0.006, decay);
    car.connect(g);
    out(g, bus, pan, send);
  }

  // Campana: parciales inarmónicos, para premios y detalles.
  function bell(t, note, vel, bus, { pan = 0, send = 0.5, decay = 1.6 } = {}) {
    const f = midi(note);
    [[1, 1], [2.76, 0.28], [5.4, 0.09]].forEach(([ratio, amp], i) => {
      const o = osc('sine', f * ratio, t, t + decay + 0.1);
      const g = ctx.createGain();
      env(g, t, vel * amp, 0.004, decay / (1 + i));
      o.connect(g);
      out(g, bus, pan, send);
    });
  }

  function noiseHit(t, dur, { type = 'bandpass', freq = 2000, q = 1, peak = 0.2, attack = 0.002, bus = sfxBus, pan = 0, send = 0 } = {}) {
    const s = noiseSrc(t, dur + 0.05);
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    env(g, t, peak, attack, dur);
    s.connect(f).connect(g);
    out(g, bus, pan, send);
    return f;
  }

  // ---------- kit playero: madera, marimba, sello, metales y platillo (en Fa, como la música) ----------

  // Bloque de madera: tono que cae apenas + clic de ruido. Toques y tic del reloj.
  function wood(t, freq, peak, decay) {
    const o = osc('triangle', freq, t, t + decay + 0.05);
    o.frequency.exponentialRampToValueAtTime(freq * 0.82, t + decay);
    const g = ctx.createGain();
    env(g, t, peak, 0.001, decay);
    o.connect(g);
    out(g, sfxBus);
    noiseHit(t, 0.006, { freq: freq * 2.6, q: 3, peak: peak * 0.45 });
  }

  // Marimba: fundamental redonda + parciales altos que se apagan enseguida (el golpe de la baqueta).
  function marimba(t, note, vel, { pan = 0, send = 0.15, decay = 0.45 } = {}) {
    const f = midi(note);
    [[1, 1, 1], [4, 0.14, 0.12], [9.9, 0.04, 0.05]].forEach(([ratio, amp, dk], i) => {
      const o = osc('sine', f * ratio, t, t + decay * dk + 0.05);
      const g = ctx.createGain();
      env(g, t, vel * amp, 0.002, decay * dk);
      o.connect(g);
      out(g, sfxBus, pan, i ? 0 : send);
    });
  }

  // Sello de pasaporte: golpe sordo del mango + goma contra el papel.
  function stamp(t, peak) {
    const o = osc('sine', 210, t, t + 0.2);
    o.frequency.exponentialRampToValueAtTime(62, t + 0.09);
    const g = ctx.createGain();
    env(g, t, peak, 0.002, 0.14);
    o.connect(g);
    out(g, sfxBus, 0, 0.08);
    noiseHit(t, 0.045, { type: 'lowpass', freq: 1300, peak: peak * 0.5 });
    noiseHit(t + 0.004, 0.018, { type: 'highpass', freq: 3800, q: 0.7, peak: peak * 0.18 });
  }

  // Metal de fanfarria: dos sierras apenas desafinadas con un filtro que se abre al atacar.
  function brass(t, note, vel, dur, { pan = 0, send = 0.3 } = {}) {
    const f = midi(note);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(f * 1.5, t);
    lp.frequency.exponentialRampToValueAtTime(f * 6, t + 0.05);
    lp.frequency.exponentialRampToValueAtTime(f * 3, t + 0.05 + Math.min(dur, 0.4));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.03);
    g.gain.linearRampToValueAtTime(vel * 0.75, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    [-6, 6].forEach((cents) => {
      const o = osc('sawtooth', f, t, t + dur + 0.25);
      o.detune.setValueAtTime(cents, t);
      o.connect(lp);
    });
    lp.connect(g);
    out(g, sfxBus, pan, send);
  }

  // Platillo: ruido agudo con cola larga al reverb + cuerpo corto.
  function cymbal(t, peak, dur) {
    noiseHit(t, dur, { type: 'highpass', freq: 6500, q: 0.6, peak, attack: 0.003, send: 0.35 });
    noiseHit(t, 0.25, { freq: 3800, q: 0.9, peak: peak * 0.6 });
  }

  // ---------- música "Ruta Caribe": groove R&B de turismo (~96 BPM) ----------
  // Todo fijo, sin azar: cada vuelta de 16 compases (40 s) suena idéntica. Cada capa tiene su
  // volumen y la pantalla elige la mezcla (mood) con fundidos, sin cortar el tema. Una capa en
  // silencio deja de programar notas (ahorra CPU en la laptop).

  const BPM = 96;
  const SIX = 60 / BPM / 4;   // semicorchea
  const SWING = SIX * 0.18;   // semicorcheas impares apenas atrasadas
  const STEPS = 16;           // semicorcheas por compás

  // Fa mayor. Voicings de piano eléctrico sin fundamental (la pone el bajo).
  const CH = {
    Bbmaj9: { bass: 46, notes: [62, 65, 69, 72] },
    Am7: { bass: 45, notes: [64, 67, 69, 72] },
    Gm9: { bass: 43, notes: [58, 62, 65, 69] },
    C9sus: { bass: 48, notes: [58, 62, 65, 67] },
    Dm9: { bass: 50, notes: [60, 64, 65, 69] },
    C13: { bass: 48, notes: [58, 62, 64, 69] },
  };
  // Parte A (8 compases) + parte B (8 compases), un acorde por compás.
  const FORM = ['Bbmaj9', 'Am7', 'Gm9', 'C9sus', 'Bbmaj9', 'Am7', 'Gm9', 'C9sus',
    'Dm9', 'Am7', 'Bbmaj9', 'C9sus', 'Dm9', 'Am7', 'Gm9', 'C13'].map((k) => CH[k]);

  const COMP = [[0, 0.065, 1.1], [6, 0.045, 0.3], [10, 0.055, 0.8], [14, 0.045, 0.3, true]]; // [semicorchea, fuerza, caída, anticipa el acorde que viene]
  const BASS = [[0, 3, 0], [3, 2, 0], [6, 1, 12], [8, 3, 7], [11, 2, 0], [14, 2, 12]];      // [semicorchea, duración, intervalo]
  const KICK = [0, 6, 8, 11];
  const CLAP = [4, 12];
  const HAT = [0.05, 0.018, 0.032, 0.02, 0.05, 0.018, 0.032, 0.02, 0.05, 0.018, 0.032, 0.02, 0.05, 0.018, 0, 0.02]; // 14 = abierto
  const SHAKER = [0.03, 0.015, 0.022, 0.015];
  const PALMAS = [7, 15];

  // Melodía de steel-drum, un compás por fila: [semicorchea, nota, duración].
  const HOOK = [
    [[2, 72, 2], [4, 74, 2], [6, 77, 3], [10, 74, 2], [12, 72, 3]],
    [[0, 69, 4], [6, 72, 2], [8, 76, 6]],
    [[2, 74, 2], [4, 77, 2], [6, 79, 3], [10, 77, 2], [12, 74, 3]],
    [[0, 77, 4], [6, 74, 2], [8, 72, 6]],
  ];
  const MELODY = [
    ...HOOK,
    HOOK[0], HOOK[1], HOOK[2], [[0, 77, 3], [4, 79, 3], [8, 81, 6]],
    [[4, 76, 2], [6, 77, 2], [8, 81, 6]],
    [[0, 79, 4], [6, 76, 2], [8, 72, 6]],
    [[2, 74, 2], [4, 77, 2], [6, 81, 3], [10, 79, 2], [12, 77, 3]],
    [[0, 79, 8], [12, 77, 2], [14, 79, 2]],
    [[0, 81, 4], [6, 77, 2], [8, 76, 2], [10, 74, 4]],
    [[0, 72, 8], [12, 69, 2], [14, 72, 2]],
    [[0, 74, 4], [6, 70, 2], [8, 74, 2], [10, 77, 4]],
    [[0, 76, 6], [8, 79, 2], [12, 81, 4]],
  ];

  // Mezclas por pantalla: full = espera/menú, game = jugando (sin batería ni melodía, más bajo),
  // cima = todo más palmas, shaker y steel-drum una octava arriba.
  const LAYERS = ['keys', 'bass', 'drums', 'hat', 'melody', 'extra'];
  // Reverb por capa y después de su volumen: al apagarse una capa no quedan colas sueltas.
  const SEND = { keys: 0.35, bass: 0, drums: 0.08, hat: 0, melody: 0.4, extra: 0.5 };
  const MOODS = {
    full: { level: 1, keys: 1, bass: 1, drums: 1, hat: 1, melody: 1, extra: 0 },
    game: { level: 0.65, keys: 0.85, bass: 0.8, drums: 0, hat: 0.6, melody: 0, extra: 0 },
    cima: { level: 1, keys: 1, bass: 1, drums: 1, hat: 1, melody: 1, extra: 1 },
  };
  let mood = 'full';
  let moodBus = null;
  const layer = {}; // nombre → { bus, send, until }: hasta cuándo se siguen programando notas
  let step = 0;
  let nextTime = 0;
  let timer = null;

  function applyMood(tau) {
    const m = MOODS[mood];
    const now = ctx.currentTime;
    moodBus.gain.cancelScheduledValues(now);
    moodBus.gain.setTargetAtTime(m.level, now, tau);
    for (const name of LAYERS) {
      const l = layer[name];
      l.bus.gain.cancelScheduledValues(now);
      l.bus.gain.setTargetAtTime(m[name], now, tau);
      l.send.gain.cancelScheduledValues(now);
      l.send.gain.setTargetAtTime(SEND[name] * m.level, now, tau);
      l.until = m[name] > 0 ? Infinity : now + tau * 6;
    }
  }

  function buildLayers() {
    if (moodBus) return;
    moodBus = ctx.createGain();
    moodBus.connect(musicBus);
    for (const name of LAYERS) {
      const bus = ctx.createGain();
      bus.gain.value = 0;
      bus.connect(moodBus);
      const send = ctx.createGain();
      send.gain.value = 0;
      bus.connect(send).connect(reverbIn);
      layer[name] = { bus, send, until: 0 };
    }
    hatVoice = noiseVoice(layer.hat.bus, 'highpass', 7500, 0.5, 0.25);
    shakerVoice = noiseVoice(layer.extra.bus, 'bandpass', 5500, 1.2, 0.4);
  }

  // Hi-hat y shaker: una sola fuente de ruido en bucle cada uno; cada golpe es solo una envolvente
  // (no crea nodos nuevos en cada semicorchea).
  let hatVoice = null;
  let shakerVoice = null;
  function noiseVoice(bus, type, freq, q, pan) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    s.connect(f).connect(g);
    out(g, bus, pan);
    s.start();
    return g;
  }

  const on = (name, t) => layer[name].until > t;

  // Steel-drum: parciales armónicos 1-2-3 que se apagan rápido, como un pan golpeado.
  function steel(t, note, vel, bus, { pan = 0, send = 0, decay = 0.6 } = {}) {
    const f = midi(note);
    [[1, 1, 1], [2, 0.45, 0.5], [3, 0.14, 0.3]].forEach(([ratio, amp, dk], i) => {
      const o = osc('sine', f * ratio, t, t + decay * dk + 0.1);
      const g = ctx.createGain();
      env(g, t, vel * amp, 0.003, decay * dk);
      o.connect(g);
      out(g, bus, pan, i ? 0 : send);
    });
  }

  function pad(t, chord, dur, bus) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.Q.value = 0.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.6);
    g.gain.setValueAtTime(0.045, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
    chord.notes.forEach((n, i) => {
      const o = osc('sawtooth', midi(n - 12), t, t + dur + 1.3);
      o.detune.value = i % 2 ? 6 : -6;
      o.connect(lp);
    });
    lp.connect(g);
    out(g, bus);
  }

  function bassNote(t, note, dur, bus) {
    const f = midi(note);
    const o = osc('sine', f, t, t + dur + 0.2);
    const o2 = osc('triangle', f * 2, t, t + dur + 0.2);
    const g = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.14;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.08, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    o.connect(g);
    o2.connect(g2).connect(g);
    out(g, bus);
  }

  function kick(t, peak, bus) {
    const k = osc('sine', 120, t, t + 0.35);
    k.frequency.exponentialRampToValueAtTime(48, t + 0.11);
    const g = ctx.createGain();
    env(g, t, peak, 0.003, 0.26);
    k.connect(g);
    out(g, bus);
  }

  // Palmas: dos golpes de ruido casi juntos, como varias manos.
  function clap(t, peak, bus, pan = 0) {
    noiseHit(t, 0.02, { freq: 1500, q: 0.8, peak: peak * 0.7, bus, pan });
    noiseHit(t + 0.012, 0.12, { freq: 1500, q: 0.8, peak, bus, pan });
  }

  function scheduleStep(s, t) {
    const bar = Math.floor(s / STEPS) % FORM.length;
    const i = s % STEPS;
    const chord = FORM[bar];

    if (on('keys', t)) {
      const bus = layer.keys.bus;
      if (i === 0) pad(t, chord, SIX * STEPS, bus);
      for (const [at, vel, decay, push] of COMP) {
        if (at !== i) continue;
        const c = push ? FORM[(bar + 1) % FORM.length] : chord;
        c.notes.forEach((n, k) => epiano(t + k * 0.01, n, vel, bus, { send: 0, decay }));
      }
    }

    if (on('bass', t)) {
      for (const [at, len, interval] of BASS) if (at === i) bassNote(t, chord.bass + interval, len * SIX, layer.bass.bus);
    }

    if (on('drums', t)) {
      if (KICK.includes(i)) kick(t, i === 0 ? 0.22 : 0.16, layer.drums.bus);
      if (CLAP.includes(i)) clap(t, 0.11, layer.drums.bus);
    }

    if (on('hat', t)) {
      if (i === 14) env(hatVoice, t, 0.04, 0.004, 0.16);
      else env(hatVoice, t, HAT[i], 0.002, 0.035);
    }

    const mel = on('melody', t);
    const extra = on('extra', t);
    if (mel || extra) {
      for (const [at, note, len] of MELODY[bar]) {
        if (at !== i) continue;
        const decay = 0.35 + len * 0.06;
        if (mel) steel(t, note, 0.075, layer.melody.bus, { decay });
        if (extra) steel(t, note + 12, 0.03, layer.extra.bus, { pan: -0.35, decay: decay * 0.8 });
      }
    }
    if (extra) {
      env(shakerVoice, t, SHAKER[i % 4], 0.01, 0.06);
      if (PALMAS.includes(i)) clap(t, 0.06, layer.extra.bus, -0.3);
    }
  }

  function tickMusic() {
    if (!ready()) return;
    while (nextTime < ctx.currentTime + 0.2) {
      scheduleStep(step, nextTime + (step % 2 ? SWING : 0));
      nextTime += SIX;
      step++;
    }
  }

  function startMusic() {
    if (timer || !settings.music || !ready()) return;
    buildLayers();
    applyMood(0.01);
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(tickMusic, 40);
  }

  function stopMusic() {
    clearInterval(timer);
    timer = null;
  }

  // ---------- efectos ----------

  // Un sonido fijo por acción (nada al azar). Los nombres viejos siguen andando para los juegos.
  const SFX = {
    tap(t) { wood(t, 1150, 0.16, 0.05); },                 // toque
    tick(t) { wood(t, 1900, 0.11, 0.022); },               // tic del reloj y de la rueda
    correct(t) {                                           // acierto: 2 notas de marimba que suben
      marimba(t, 77, 0.2, { pan: -0.1 });
      marimba(t + 0.085, 84, 0.2, { pan: 0.1 });
    },
    wrong(t) {                                             // fallo: bonk grave y suave
      const o = osc('sine', 175, t, t + 0.3);
      o.frequency.exponentialRampToValueAtTime(87, t + 0.16);
      const g = ctx.createGain();
      env(g, t, 0.2, 0.004, 0.22);
      o.connect(g);
      out(g, sfxBus);
      noiseHit(t, 0.03, { type: 'lowpass', freq: 600, peak: 0.06 });
    },
    levelup(t) {                                           // subir nivel: arpegio de steel-drum
      [77, 81, 84].forEach((n, i) => steel(t + i * 0.1, n, i === 2 ? 0.2 : 0.16, sfxBus, { pan: -0.25 + i * 0.25, send: 0.3, decay: 0.8 }));
    },
    stand(t) {                                             // plantarse: sello de pasaporte ("ka-chunk")
      stamp(t, 0.1);
      stamp(t + 0.14, 0.24);
    },
    lose(t) {                                              // perder: 2 notas suaves que bajan
      marimba(t, 72, 0.14, { send: 0.3, decay: 0.8 });
      marimba(t + 0.26, 65, 0.13, { send: 0.3, decay: 1.1 });
    },
    coupon(t) {                                            // cupón: chime + sello cuando aparece el código
      SFX.chime(t);
      stamp(t + 0.43, 0.24); // = REVEAL.coupon − REVEAL.prize en winner-card.js
    },
    cima(t) {                                              // cima: fanfarria larga + platillo
      [[0, 72, 0.1], [0.13, 72, 0.1], [0.26, 72, 0.1], [0.4, 77, 1.1]].forEach(([at, n, d]) => brass(t + at, n, 0.05, d));
      [65, 69, 72].forEach((n, i) => brass(t + 0.4, n, 0.035, 1.1, { pan: -0.3 + i * 0.3 }));
      kick(t + 0.4, 0.5, sfxBus);
      cymbal(t + 0.4, 0.07, 1.8);
      [77, 81, 84, 89].forEach((n, i) => steel(t + 0.7 + i * 0.08, n, 0.1, sfxBus, { pan: -0.3 + i * 0.2, send: 0.35, decay: 0.7 }));
      bell(t + 1.1, 89, 0.1, sfxBus, { decay: 2 });
    },
    press(t) {
      const o = osc('triangle', 540, t, t + 0.2);
      o.frequency.exponentialRampToValueAtTime(380, t + 0.08);
      const g = ctx.createGain();
      env(g, t, 0.16, 0.003, 0.12);
      o.connect(g);
      out(g, sfxBus, 0, 0.12);
    },
    whoosh(t) {
      const f = noiseHit(t, 0.5, { freq: 300, q: 0.9, peak: 0.08, attack: 0.18, send: 0.2 });
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.45);
    },
    tick(t) {
      noiseHit(t, 0.014, { freq: 3200, q: 2.2, peak: 0.22 });
      const o = osc('sine', 2100, t, t + 0.03);
      const g = ctx.createGain();
      env(g, t, 0.04, 0.001, 0.012);
      o.connect(g);
      out(g, sfxBus);
    },
    flap(t) {
      noiseHit(t, 0.02, { type: 'highpass', freq: 2000, q: 0.7, peak: 0.14 });
    },
    paper(t) {
      const f = noiseHit(t, 0.55, { freq: 2600, q: 0.6, peak: 0.07, attack: 0.08 });
      f.frequency.linearRampToValueAtTime(1700, t + 0.5);
    },
    seal(t) { stamp(t, 0.22); },
    rise(t) {
      const f = noiseHit(t, 1.3, { freq: 500, q: 1.2, peak: 0.05, attack: 1.1, send: 0.4 });
      f.frequency.exponentialRampToValueAtTime(5000, t + 1.2);
    },
    chime(t) {
      [77, 81, 84, 89].forEach((n, i) => bell(t + i * 0.09, n, 0.11, sfxBus, { pan: -0.3 + i * 0.2 }));
    },
    win(t) {                                               // premio grande: fanfarria + campanas
      [[0, 0.12], [0.16, 0.12], [0.32, 1.3]].forEach(([at, d]) => [65, 69, 72, 77].forEach((n, i) => brass(t + at, n, 0.03, d, { pan: -0.3 + i * 0.2 })));
      cymbal(t + 0.32, 0.06, 2);
      [77, 81, 84, 89, 93, 96].forEach((n, i) => bell(t + 0.45 + i * 0.1, n, 0.09, sfxBus, { pan: -0.4 + i * 0.16, decay: 2.2 }));
      noiseHit(t + 0.5, 1.8, { type: 'highpass', freq: 8000, q: 0.5, peak: 0.025, attack: 1.2, send: 0.6 });
    },
    soft(t) {
      epiano(t, 76, 0.09, sfxBus, { send: 0.45 });
      epiano(t + 0.28, 72, 0.08, sfxBus, { send: 0.45 });
    },
    retry(t) {                                             // otro intento
      [72, 77, 81].forEach((n, i) => epiano(t + i * 0.13, n, 0.09, sfxBus, { send: 0.4 }));
    },
  };

  // ---------- API ----------

  function applyVolumes() {
    if (!ctx) return;
    const now = ctx.currentTime;
    musicBus.gain.setTargetAtTime(settings.music ? settings.musicVol : 0, now, 0.3);
    sfxBus.gain.setTargetAtTime(settings.sfx ? settings.sfxVol : 0, now, 0.05);
  }

  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume().then(startMusic).catch(() => {});
    else startMusic();
  }

  L.sound = {
    play(name) {
      if (!settings.sfx || !ready() || !SFX[name]) return;
      try { SFX[name](ctx.currentTime + 0.005); } catch { /* el sonido nunca rompe la pantalla */ }
    },

    // Raspado continuo: llamar en cada movimiento con la intensidad (0..1).
    scratch(level) {
      if (!settings.sfx || !ready()) return;
      const now = ctx.currentTime;
      if (!scratchGain) {
        const s = ctx.createBufferSource();
        s.buffer = noise;
        s.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 2200;
        f.Q.value = 0.7;
        scratchGain = ctx.createGain();
        scratchGain.gain.value = 0;
        s.connect(f).connect(scratchGain).connect(sfxBus);
        s.start();
      }
      scratchGain.gain.cancelScheduledValues(now);
      scratchGain.gain.setTargetAtTime(Math.min(1, level) * 0.1, now, 0.02);
      scratchGain.gain.setTargetAtTime(0, now + 0.09, 0.05);
    },

    // Baja la música mientras se revela un resultado.
    duck(ms = 4000) {
      if (!ctx) return;
      const now = ctx.currentTime;
      duckBus.gain.cancelScheduledValues(now);
      duckBus.gain.setTargetAtTime(0.3, now, 0.15);
      duckBus.gain.setTargetAtTime(1, now + ms / 1000, 0.8);
    },

    // Mezcla de la música según la pantalla: 'full' (espera/menú), 'game' (jugando) o 'cima'.
    mood(name) {
      if (!MOODS[name] || name === mood) return;
      mood = name;
      if (ready() && moodBus) applyMood(0.5);
    },

    get settings() { return { ...settings }; },

    set(partial) {
      Object.assign(settings, partial);
      L.store.set(KEY, settings);
      applyVolumes();
      if (settings.music) startMusic();
      else stopMusic();
    },
  };

  // Con --autoplay-policy=no-user-gesture-required arranca solo; si no, con el primer clic.
  document.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      L.sound.set({ music: !settings.music });
      L.toast(settings.music ? 'Música activada' : 'Música en silencio', 1800);
    }
  });
  unlock();
})();
;
'use strict';

// Solcito: mascota plana hecha con el sol sobre el mar del logo. Solo acompaña: nunca decide ni
// adelanta nada que la ruleta no muestre ya. El estado vive en data-mood/eyes/mouth/arms y todas
// las animaciones están en styles.css (bloque "Solcito"), con tokens de :root.
(() => {
  const L = window.L360;
  let seq = 0;

  const MOODS = {
    idle: { eyes: 'normal', mouth: 'smile', arms: 'down' },
    ready: { eyes: 'happy', mouth: 'open', arms: 'up' },
    spin: { eyes: 'dizzy', mouth: 'open', arms: 'up' },
    nervous: { eyes: 'normal', mouth: 'o', arms: 'cheeks' },
    big: { eyes: 'star', mouth: 'open', arms: 'up' },
    happy: { eyes: 'happy', mouth: 'open', arms: 'up' },
    sad: { eyes: 'sad', mouth: 'flat', arms: 'down' },
    eager: { eyes: 'normal', mouth: 'open', arms: 'up' },
    peek: { eyes: 'normal', mouth: 'o', arms: 'cover' },
    wink: { eyes: 'wink', mouth: 'smile', arms: 'up' },
    love: { eyes: 'heart', mouth: 'open', arms: 'up' },
    twirl: { eyes: 'happy', mouth: 'open', arms: 'up' },
    wave: { eyes: 'happy', mouth: 'open', arms: 'wave' },
    look: { eyes: 'normal', mouth: 'smile', arms: 'down' },
    cool: { eyes: 'normal', mouth: 'smile', arms: 'down', acc: 'shades' },
  };

  // Reacción al parar, por tier del gajo: [estado, globo, chispas].
  const REACT = {
    big: ['big', '¡Te vas de viaje!', 22],
    coupon: ['wink', '¡Cupón!', 12],
    small: ['love', '¡Regalo!', 12],
    retry: ['twirl', '¡Otra vez!', 8],
    fallback: ['sad', '¡Casi!', 0],
  };
  // Gestos sueltos mientras nadie gira: [estado, globo, duración ms].
  const IDLE_ACTS = [
    ['wave', '¡Hola!', 1700],
    ['look', '¿Quién se anima?', 1900],
    ['wink', '¡Hay viajes!', 1500],
    ['cool', 'Modo vacaciones', 2400],
    ['twirl', '¡Gira como yo!', 1300],
  ];
  const IDLE_EVERY_MS = 4800;
  const CALM = new Set(['idle', ...IDLE_ACTS.map((a) => a[0])]);
  const SPARK_COLORS = ['--gold', '--orange', '--seafoam-soft', '--card'];
  const TURN_MS = 360; // = animación m-flip de styles.css

  const wave = (y) => `M0 ${y}q12 -7 24 0${'t24 0'.repeat(10)}`;

  function spiral(cx, cy) {
    return `M${cx + 1} ${cy}a1 1 0 1 1 2 0a3 3 0 1 1 -6 0a5 5 0 1 1 10 0a7 7 0 1 1 -14 0`;
  }

  function star(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 10; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join('L')}Z`;
  }

  function heart(cx, cy) {
    return `M${cx} ${cy + 8}C${cx - 13} ${cy - 1} ${cx - 8} ${cy - 12} ${cx} ${cy - 5}C${cx + 8} ${cy - 12} ${cx + 13} ${cy - 1} ${cx} ${cy + 8}Z`;
  }

  function rays() {
    let d = '';
    for (let i = 0; i < 12; i += 1) {
      const a = (i * Math.PI) / 6;
      const p = (r) => `${(110 + r * Math.cos(a)).toFixed(1)} ${(110 + r * Math.sin(a)).toFixed(1)}`;
      d += `M${p(95)}L${p(108)}`;
    }
    return d;
  }

  function arm(side, x0, cx, x1) {
    const d = `M${x0} 124Q${cx} 130 ${x1} 146`;
    return `<g class="m-arm m-arm-${side}"><path class="m-arm-edge" d="${d}"/><path class="m-arm-line" d="${d}"/><circle cx="${x1}" cy="146" r="8.5"/></g>`;
  }

  function template(id) {
    return `<svg class="mascot-svg" viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <linearGradient id="${id}-sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--gold)"/><stop offset="1" style="stop-color:var(--orange)"/></linearGradient>
        <clipPath id="${id}-clip"><circle cx="110" cy="110" r="62"/></clipPath>
      </defs>
      <ellipse class="m-shadow" cx="110" cy="204" rx="44" ry="7"/>
      <g class="m-body">
        <path class="m-rays" d="${rays()}"/>
        <circle class="m-ring" cx="110" cy="110" r="84"/>
        <circle cx="110" cy="110" r="62" fill="url(#${id}-sun)"/>
        <g class="m-sea" clip-path="url(#${id}-clip)"><path class="m-wave" d="${wave(150)}"/><path class="m-wave w2" d="${wave(163)}"/></g>
        <g class="m-face">
          <circle class="m-cheek" cx="74" cy="118" r="8"/><circle class="m-cheek" cx="146" cy="118" r="8"/>
          <g class="m-gaze">
          <g class="m-eyes m-eyes-wink"><path d="M82 103q8 -11 16 0"/><ellipse cx="130" cy="100" rx="7" ry="9.5"/><circle class="m-glint" cx="132.5" cy="96" r="2.6"/></g>
          <g class="m-eyes m-eyes-heart"><path class="m-heart" d="${heart(90, 100)}"/><path class="m-heart" d="${heart(130, 100)}"/></g>
          <g class="m-eyes m-eyes-normal">
            <g class="m-eye"><ellipse cx="90" cy="100" rx="7" ry="9.5"/><circle class="m-glint" cx="92.5" cy="96" r="2.6"/></g>
            <g class="m-eye"><ellipse cx="130" cy="100" rx="7" ry="9.5"/><circle class="m-glint" cx="132.5" cy="96" r="2.6"/></g>
          </g>
          <g class="m-eyes m-eyes-happy"><path d="M82 103q8 -11 16 0"/><path d="M122 103q8 -11 16 0"/></g>
          <g class="m-eyes m-eyes-dizzy"><path class="m-spiral" d="${spiral(90, 100)}"/><path class="m-spiral" d="${spiral(130, 100)}"/></g>
          <g class="m-eyes m-eyes-star"><path class="m-star" d="${star(90, 100, 12)}"/><path class="m-star" d="${star(130, 100, 12)}"/></g>
          <g class="m-eyes m-eyes-sad"><path d="M82 99q8 6 16 0"/><path d="M122 99q8 6 16 0"/></g>
          <g class="m-shades"><rect x="73" y="88" width="32" height="21" rx="8"/><rect x="115" y="88" width="32" height="21" rx="8"/><path d="M104 96h12M73 94l-9 -4M147 94l9 -4"/><path class="m-shades-glint" d="M80 93h9M122 93h9"/></g>
          </g>
          <path class="m-tear" d="M86 112q5 7 5 10a5 5 0 0 1 -10 0q0 -3 5 -10z"/>
          <path class="m-mouth m-mouth-smile" d="M98 117q12 13 24 0"/>
          <path class="m-mouth m-mouth-open" d="M95 115h30q0 20 -15 20t-15 -20z"/>
          <ellipse class="m-mouth m-mouth-o" cx="110" cy="124" rx="6" ry="7"/>
          <path class="m-mouth m-mouth-flat" d="M100 128q10 -8 20 0"/>
        </g>
        <g class="m-blush"><ellipse cx="78" cy="128" rx="12" ry="7"/><ellipse cx="142" cy="128" rx="12" ry="7"/><path d="M72 124l-3 6M79 124l-3 6M86 124l-3 6M138 124l-3 6M145 124l-3 6M152 124l-3 6"/></g>
        <g class="m-bum">
          <path class="m-bum-line" d="M110 140q-3 16 0 28M77 156q15 19 32 10M111 166q17 9 32 -10"/>
          <ellipse class="m-bum-shine" cx="90" cy="150" rx="7" ry="4"/><ellipse class="m-bum-shine" cx="130" cy="150" rx="7" ry="4"/>
          <path class="m-thong" d="M52 136Q110 150 168 136"/><path class="m-thong-v" d="M99 142h22l-11 15z"/>
        </g>
        <g class="m-short">
          <path class="m-short-body" d="M53 122H167L166 150Q164 170 140 170H116L110 154L104 170H80Q56 170 54 150Z"/>
          <path class="m-short-band" d="M54 122h112v9h-112z"/>
          <path class="m-short-line" d="M62 132l-2 34M158 132l2 34M106 131q-2 8 -6 11M114 131q2 8 6 11"/>
        </g>
        ${arm('l', 52, 36, 26)}
        ${arm('r', 168, 184, 194)}
        <path class="m-drop" d="M166 64q8 11 8 16a8 8 0 0 1 -16 0q0 -5 8 -16z"/>
      </g>
    </svg>`;
  }

  // opts.acts: gestos de espera propios de la pantalla (mismo formato que IDLE_ACTS).
  function create(opts = {}) {
    const acts = opts.acts || IDLE_ACTS;
    seq += 1;
    const svg = L.svg(template(`mascot${seq}`));
    const fx = L.el('div', { class: 'mascot-fx' });
    const fig = L.el('div', { class: 'mascot-fig' }, svg, fx);
    const bubble = L.el('div', { class: 'mascot-bubble' });
    const el = L.el('div', { class: 'mascot' }, fig, bubble);
    let tiltLeft = false;
    let lastTick = 0;
    let actTimer = 0;
    let actIdx = Math.floor(Math.random() * acts.length);
    let gazeRaf = 0;
    let turnTimer = 0;

    function say(text) {
      bubble.classList.remove('show');
      if (!text) return;
      bubble.textContent = text;
      void bubble.offsetWidth;
      bubble.classList.add('show');
    }

    function mood(name, text) {
      const m = MOODS[name];
      clearTimeout(actTimer);
      Object.assign(el.dataset, { mood: name, eyes: m.eyes, mouth: m.mouth, arms: m.arms, acc: m.acc || '' });
      if (text !== undefined) say(text);
    }

    // Estado pasajero que vuelve solo a la espera (si nadie lo cambió antes).
    function act(name, text, ms) {
      mood(name, text);
      actTimer = setTimeout(() => { if (el.dataset.mood === name) mood('idle', ''); }, ms);
    }

    // Mouse sobre el botón Girar: se entusiasma (solo si está tranquilo).
    function hover(on) {
      if (on && CALM.has(el.dataset.mood)) mood('eager', '¡Dale, gira!');
      else if (!on && el.dataset.mood === 'eager') mood('idle', '');
    }

    // Los ojos siguen al mouse (máx. 6 unidades del viewBox); el CSS decide en qué estados se ve.
    function onMove(e) {
      if (gazeRaf) return;
      gazeRaf = requestAnimationFrame(() => {
        gazeRaf = 0;
        const r = fig.getBoundingClientRect();
        if (!r.width) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.45);
        const k = 6 / Math.max(60, Math.hypot(dx, dy));
        el.style.setProperty('--gx', (dx * k).toFixed(2));
        el.style.setProperty('--gy', (dy * k * 0.7).toFixed(2));
      });
    }
    document.addEventListener('pointermove', onMove);

    const idleLoop = setInterval(() => {
      if (!el.isConnected) {
        clearInterval(idleLoop);
        document.removeEventListener('pointermove', onMove);
        return;
      }
      if (el.dataset.mood !== 'idle') return;
      const [name, text, ms] = acts[actIdx];
      actIdx = (actIdx + 1) % acts.length;
      act(name, text, ms);
    }, IDLE_EVERY_MS);

    // Cabeceo alterno con cada gajo que pasa bajo el puntero (cuando la ruleta ya va lenta).
    function tick() {
      const now = performance.now();
      if (now - lastTick < 90) return;
      lastTick = now;
      tiltLeft = !tiltLeft;
      fig.classList.remove('tilt-l', 'tilt-r');
      void fig.offsetWidth;
      fig.classList.add(tiltLeft ? 'tilt-l' : 'tilt-r');
    }

    function sparks(n) {
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        const d = 7 + Math.random() * 7;
        const s = L.el('i', { class: i % 2 ? 'mascot-spark round' : 'mascot-spark' });
        s.style.setProperty('--dx', `${(Math.cos(a) * d).toFixed(2)}rem`);
        s.style.setProperty('--dy', `${(Math.sin(a) * d).toFixed(2)}rem`);
        s.style.setProperty('--c', `var(${SPARK_COLORS[i % SPARK_COLORS.length]})`);
        fx.append(s);
        setTimeout(() => s.remove(), 950);
      }
    }

    function react(tier) {
      const [name, text, n] = REACT[tier] || REACT.fallback;
      mood(name, text);
      if (!n) return;
      sparks(n);
      if (name === 'big') setTimeout(() => sparks(n), 520);
    }

    // Chiste del short (solo lo dispara la espera, attract.js): 'back' | 'drop' | 'blush' | 'up' | '' (sin chiste).
    function gag(state) {
      if (state) { el.dataset.gag = state; return; }
      clearTimeout(turnTimer);
      delete el.dataset.gag;
      fig.classList.remove('flip'); // si queda, el giro se repite al volver a meterlo en el DOM
    }

    // Se da vuelta (scaleX 1→0→1) y cambia de cara a mitad del giro.
    function turn(fn) {
      clearTimeout(turnTimer);
      fig.classList.remove('flip');
      void fig.offsetWidth;
      fig.classList.add('flip');
      turnTimer = setTimeout(fn, TURN_MS / 2);
    }

    mood('idle');
    return { el, mood, say, tick, react, act, hover, gag, turn };
  }

  L.mascot = { create };
})();
;
'use strict';

// Motor de cliente compartido para la escalera de 3 niveles (memoria, rompecabezas, aterriza).
// El servidor decide status/nivel/premio en cada POST; aquí solo se corre el reloj, se muestran
// las pantallas intermedias y se llama a /api/run/*. La cima se muestra reutilizando la Brújula:
// el resultado ya viene fijado por el servidor antes de que gire.
(() => {
  const L = window.L360;
  const DECISION_LOCK_MS = 600; // tolerancia a clics errados en la pantalla de decisión
  const LOST_MS = 3200; // cuánto se ve el aviso de derrota antes del giro de consuelo
  const CIMA_SPINS = 2; // giros de la cima (src/ladder.js); "Tercer intento" suma uno

  function screen(stage, ...nodes) {
    stage.replaceChildren(...nodes);
  }

  const SPARKS = ['var(--gold)', 'var(--orange)', 'var(--seafoam-soft)', 'var(--card)'];

  // Ráfaga de chispas planas en (x%, y%) de `fx` (capa absoluta), que se limpia sola.
  function sparkBurst(fx, x, y, count) {
    const nodes = [];
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const d = 9 + Math.random() * 12;
      const s = 1 + Math.random() * 1.1;
      nodes.push(L.el('i', {
        class: `fx-spark${i % 3 === 2 ? ' round' : ''}`,
        style: `left:${x}%;top:${y}%;width:${s}rem;height:${s}rem;background:${SPARKS[i % 4]};--dx:${(Math.cos(a) * d).toFixed(2)}rem;--dy:${(Math.sin(a) * d).toFixed(2)}rem;--r:${Math.round(Math.random() * 360)}deg`,
      }));
    }
    fx.append(...nodes);
    setTimeout(() => nodes.forEach((node) => node.remove()), 900);
  }

  // Intentos que le quedan (null si el juego no los usa), para el aviso del nivel y la decisión.
  function livesText(v) {
    if (v.lives == null) return null;
    const word = v.lives === 1 ? 'intento' : 'intentos';
    if (v.livesBonus) return `¡Intento extra! Tienes ${v.lives} ${word}`;
    return v.passed === 0 ? `Tienes ${v.lives} ${word} en total` : `Te quedan ${v.lives} ${word}`;
  }

  // Aviso sobre la escena ya armada, sin clics: nivel + regla corta + 3-2-1. El juego no arranca
  // (ni acepta toques) hasta que termina; el tiempo del nivel se mide desde ahí.
  function countdown(gameStage, n, text, first, lives) {
    return new Promise((resolve) => {
      // Un segundo justo por número: el 3-2-1 dura 3 s de verdad. Antes el primer nivel iba a
      // 1300 ms (3,9 s) y el dueño lo sentía eterno frente al "3" de la pantalla.
      const stepMs = 1000;
      const num = L.el('div', { class: 'ladder-count-num' }, '3');
      gameStage.append(L.el('div', { class: 'ladder-count' },
        L.el('div', { class: 'ladder-count-card' },
          L.el('div', { class: 'eyebrow' }, `Nivel ${n} de 3`),
          L.el('h2', { class: 'title' }, text),
          lives ? L.el('p', { class: 'ladder-count-lives' }, lives) : null,
          first ? L.el('p', { class: 'lead' }, lives
            ? 'Si se acaban los intentos o el tiempo, pierdes lo que no hayas asegurado.'
            : 'Si fallas o se acaba el tiempo, pierdes lo que no hayas asegurado.') : null,
          num,
        ),
      ));
      let left = 3;
      const timer = setInterval(() => {
        left -= 1;
        if (left > 0) {
          num.textContent = String(left);
          num.classList.remove('pop');
          void num.offsetWidth;
          num.classList.add('pop');
          return;
        }
        clearInterval(timer);
        num.closest('.ladder-count').remove();
        resolve();
      }, stepMs);
    });
  }

  // Gestos de Solcito mientras nadie decide (reemplazan los de la ruleta: nada de "¡Gira!").
  const DECISION_ACTS = [
    ['wink', '¡Tú puedes!', 1500],
    ['look', '¿Qué eliges?', 1900],
    ['wave', '¡Vas muy bien!', 1700],
    ['cool', 'Modo campeón', 2400],
  ];
  const DECISION_HELLO_MS = 2400; // festejo de entrada antes de calmarse

  // Entre niveles: tarjeta con Solcito y el logo a la izquierda; a la derecha el nivel superado,
  // lo que viene, los intentos (un avión por intento) y los dos botones, de una línea cada uno.
  // Solcito duda sobre "Plantarme" y se entusiasma sobre "Seguir".
  function decision(stage, { n, banked, next, nextText, lives, livesLeft, livesBonus, livesIcon, keep, left }) {
    return new Promise((resolve) => {
      const mascot = L.mascot.create({ acts: DECISION_ACTS });
      const fx = L.el('div', { class: 'summit-fx' });
      const option = (cls, verb, prize) => L.el('button', { class: `btn ${cls} btn-xl decide-btn`, disabled: true },
        L.el('b', {}, verb), L.el('span', { class: 'decide-prize' }, prize));
      const cashout = option('btn-secondary', 'Plantarme', banked.short);
      const keepGoing = option('btn-primary', 'Seguir', next.short);
      // Los aviones planean al entrar, uno tras otro (--i escalona el retardo en CSS).
      const planes = livesLeft == null ? null : L.el('div', { class: `runway-lives decide-lives${livesBonus ? ' bonus' : ''}` },
        L.el('div', { class: 'runway-lives-row' },
          ...Array.from({ length: livesLeft }, (_, i) => L.el('i', { class: 'on', style: `--i:${i}` }, L.icon(livesIcon || 'plane')))),
        L.el('span', {}, lives));
      // Sello que cae sobre el premio de plantarse: dice lo mismo que el botón, sin prometer de más.
      const stamp = L.el('span', { class: 'decide-stamp' }, 'Si te plantas', L.el('b', {}, banked.short));
      const hero = L.el('div', { class: 'decide-hero' },
        L.el('div', { class: 'decide-logo' }, L.el('img', { src: 'media/logo.png', alt: '' })),
        mascot.el,
      );

      screen(stage, L.el('div', { class: 'decide' },
        hero,
        L.el('div', { class: 'decide-body' },
          L.el('div', { class: 'eyebrow' }, `Nivel ${n} de 3 superado`, L.icon('check'), stamp),
          L.el('h2', { class: 'title' }, '¿Te plantas o ', L.el('em', {}, 'sigues'), '?'),
          L.el('p', { class: 'decide-next' }, L.el('span', {}, 'Próximo'), nextText),
          planes,
          L.el('div', { class: 'decide-actions' }, cashout, keepGoing),
          L.el('p', { class: 'decide-warn' }, left > 0
            ? `Si sigues y pierdes, vuelves al menú con ${triesText(left)} más.`
            : keep
              ? `Si sigues y pierdes, conservas tu ${keep.short} y un giro.`
              : 'Si sigues y pierdes, te quedas solo con un giro.'),
        ),
        fx,
      ));

      mascot.mood('happy', '¡Vas muy bien!');
      if (L.sound) L.sound.play('levelup');
      setTimeout(() => sparkBurst(fx, 14, 28, 14), 120);
      setTimeout(() => sparkBurst(fx, 14, 62, 12), 520);
      setTimeout(() => { if (mascot.el.dataset.mood === 'happy') mascot.mood('idle', ''); }, DECISION_HELLO_MS);

      // Solcito además se inclina hacia el botón que tiene el mouse encima (rotate/translate, sin filtros).
      const react = (btn, name, text, lean) => {
        btn.addEventListener('pointerenter', () => { mascot.mood(name, text); hero.dataset.lean = lean; });
        btn.addEventListener('pointerleave', () => {
          if (hero.dataset.lean === lean) delete hero.dataset.lean;
          if (mascot.el.dataset.mood === name) mascot.mood('idle', '');
        });
      };
      react(cashout, 'look', '¿Seguro?', 'stay');
      react(keepGoing, 'eager', next.tier === 'cima' ? '¡Vamos por el viaje!' : '¡Vamos por más!', 'go');

      setTimeout(() => { cashout.disabled = false; keepGoing.disabled = false; }, DECISION_LOCK_MS);
      const pick = (choice, other) => () => { other.disabled = true; resolve(choice); };
      // Plantarse suena a sello de pasaporte en vez del toque.
      L.onPress(cashout, () => { if (L.sound) L.sound.play('stand'); pick('cashout', keepGoing)(); }, { silent: true });
      L.onPress(keepGoing, pick('continue', cashout));
    });
  }

  // Oportunidades que quedan después de esta partida (0 = es la última).
  const triesLeft = (v) => Math.max(0, (v.oportunidades || 1) - (v.oportunidad || 1));
  const triesText = (k) => (k === 1 ? '1 oportunidad' : `${k} oportunidades`);

  // Derrota sobre la escena del choque: nunca con las manos vacías. Con oportunidades por delante
  // avisa que vuelve al menú; en la última, el giro de consuelo (y lo que conserva si fue en el
  // nivel 3). Pasa solo, sin botón.
  function lost(gameStage, n, keep, left = 0) {
    return new Promise((resolve) => {
      let lead = keep
        ? `Conservas tu ${keep.short} y te llevas un giro en la ruleta.`
        : 'No te vas con las manos vacías: te llevas un giro en la ruleta.';
      if (left > 0) lead = `Te ${left === 1 ? 'queda' : 'quedan'} ${triesText(left)}: elige un juego y vuelve a intentarlo.`;
      gameStage.append(L.el('div', { class: 'ladder-count' },
        L.el('div', { class: 'ladder-count-card' },
          L.el('div', { class: 'eyebrow' }, `Nivel ${n} de 3`),
          L.el('h2', { class: 'title' }, '¡Casi!'),
          L.el('p', { class: 'lead' }, lead),
        ),
      ));
      if (L.sound) L.sound.play('lose');
      setTimeout(resolve, LOST_MS);
    });
  }

  // Perdió y le queda otra oportunidad: sin giro, turno nuevo para el menú. El POST sale junto con
  // el aviso; al retomar (sin `gameStage`) va directo. `{ otra }` lo abre app.js en el menú.
  async function anotherTry({ token, n, gameStage, left }) {
    const pending = L.api('POST', '/api/run/otra', { token });
    pending.catch(() => {}); // el error sale al esperarlo, después del aviso
    if (gameStage) await lost(gameStage, n, null, left);
    return { otra: await pending };
  }

  const SUMMIT_LOCK_MS = 900; // el último toque del nivel 3 no debe saltarse la celebración
  const SUMMIT_AUTO_MS = 5600; // si nadie toca, pasa sola a la ruleta
  // Cordillera plana con dos cumbres a los lados (el centro queda libre para el texto) y bandera
  // en la de la derecha. El CSS le da aspect-ratio 4/1 (igual al viewBox): nunca se recorta.
  const SUMMIT_LAND = `
    <svg class="summit-land" viewBox="0 0 1600 400" aria-hidden="true">
      <path class="far" d="M0 400V230L140 170L290 220L430 120L560 200L700 250L820 300L960 250L1080 190L1200 140L1330 210L1470 150L1600 190V400Z"/>
      <path class="near" d="M0 400V300L150 220L330 90L470 190L600 280L800 340L1000 280L1130 190L1270 70L1420 200L1600 260V400Z"/>
      <path class="snow" d="M292 118L330 90L366 115L350 112L336 124L322 110L306 122Z"/>
      <path class="snow" d="M1228 100L1270 70L1310 98L1292 94L1278 108L1262 93L1246 106Z"/>
      <g class="flag"><path class="pole" d="M1270 72V2"/><path class="cloth" d="M1272 4L1340 20L1272 38Z"/></g>
    </svg>`;

  // Celebración de la cima antes de la ruleta. No adelanta nada del premio (lo sorteó el servidor
  // y solo se ve al girar): Solcito salta, cordillera con bandera, chispas y avance solo o con un toque.
  // `pending` = el POST de la cima: cuando llega, el texto nombra el premio que ya es suyo.
  function summitIntro(stage, nombre, pending) {
    return new Promise((resolve) => {
      const lead = L.el('p', { class: 'lead' }, `Ganaste ${CIMA_SPINS} giros en la ruleta de los viajes.`);
      pending.then((r) => {
        if (r && r.short) lead.textContent = `Ganaste: ${r.short}, y además ${CIMA_SPINS} giros en la ruleta de los viajes.`;
      }, () => {});
      const mascot = L.mascot.create();
      const fx = L.el('div', { class: 'summit-fx' });
      const btn = L.el('button', { class: 'btn btn-primary btn-xl', disabled: true }, 'Ir a la ruleta');
      const timers = [];
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        resolve();
      };

      screen(stage, L.el('div', { class: 'summit', style: `--auto:${SUMMIT_AUTO_MS}ms` },
        L.svg(SUMMIT_LAND),
        fx,
        L.el('div', { class: 'summit-body' },
          L.el('div', { class: 'summit-hero' }, mascot.el),
          L.el('div', { class: 'eyebrow' }, L.icon('mountain'), 'Nivel 3 de 3 superado'),
          L.el('h2', { class: 'title' }, `${L.firstName(nombre) || 'Viajero'}, llegaste a `, L.el('em', {}, 'la cima')),
          lead,
          L.el('div', { class: 'summit-go' }, btn, L.el('i', { class: 'summit-auto' })),
        ),
      ));

      const burst = (x, y, count) => sparkBurst(fx, x, y, count);
      mascot.mood('big', '¡Lo lograste!');
      if (L.sound) { L.sound.duck(3500); L.sound.play('cima'); }
      later(() => burst(50, 24, 18), 120);
      later(() => burst(21, 30, 14), 650);
      later(() => burst(79, 22, 14), 1050);
      later(() => burst(50, 24, 20), 1700);
      later(() => { btn.disabled = false; }, SUMMIT_LOCK_MS);
      later(finish, SUMMIT_AUTO_MS);
      L.onPress(btn, finish);
    });
  }

  // Cima: el premio de N2 ya es suyo (viene con su código) y además gira la ruleta de la cima
  // CIMA_SPINS veces, con una pausa corta entre giro y giro (cimaPause); "Tercer intento" suma una
  // y un viaje termina la serie. Cada giro siguiente se
  // pide con su número `n`, así un reenvío nunca gasta uno. Al recargar se ve otra vez el último.
  async function summit(stage, { token, nombre, onRevealStart, intro }) {
    // El sorteo sale ya (en paralelo con la celebración); si falla, el error llega al terminar.
    const pending = L.api('POST', '/api/run/summit', { token });
    pending.catch(() => {});
    if (intro) await summitIntro(stage, nombre, pending);
    let current = await pending;
    const first = L.firstName(nombre) || 'Viajero';
    // Misma disposición que la Brújula normal (ruleta + panel con Solcito); solo cambian los textos.
    const spinWheel = (result, copy) => new Promise((resolve) => {
      screen(stage);
      L.games.brujula.mount(stage, { result, nombre, onRevealStart, onDone: resolve, wheel: 'cima', copy });
    });
    if (!current.spins || !current.spins.length) { // cima de antes de los giros múltiples
      await spinWheel(current, { eyebrow: `${first}, llegaste a la cima`, title: 'Gira la ruleta de la cima' });
      return current;
    }
    for (;;) {
      const { spins } = current;
      const spin = spins[spins.length - 1];
      const n = spins.length;
      const total = CIMA_SPINS + (spins.some((x) => x.tier === 'retry') ? 1 : 0);
      const eyebrow = [`${first}, llegaste a la cima`, `${first}, tu segundo giro`, `${first}, tu tercer intento`][n - 1];
      // eslint-disable-next-line no-await-in-loop
      await spinWheel({ ...spin, retryToken: spin.tier === 'retry' ? 'pendiente' : null }, {
        eyebrow,
        title: `Giro ${n} de ${total}`,
        lead: `Ya tienes: ${current.short || current.label}. Además, la ruleta de los viajes:`,
      });
      if (!current.next) break; // viaje o serie terminada: sin pausa, directo a la tarjeta
      // El giro siguiente se sortea mientras corre la pausa; si falla, el error llega al terminarla.
      const nextSpin = L.api('POST', '/api/run/summit', { token, n: current.next });
      nextSpin.catch(() => {});
      // eslint-disable-next-line no-await-in-loop
      await cimaPause(stage, { c: current, spin, n, nextN: current.next, total });
      // eslint-disable-next-line no-await-in-loop
      current = await nextSpin;
    }
    return cimaCard(current);
  }

  const PAUSE_AUTO_MS = 3000; // si nadie toca, la pausa entre giros pasa sola al siguiente
  // Entre giros de la cima, en vez de saltar directo a la otra ruleta: la misma escena de la cima,
  // cae el sello con lo que ya es suyo, entra la pastilla del giro que viene y Solcito lo anima.
  // No adelanta nada del giro siguiente. Avanza sola o con "Girar de nuevo" tras DECISION_LOCK_MS.
  function cimaPause(stage, { c, spin, n, nextN, total }) {
    return new Promise((resolve) => {
      const have = [c.short || c.label, ...c.spins.filter((x) => x.tier === 'small').map((x) => x.label)].join(' + ');
      const extra = spin.tier === 'retry';
      const title = extra
        ? L.el('h2', { class: 'title' }, '¡Ganaste un ', L.el('em', {}, 'giro extra'), '!')
        : L.el('h2', { class: 'title' }, '¡Vamos por ', L.el('em', {}, nextN === total ? 'el último giro' : 'otro giro'), '!');
      const mascot = L.mascot.create();
      const fx = L.el('div', { class: 'summit-fx' });
      const btn = L.el('button', { class: 'btn btn-primary btn-xl', disabled: true }, 'Girar de nuevo');
      const timers = [];
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        resolve();
      };

      screen(stage, L.el('div', { class: 'cima-pause', style: `--auto:${PAUSE_AUTO_MS}ms` },
        L.svg(SUMMIT_LAND),
        fx,
        L.el('div', { class: 'summit-body' },
          L.el('div', { class: 'summit-hero' }, mascot.el),
          L.el('div', { class: 'eyebrow' }, L.icon('check'), `Giro ${n} listo`),
          title,
          L.el('div', { class: 'eyebrow pause-row' },
            L.el('span', { class: 'decide-stamp' }, 'Ya tienes', L.el('b', {}, have)),
            L.el('span', { class: 'pause-pill' }, L.icon('compass'), `Giro ${nextN} de ${total}`)),
          L.el('div', { class: 'summit-go' }, btn, L.el('i', { class: 'summit-auto' })),
        ),
      ));

      const burst = (x, y, count) => sparkBurst(fx, x, y, count);
      if (spin.tier === 'small') {
        mascot.mood('happy', '¡Bien!');
        later(() => mascot.mood('eager', '¡Otro giro!'), 1400);
      } else {
        mascot.mood(extra ? 'big' : 'eager', extra ? '¡Uno más!' : '¡Otro giro!');
      }
      if (L.sound) L.sound.play('chime');
      later(() => burst(50, 22, 16), 120);
      later(() => burst(42, 64, 12), 1150); // el sello cae
      later(() => burst(60, 64, 12), 1700); // entra la pastilla
      later(() => { btn.disabled = false; }, DECISION_LOCK_MS);
      later(finish, PAUSE_AUTO_MS);
      L.onPress(btn, finish);
    });
  }

  // Tarjeta de la cima: si un giro dio viaje, el viaje manda y el premio asegurado (más el souvenir,
  // si también salió) va en "Y ADEMÁS"; si no, manda el premio asegurado y el souvenir va abajo.
  function cimaCard(c) {
    const trip = c.spins.find((x) => x.tier === 'big');
    const souvenir = c.spins.find((x) => x.tier === 'small');
    if (trip) {
      const label = souvenir ? `${c.short || c.label} + ${souvenir.label}` : c.label;
      return { ...c, ...trip, retryToken: null, second: { label, tier: c.tier, couponCode: c.couponCode } };
    }
    return { ...c, second: souvenir ? { label: souvenir.label, tier: souvenir.tier, couponCode: null } : null };
  }

  // Plantarse da el premio del nivel Y un giro en la rueda del plantado (la Brújula sin el cupón
  // que acaba de ganar). "Otro intento" pide el segundo giro por /api/run/spin: /api/play no acepta
  // tokens de escalera. Al recargar se vuelve a ver el giro ya sorteado, igual que en la cima.
  async function plantadoSpin(stage, { token, nombre, result }) {
    let current = result;
    while (current.spin) {
      const spin = current.spin;
      const again = spin.attempt > 1;
      screen(stage);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        L.games.brujula.mount(stage, {
          result: { ...spin, retryToken: spin.retry ? 'pendiente' : null },
          nombre, onRevealStart: () => {}, onDone: resolve, wheel: spin.wheel,
          copy: {
            eyebrow: again ? `${L.firstName(nombre)}, otro intento` : `${L.firstName(nombre)}, te plantaste`,
            title: again ? 'Gira de nuevo' : 'Tu giro de regalo',
            lead: 'Tu premio ya es tuyo. Además, un giro en la ruleta:',
          },
        });
      });
      if (!spin.retry) break;
      // eslint-disable-next-line no-await-in-loop
      current = await L.api('POST', '/api/run/spin', { token });
    }
    return cardResult(current);
  }

  // Quien pierde gira la Brújula tal cual (mismos premios y %). El POST sale junto con el aviso
  // "¡Casi!", así el sorteo ya está hecho cuando aparece la ruleta. Al retomar (sin `gameStage`)
  // se vuelve a ver el giro ya sorteado, igual que en el plantado.
  async function consolation(stage, { token, nombre, n, keep, gameStage, result }) {
    const pending = result && result.spin ? Promise.resolve(result) : L.api('POST', '/api/run/consuelo', { token });
    pending.catch(() => {}); // el error sale al esperarlo, después del aviso
    if (gameStage) await lost(gameStage, n, keep);
    let current = await pending;
    while (current.spin) {
      const spin = current.spin;
      const again = spin.attempt > 1;
      screen(stage);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        L.games.brujula.mount(stage, {
          result: { ...spin, retryToken: spin.retry ? 'pendiente' : null },
          nombre, onRevealStart: () => {}, onDone: resolve, wheel: spin.wheel,
          copy: {
            eyebrow: again ? `${L.firstName(nombre)}, otro intento` : `${L.firstName(nombre)}, casi lo logras`,
            title: again ? 'Gira de nuevo' : 'Tu giro de regalo',
            lead: current.couponCode ? `Conservas tu ${current.short}. Además, un giro en la ruleta:` : 'No te vas con las manos vacías: gira la ruleta.',
          },
        });
      });
      if (!spin.retry) break;
      // eslint-disable-next-line no-await-in-loop
      current = await L.api('POST', '/api/run/consuelo', { token, retry: true });
    }
    // Con el cupón de N1: la tarjeta de dos premios. Sin él, el giro es el resultado.
    if (current.prizeId) return cardResult(current);
    return { ...current, ...current.spin, retryToken: null, spin: null, second: null };
  }

  // Tarjeta con los dos premios: manda el más grande y el otro va en la línea "Y ADEMÁS".
  function cardResult(c) {
    const spin = c.spin;
    const won = spin && ['big', 'coupon', 'small'].includes(spin.tier);
    const mine = { label: c.label, tier: c.tier, couponCode: c.couponCode };
    if (won && spin.tier === 'big') return { ...c, ...spin, retryToken: null, spin: null, second: mine };
    return { ...c, second: won ? { label: spin.label, tier: spin.tier, couponCode: spin.couponCode } : null };
  }

  // Reloj de nivel: barra que se agota en limitS segundos, con aviso en los últimos 5 s.
  // Devuelve una función para detenerlo (al terminar el nivel antes de tiempo).
  // opts.pressure (memoria, rompecabezas): segundos grandes que laten, aviso desde los 10 s,
  // tramo crítico en los últimos 5 s y `data-hud="warn|crit"` en opts.edge (viñeta del borde).
  const WARN_MS = 10000;
  const CRIT_MS = 5000;
  function clock(container, limitS, onTimeout, opts = {}) {
    const fill = L.el('div', { class: 'hud-fill' });
    const secs = opts.pressure ? L.el('b', {}, String(Math.ceil(limitS))) : null;
    const hud = L.el('div', { class: opts.pressure ? 'hud hud-pressure' : 'hud' },
      secs ? L.el('div', { class: 'hud-time' }, secs, L.el('span', {}, 's')) : null,
      L.el('div', { class: 'hud-bar' }, fill));
    container.append(hud);
    const edge = opts.edge || null;
    const totalMs = limitS * 1000;
    const start = performance.now();
    let stopped = false;
    let raf;
    let shown = Math.ceil(limitS);
    let phase = '';
    function tick(now) {
      if (stopped) return;
      const left = Math.max(0, totalMs - (now - start));
      // scaleX (no width): la barra se mueve en la GPU sin layout ni repintado en cada cuadro.
      fill.style.transform = `scaleX(${left / totalMs})`;
      if (!opts.pressure) {
        fill.classList.toggle('hud-warn', left <= CRIT_MS);
      } else {
        const next = left <= CRIT_MS ? 'crit' : left <= WARN_MS ? 'warn' : '';
        if (next !== phase) {
          phase = next;
          hud.dataset.hud = phase;
          if (edge) edge.dataset.hud = phase;
          fill.classList.toggle('hud-warn', phase === 'warn');
          fill.classList.toggle('hud-crit', phase === 'crit');
        }
        const s = Math.ceil(left / 1000);
        if (s !== shown) {
          shown = s;
          secs.textContent = String(s);
          if (phase) {
            secs.classList.remove('beat');
            void secs.offsetWidth;
            secs.classList.add('beat');
            if (phase === 'crit' && s > 0 && L.sound) L.sound.play('tick');
          }
        }
      }
      if (left <= 0) {
        stopped = true;
        if (edge) edge.dataset.hud = '';
        onTimeout();
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (edge) edge.dataset.hud = '';
    };
  }

  // Castigo visual al fallar (par distinto, intercambio que no acomoda nada): el reloj se sacude
  // y destella. No descuenta tiempo; el servidor solo valida el tiempo real del nivel.
  function penalty(container) {
    const hud = container.querySelector('.hud');
    if (!hud) return;
    hud.classList.remove('hud-hit');
    void hud.offsetWidth;
    hud.classList.add('hud-hit');
  }

  L.ladder = {
    clock,
    penalty,
    burst: sparkBurst,

    // stage: contenedor de juego (igual que mount() de los otros juegos).
    // view: resultado de /api/run/start (retoma el nivel correcto si se recarga a mitad).
    // playLevel(stage, n, params, ready) -> Promise<{passed, ms?, precision?, misses?}>. Debe armar la
    // escena en el acto y esperar `ready` para arrancar reloj, animación y toques.
    // params.lives: intentos disponibles en el nivel (null si el juego no los usa).
    // describeLevel(params) -> texto corto para el aviso del nivel y la pantalla de decisión.
    // livesIcon: nombre del ícono (L.icon) de cada intento en la decisión; por defecto el avión.
    // onDone(result, stats): stats = {game, level, ms, precision} de la partida, para la tarjeta.
    async run(stage, { token, view, nombre, playLevel, describeLevel, livesIcon, onRevealStart, onDone }) {
      const describe = describeLevel || ((p) => `${p.limitS} s límite`);
      const stats = (x) => ({ game: x.game, level: x.passed, ms: x.ms, precision: x.precision });
      let v = view;
      onRevealStart();

      // Al retomar (recarga o POST fallido) con un nivel ya pasado, primero va la decisión: nunca
      // se obliga a seguir a quien quizá quería plantarse.
      let decide = v.passed > 0;
      while (v.status === 'jugando') {
        if (decide) {
          const nextText = describe(v.levels[v.level - 1]);
          const choice = await decision(stage, {
            n: v.passed, banked: v.banked, next: v.next, nextText,
            lives: livesText(v), livesLeft: v.lives, livesBonus: v.livesBonus, livesIcon, keep: v.keep, left: triesLeft(v),
          });
          if (choice === 'cashout') {
            const result = await L.api('POST', '/api/run/cashout', { token });
            onDone(await plantadoSpin(stage, { token, nombre, result }), stats(v));
            return;
          }
        }
        const n = v.level;
        const params = { ...v.levels[n - 1], lives: v.lives };
        const gameStage = L.el('div', { class: 'game-stage' });
        screen(stage, gameStage);
        let go;
        const ready = new Promise((r) => { go = r; });
        const playing = playLevel(gameStage, n, params, ready);
        await countdown(gameStage, n, describe(params), v.passed === 0, livesText(v));
        const t0 = performance.now();
        go();
        const outcome = await playing;
        const ms = Math.round(outcome.ms ?? (performance.now() - t0));
        v = await L.api('POST', '/api/run/level', {
          token, n, passed: outcome.passed, ms, precision: outcome.precision ?? null, misses: v.lives == null ? null : (outcome.misses ?? 0),
        });
        if (v.status === 'perdio' && v.otra) { onDone(await anotherTry({ token, n, gameStage, left: triesLeft(v) })); return; }
        if (v.status === 'perdio') { onDone(await consolation(stage, { token, nombre, n, keep: v.keep, gameStage }), stats(v)); return; }
        decide = true;
      }

      if (v.status === 'perdio' && v.otra) { onDone(await anotherTry({ token })); return; }
      if (v.status === 'perdio') { onDone(await consolation(stage, { token, nombre, result: v.result }), stats(v)); return; }
      if (v.status === 'plantado') { onDone(await plantadoSpin(stage, { token, nombre, result: v.result }), stats(v)); return; }
      // La celebración va solo la primera vez: al retomar tras el sorteo (cima_jugada) se ve la ruleta.
      if (L.sound) L.sound.mood('cima');
      const result = await summit(stage, { token, nombre, onRevealStart: () => {}, intro: v.status === 'cima' });
      onDone(result, stats(v));
    },
  };
})();
;
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
;
'use strict';

// Aterriza el avión, "Descenso al atardecer": escena vertical; el avión sube y baja y hay que
// presionar cuando cruza la franja dorada sobre la pista. Fallar un aterrizaje pierde el nivel.
// ms lo mide L.ladder; aquí solo pasado/precisión. La lógica sigue sobre pos 0..1 y la escena
// solo traduce pos a altura; el centro de la franja cambia en cada pasada (ver ZONE_MIN/ZONE_MAX).
(() => {
  const L = window.L360;

  // Recorrido del avión en fracción del alto de la escena, lineal como en la versión horizontal
  // (pos 0..1 -> left%). El recorrido termina a propósito cerca de la pista (TOP+SPAN): el avión
  // baja desde el cielo y la franja de aterrizaje cae dentro de ese tramo.
  const TOP = 0.56;
  const SPAN = 0.38;
  const PLANE_X = 50; // el avión no se mueve en x: centrado, como .runway-plane en el CSS
  const yPct = (p) => (TOP + SPAN * Math.max(0, Math.min(1, p))) * 100;

  // La franja cambia de altura en cada pasada para que el nivel no se sienta siempre igual.
  // La dificultad no se mueve: el alto de la franja (params.zone) y la velocidad son los mismos,
  // así que la ventana de reacción dura lo mismo caiga donde caiga. Los dos bordes de la banda
  // están para que tampoco cambie de forma indirecta:
  //  - abajo: el avión tarda al menos APPROACH_S en llegar al borde de la franja desde que sale
  //    (0,55 s es lo que daba la franja fija en 0.5 al nivel más rápido: nunca hay menos aviso).
  //  - arriba: la franja nunca toca el rebote de pos 1, donde el avión quedaría dentro el doble
  //    de tiempo (eso sí sería más fácil).
  const APPROACH_S = 0.55;
  const TOP_EDGE = 0.9;
  const ZONE_STEP = 0.12; // salto mínimo entre una pasada y la siguiente, para que se note
  function zoneBand(params, half) {
    const lo = APPROACH_S * params.speed + half;
    const hi = TOP_EDGE - half;
    return hi > lo ? { lo, hi } : { lo: 0.5, hi: 0.5 };
  }
  function pickZone(band, prev) {
    const step = Math.min(ZONE_STEP, (band.hi - band.lo) / 2);
    for (let i = 0; i < 12; i += 1) {
      const c = band.lo + Math.random() * (band.hi - band.lo);
      if (prev == null || Math.abs(c - prev) >= step) return c;
    }
    return prev > (band.lo + band.hi) / 2 ? band.lo : band.hi;
  }

  // Un cielo por nivel (params.sky lo puede fijar desde config.json): mismo juego, otra hora del día.
  const SKIES = ['sunset', 'day', 'night'];

  // Capas de parallax: el dibujo de 1000×h unidades se repite las veces necesarias para cubrir el
  // ancho real de la escena sin deformarse, y la capa se corre exactamente un tramo por ciclo.
  // speed = fracción del ancho de la escena por segundo.
  function pan(cls, h, speed, draw) {
    const svg = L.svg(`<svg class="runway-pan ${cls}" preserveAspectRatio="none" aria-hidden="true"></svg>`);
    svg.fit = (sceneWidth) => {
      const tile = (svg.getBoundingClientRect().height * 1000) / h;
      if (!tile || !sceneWidth) return;
      const n = Math.ceil(sceneWidth / tile) + 1;
      let body = '';
      for (let i = 0; i < n; i += 1) body += draw(i * 1000);
      svg.setAttribute('viewBox', `0 0 ${n * 1000} ${h}`);
      svg.innerHTML = body; // markup estático, nunca texto de usuario
      svg.style.width = `${n * tile}px`;
      svg.style.setProperty('--tile', `${-tile}px`);
      svg.style.animationDuration = `${(tile / (sceneWidth * speed)).toFixed(2)}s`;
    };
    return svg;
  }
  const PALM = '<path d="M119 420c-8-120-4-230 26-330l10 3c-26 100-30 206-22 327z"/><path d="M150 88c-40-40-110-44-150-10 50-6 100 2 150 14zM150 88c30-44 96-58 140-30-50 2-96 12-140 34zM150 88c-6-46-40-80-86-88 30 26 58 56 86 90zM150 88c16-40 56-64 100-62-40 14-72 34-100 64zM150 88c-46-4-88 20-108 58 34-26 72-44 108-56z"/>';
  const palm = (x, s, base, flip) => `<g transform="translate(${flip ? x + 290 * s : x} ${base - 420 * s}) scale(${flip ? -s : s} ${s})">${PALM}</g>`;
  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect y="22" width="200" height="40" rx="20"/><rect x="40" width="100" height="50" rx="25"/><rect x="110" y="10" width="70" height="36" rx="18"/></g>`;
  const island = (x, w, h) => `<path d="M${x} 128q${w / 2} ${-h} ${w} 0z"/>`;

  // El avión tiene piezas propias para que se mueva sin que nada dependa de ellas: el tren baja
  // solo cuando está cerca de la pista (clase `gear`) y las luces parpadean con `steps`, así el
  // repintado es de dos cuadros por ciclo y no de sesenta.
  const PLANE = `<svg viewBox="0 0 120 48" aria-hidden="true">
  <path class="plane-wing-far" d="M60 22l18-16h8l-8 16z"/>
  <path class="plane-fin" d="M9 22L3 4h11l15 18z"/>
  <g class="plane-gear">
    <path d="M40 32v5M84 32v5"/>
    <circle cx="40" cy="39.5" r="2.6"/><circle cx="84" cy="39.5" r="2.6"/>
  </g>
  <path class="plane-body" d="M6 26c0-4 4-6 10-6h80c10 0 18 3 22 6-4 3-12 6-22 6H16c-6 0-10-2-10-6z"/>
  <path class="plane-stripe" d="M18 29h78"/>
  <g class="plane-windows"><circle cx="66" cy="24.5" r="1.6"/><circle cx="73" cy="24.5" r="1.6"/><circle cx="80" cy="24.5" r="1.6"/><circle cx="87" cy="24.5" r="1.6"/><circle cx="94" cy="24.5" r="1.6"/></g>
  <path class="plane-wing" d="M52 28l-12 18h10l24-18z"/>
  <circle class="plane-nav tail" cx="7" cy="6" r="2"/>
  <circle class="plane-nav tip" cx="38" cy="45" r="2"/>
  <circle class="plane-beacon" cx="60" cy="19.5" r="1.8"/>
</svg>`;

  // Detalles que se mueven solos (transform/opacity, sin layout): velero en el mar, gaviotas en el
  // cielo y el banderín de la pista. No tocan el juego; solo hacen que la escena esté viva.
  const BOAT = `<svg viewBox="0 0 120 92" aria-hidden="true">
  <path class="boat-sail" d="M58 4l38 52H58zM52 16L16 56h36z"/>
  <path class="boat-hull" d="M4 60h112l-18 24H22z"/>
</svg>`;
  const GULL = `<svg viewBox="0 0 64 26" aria-hidden="true"><path d="M3 18C13 18 20 5 32 5s19 13 29 13" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`;
  const FLAG = `<svg viewBox="0 0 44 64" aria-hidden="true">
  <rect class="flag-pole" x="2" y="0" width="4.5" height="64" rx="2.2"/>
  <path class="flag-cloth" d="M6.5 5h32l-9 11 9 11h-32z"/>
</svg>`;

  function buildScene() {
    const zone = L.el('div', { class: 'runway-zone' },
      L.el('span', { class: 'runway-zone-tag' }, 'ATERRIZA AQUÍ'),
      L.el('span', { class: 'runway-zone-tag right' }, 'ATERRIZA AQUÍ'),
    );
    const planeBody = L.el('div', { class: 'runway-plane-body' }, L.svg(PLANE));
    const plane = L.el('div', { class: 'runway-plane' }, L.el('div', { class: 'runway-trail' }), planeBody);
    const fx = L.el('div', { class: 'runway-fx' });
    const pans = [
      pan('runway-clouds', 240, 0.02, (o) => cloud(60 + o, 20, 1) + cloud(520 + o, 120, 0.7) + cloud(780 + o, 10, 0.55) + cloud(300 + o, 170, 0.45)),
      pan('runway-far', 128, 0.012, (o) => island(80 + o, 300, 56) + palm(200 + o, 0.2, 105) + island(620 + o, 200, 36)),
      pan('runway-palms', 480, 0.07, (o) => palm(40 + o, 1, 480) + palm(520 + o, 0.72, 480, true) + palm(800 + o, 0.55, 480)),
    ];
    const gulls = L.el('div', { class: 'runway-gulls' },
      L.el('i', {}, L.svg(GULL)), L.el('i', {}, L.svg(GULL)), L.el('i', {}, L.svg(GULL)));
    const scene = L.el('div', { class: 'runway-scene' },
      L.el('div', { class: 'runway-sky' }, L.el('div', { class: 'runway-stars' }), L.el('div', { class: 'runway-sun' })),
      pans[0], gulls, pans[1],
      L.el('div', { class: 'runway-sea' },
        L.el('i'), L.el('i'), L.el('i'),
        L.el('div', { class: 'runway-boat' }, L.el('div', { class: 'runway-boat-bob' }, L.svg(BOAT)))),
      L.el('div', { class: 'runway-sand' }),
      pans[2],
      L.el('div', { class: 'runway-strip' },
        L.el('img', { class: 'runway-logo', src: 'media/logo.png', alt: '' }),
        L.el('div', { class: 'runway-flag' }, L.svg(FLAG))),
      zone, plane, fx,
    );
    return { scene, zone, plane, planeBody, fx, pans };
  }

  // Reinicia una animación CSS aunque la clase ya estuviera puesta (reflow forzado).
  function flash(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  // Chispas planas desde el avión + sello "ATERRIZAJE ✓". Cada celebración limpia solo sus nodos.
  const SPARKS = ['var(--gold)', 'var(--orange)', 'var(--seafoam-soft)'];
  function celebrate(fx, x, y) {
    const nodes = [];
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
      const d = 7 + Math.random() * 8;
      const s = 0.9 + Math.random() * 0.9;
      nodes.push(L.el('i', {
        class: `runway-spark${i % 3 === 2 ? ' round' : ''}`,
        style: `left:${x}%;top:${y}%;width:${s}rem;height:${s}rem;background:${SPARKS[i % 3]};--dx:${(Math.cos(a) * d).toFixed(2)}rem;--dy:${(Math.sin(a) * d).toFixed(2)}rem;--r:${Math.round(Math.random() * 360)}deg`,
      }));
    }
    nodes.push(L.el('div', { class: 'runway-stamp' }, 'ATERRIZAJE', L.icon('check')));
    fx.append(...nodes);
    setTimeout(() => nodes.forEach((node) => node.remove()), 900);
  }

  // Humo de las ruedas al tocar la franja: nubecitas que se van para atrás y se apagan.
  function puff(fx, x, y) {
    const nodes = [];
    for (let i = 0; i < 5; i += 1) {
      const s = 1.5 + Math.random() * 1.8;
      nodes.push(L.el('i', {
        class: 'runway-puff',
        style: `left:${x}%;top:${y}%;width:${s}rem;height:${s}rem;--dx:${(-2 - Math.random() * 6).toFixed(1)}rem;--dy:${(-0.5 - Math.random() * 2.5).toFixed(1)}rem;animation-delay:${i * 45}ms`,
      }));
    }
    fx.append(...nodes);
    setTimeout(() => nodes.forEach((node) => node.remove()), 1100);
  }

  const MISS_RESUME_MS = 900; // choque con intentos de sobra: tiempo hasta que el avión vuelve a salir

  L.games.aterriza = {
    ladder: true,
    title: 'Aterriza el avión',
    tagline: 'Toca el botón cuando el avión cruce la franja dorada y encadena tus aterrizajes.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3L3 10.5l7 3L13.5 21z"/><path d="M21 3L10 13.5"/></svg>',

    describeLevel(p) {
      return `${p.landings} aterrizajes · franja ${Math.round(p.zone * 100)}% · ${p.limitS} s`;
    },

    playLevel(stage, n, params, ready) {
      return new Promise((resolve) => {
        let started = false;
        let done = false;
        let locked = false;
        let landed = 0;
        const precisions = [];
        const half = params.zone / 2;
        // Intentos (config.json > ladder.games.aterriza.lives, los lleva el servidor entre niveles):
        // cada toque fuera de la franja gasta uno y el avión vuelve a salir; sin intentos, pierde.
        const lives = Number.isInteger(params.lives) && params.lives > 0 ? params.lives : 1;
        let misses = 0;
        let over = false; // final decidido (choque definitivo o nivel completo): nada lo reanuda
        // Gracia por retardo de la TV: el toque también vale si el avión estuvo en la franja
        // durante los últimos `lateMs` (config.json > ladder.games.aterriza.levels[].lateMs, 0 = sin gracia).
        const lateMs = Math.min(200, Math.max(0, Number(params.lateMs) || 0));
        const trail = []; // {t, pos} de los últimos cuadros dibujados

        const s = buildScene();
        s.scene.dataset.sky = typeof params.sky === 'string' ? params.sky : (SKIES[n - 1] || 'sunset');
        // El alto de la franja no depende de dónde caiga (yPct es lineal): se fija una vez y la
        // franja se mueve con `translate` en % de su propio alto, sin medir ni tocar el layout.
        const zoneH = SPAN * params.zone * 100;
        const band = zoneBand(params, half);
        // params.zoneAt fija la franja donde diga (sin banda): lo usan los humos y sirve si el
        // dueño quiere volver a la franja quieta desde config.json.
        const fixedZone = Number.isFinite(params.zoneAt) ? Math.min(1 - half, Math.max(half, params.zoneAt)) : null;
        let zc = fixedZone == null ? pickZone(band, null) : fixedZone;
        s.zone.style.top = '0';
        s.zone.style.height = `${zoneH}%`;
        const placeZone = () => {
          s.zone.style.translate = `0 ${((yPct(zc - half) / zoneH) * 100).toFixed(2)}%`;
        };
        placeZone(); // antes de entrar al documento: la primera altura no se anima
        const pips = Array.from({ length: params.landings }, () => L.el('i'));
        const count = L.el('span', {}, `0 / ${params.landings}`);
        const tally = L.el('div', { class: 'runway-tally' }, L.el('div', { class: 'runway-pips' }, pips), count);
        const lifeIcons = Array.from({ length: lives }, () => L.el('i', { class: 'on' }, L.icon('plane')));
        const livesBox = params.lives == null ? null : L.el('div', { class: 'runway-lives' },
          L.el('span', {}, 'Intentos'), L.el('div', { class: 'runway-lives-row' }, lifeIcons));
        const btn = L.el('button', { class: 'btn btn-primary btn-xl', disabled: true }, '¡Aterriza!');
        const hud = L.el('div', { class: 'runway-clock' });
        stage.classList.add('runway-stage');
        stage.append(L.el('div', { class: 'runway-game' },
          s.scene,
          L.el('div', { class: 'runway-side' },
            hud, tally, livesBox, btn,
            L.el('p', { class: 'runway-hint' }, 'Presiona el botón o la escena cuando el avión cruce la ', L.el('b', {}, 'franja dorada'), '.'),
          ),
        ));

        const sceneBox = s.scene.getBoundingClientRect();
        s.pans.forEach((p) => p.fit(sceneBox.width));
        // Alto útil de la escena (lo que mide `top: %`): el avión se mueve con `translate` en px,
        // en la GPU, sin layout ni repintado en cada cuadro.
        let sceneH = s.scene.clientHeight;

        let stopClock = () => {};

        let pos = 0;
        let dir = 1;
        let last = performance.now();
        let raf;
        function place() {
          s.plane.style.translate = `0 ${((yPct(pos) / 100) * sceneH).toFixed(1)}px`;
          // De perfil: morro abajo al descender, arriba al subir (el CSS suaviza el cambio).
          s.plane.style.transform = `translate(-50%, -50%) rotate(${dir === 1 ? 12 : -12}deg)`;
        }
        // Tren de aterrizaje: baja un poco antes de la franja y sube al volver a subir. La clase
        // solo cambia cuando cruza el umbral, no en cada cuadro.
        let gearDown = false;
        function gear(on) {
          if (on === gearDown) return;
          gearDown = on;
          s.planeBody.classList.toggle('gear', on);
        }
        function frame(now) {
          if (done || locked) return;
          const dt = (now - last) / 1000;
          last = now;
          pos += dir * params.speed * dt;
          if (pos >= 1) { pos = 1; dir = -1; }
          if (pos <= 0) { pos = 0; dir = 1; }
          gear(pos >= zc - 0.18);
          place();
          if (lateMs) {
            trail.push({ t: now, pos });
            while (trail.length && now - trail[0].t > lateMs) trail.shift();
          }
          raf = requestAnimationFrame(frame);
        }
        place();
        // La escena queda armada (parallax corriendo) durante la cuenta regresiva de L.ladder;
        // avión, reloj y toques arrancan recién con `ready`.
        Promise.resolve(ready).then(() => {
          started = true;
          btn.disabled = false;
          sceneH = s.scene.clientHeight || sceneH;
          stopClock = L.ladder.clock(hud, params.limitS, () => crash(null));
          last = performance.now();
          raf = requestAnimationFrame(frame);
        });

        function finish(passed, precision) {
          if (done) return;
          done = true;
          cancelAnimationFrame(raf);
          stopClock();
          btn.disabled = true;
          resolve({ passed, precision, misses });
        }

        function wreck() {
          locked = true;
          btn.disabled = true;
          cancelAnimationFrame(raf);
          // El paisaje sigue andando durante el choque: pausarlo se leía como que el juego se trabó.
          flash(s.scene, 'miss', 420);
          flash(s.zone, 'miss', 420);
          s.planeBody.classList.add('crash');
        }

        // Choque definitivo (sin intentos o se acabó el reloj, aunque haya una pausa en curso).
        function crash(precision) {
          if (over) return;
          over = true;
          wreck();
          setTimeout(() => finish(false, precision), 460);
        }

        function resume() {
          pos = 0;
          dir = 1;
          trail.length = 0;
          if (fixedZone == null) { zc = pickZone(band, zc); placeZone(); } // se corre mientras el avión espera
          locked = false;
          btn.disabled = false;
          gear(false);
          place();
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }

        function miss() {
          misses += 1;
          if (L.sound) L.sound.play('wrong');
          const icon = lifeIcons[lives - misses];
          if (icon) { icon.classList.remove('on'); flash(icon, 'lost', 600); }
          if (misses >= lives) { crash(null); return; }
          wreck();
          L.ladder.penalty(hud);
          setTimeout(() => {
            if (over) return;
            s.planeBody.classList.remove('crash');
            resume();
          }, MISS_RESUME_MS);
        }

        function land() {
          if (!started || done || locked) return;
          let d = Math.abs(pos - zc);
          const now = performance.now();
          for (const p of trail) if (now - p.t <= lateMs) d = Math.min(d, Math.abs(p.pos - zc));
          if (d > half) { miss(); return; }

          const precision = Math.max(0, Math.min(100, 100 * (1 - d / half)));
          precisions.push(precision);
          landed += 1;
          count.textContent = `${landed} / ${params.landings}`;
          if (pips[landed - 1]) pips[landed - 1].classList.add('on');
          flash(s.zone, 'hit', 380);
          flash(s.planeBody, 'bump', 320);
          flash(tally, 'bump', 320);
          puff(s.fx, PLANE_X, yPct(pos));
          celebrate(s.fx, PLANE_X, yPct(pos));
          if (L.sound) L.sound.play(landed >= params.landings ? 'chime' : 'correct');

          if (landed >= params.landings) {
            const avg = precisions.reduce((a, p) => a + p, 0) / precisions.length;
            over = true;
            locked = true;
            btn.disabled = true;
            setTimeout(() => finish(true, avg), 320);
            return;
          }

          locked = true;
          btn.disabled = true;
          setTimeout(() => { if (!over) resume(); }, 320);
        }
        // Sin clic de toque: cada aterrizaje ya suena a acierto o fallo.
        L.onPress(btn, land, { allowBusy: true, silent: true });
        L.onPress(s.scene, land, { allowBusy: true, silent: true });
      });
    },
  };
})();
;
'use strict';

// Memoria de destinos: cartas boca abajo con el logo; se destapan de a dos y cada par (ícono +
// destino) queda fijo. Encontrar todos los pares antes del reloj pasa el nivel. El premio lo decide
// el servidor; aquí solo se reporta pasado/ms. ms se toma al formar el último par (sin contar la
// celebración) para que el ranking sea justo.
(() => {
  const L = window.L360;

  const DESTINOS = [
    { name: 'Margarita', icon: 'sun' },
    { name: 'Los Roques', icon: 'boat' },
    { name: 'Tucacas', icon: 'palm' },
    { name: 'Chichiriviche', icon: 'wave' },
    { name: 'Mérida', icon: 'mountain' },
    { name: 'Colonia Tovar', icon: 'chalet' },
    { name: 'Canaima', icon: 'waterfall' },
    { name: 'Choroní', icon: 'sunset' },
    { name: 'Mochima', icon: 'fish' },
    { name: 'Coro', icon: 'dune' },
  ];
  const TONES = ['orange', 'seafoam', 'gold', 'dusk'];
  // Un cielo por nivel detrás del tablero (params.sky lo puede fijar desde config.json), igual que
  // en Aterriza: el mazo es el mismo juego pero la mesa cambia de hora del día.
  const SKIES = ['sunset', 'day', 'night'];
  const GULL = '<svg viewBox="0 0 64 26" aria-hidden="true"><path d="M3 18C13 18 20 5 32 5s19 13 29 13" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';
  const MISMATCH_MS = 750; // cuánto quedan a la vista dos cartas distintas (un tercer toque lo corta)
  const WIN_MS = 1200; // celebración antes de cerrar el nivel
  const TIMEOUT_MS = 1200; // se destapan las que faltaban antes de resolver
  const CARD_RATIO = 0.8; // ancho / alto de la carta
  const MAX_CARD_REM = 26;
  const PRESS_GAP_MS = 150; // un doble clic no cuenta dos veces, pero dos cartas seguidas sí
  const DEAL_STEP_MS = 45; // diferencia entre carta y carta al repartir (igual que en styles.css)
  const DEAL_MS = 460; // lo que dura la entrada de una carta, con margen

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Filas × columnas con la carta más grande posible en el tablero: 6 → 3×2, 10 → 5×2, 16 → 4×4.
  function layout(total, boxW, boxH, gap, maxH) {
    let best = null;
    for (let rows = 1; rows <= total; rows += 1) {
      if (total % rows) continue;
      const cols = total / rows;
      const h = Math.min(maxH, (boxH - gap * (rows - 1)) / rows, (boxW - gap * (cols - 1)) / cols / CARD_RATIO);
      if (!best || h > best.h) best = { rows, cols, h };
    }
    return best;
  }

  function flash(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  const SPARKS = ['var(--gold)', 'var(--orange)', 'var(--seafoam-soft)'];
  function sparks(fx, x, y, count) {
    const nodes = [];
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const d = 5 + Math.random() * 6;
      const s = 0.8 + Math.random() * 0.8;
      nodes.push(L.el('i', {
        class: `fx-spark${i % 3 === 2 ? ' round' : ''}`,
        style: `left:${x}%;top:${y}%;width:${s}rem;height:${s}rem;background:${SPARKS[i % 3]};--dx:${(Math.cos(a) * d).toFixed(2)}rem;--dy:${(Math.sin(a) * d).toFixed(2)}rem;--r:${Math.round(Math.random() * 360)}deg`,
      }));
    }
    fx.append(...nodes);
    setTimeout(() => nodes.forEach((node) => node.remove()), 900);
  }

  // El paisaje va detrás de las cartas, con un velo encima para que no les quite lectura. Las cartas
  // tapan el centro, así que todo vive en las franjas que quedan libres: cielo, sol y gaviotas
  // arriba, mar abajo. Solo transform/opacity, con los keyframes de Aterriza (sea-wave, gull-flap,
  // star-twinkle).
  function buildLand(sky) {
    const land = L.el('div', { class: 'mem-scene', 'data-sky': sky, 'aria-hidden': 'true' });
    land.innerHTML = `<div class="mem-sky"></div><div class="mem-sun"></div><div class="mem-stars"></div>
      <div class="mem-gulls"><i>${GULL}</i><i>${GULL}</i></div>
      <div class="mem-sea"><i></i><i></i><i></i></div>`;
    return land;
  }

  // Los destinos no se repiten de un nivel al siguiente mientras alcancen los de la lista.
  let lastPicks = [];
  function pickDestinos(count) {
    const fresh = shuffle(DESTINOS.filter((d) => !lastPicks.includes(d.name)));
    const seen = shuffle(DESTINOS.filter((d) => lastPicks.includes(d.name)));
    const picks = fresh.concat(seen).slice(0, count);
    lastPicks = picks.map((d) => d.name);
    return picks;
  }

  function buildCard(dest, tone) {
    const el = L.el('button', { class: 'mem-card', type: 'button', disabled: true, 'aria-label': 'Carta' },
      L.el('div', { class: 'mem-inner' },
        L.el('div', { class: 'mem-back' }, L.el('img', { src: 'media/logo.png', alt: '' })),
        L.el('div', { class: `mem-face tone-${tone}` },
          L.el('div', { class: 'mem-art' }, L.icon(dest.icon)),
          L.el('div', { class: 'mem-name' }, dest.name),
          L.el('div', { class: 'mem-ok' }, L.icon('check')),
        ),
      ),
    );
    return { el, dest, open: false, matched: false };
  }

  L.games.memoria = {
    ladder: true,
    title: 'Memoria de destinos',
    tagline: 'Destapa las cartas de a dos y encuentra cada par de destinos antes del reloj.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/><path d="M17 9.5v5M14.5 12h5"/></svg>',

    describeLevel(p) {
      return `${p.pairs} pares · ${p.limitS} s`;
    },

    playLevel(stage, n, params, ready) {
      return new Promise((resolve) => {
        let started = false;
        let done = false;
        let t0 = 0;
        let open = []; // cartas destapadas que todavía no forman par
        let hideTimer = null;
        let found = 0;

        const picks = pickDestinos(params.pairs);
        const cards = shuffle(picks.flatMap((dest, i) => [
          buildCard(dest, TONES[i % TONES.length]),
          buildCard(dest, TONES[i % TONES.length]),
        ]));
        cards.forEach((c, i) => c.el.style.setProperty('--i', i));

        const land = buildLand(params.sky || SKIES[(n - 1) % SKIES.length]);
        const grid = L.el('div', { class: 'mem-grid mem-deal' }, cards.map((c) => c.el));
        const fx = L.el('div', { class: 'mem-fx' });
        const board = L.el('div', { class: 'mem-board' }, land, grid, fx);
        const pips = Array.from({ length: params.pairs }, () => L.el('i'));
        const count = L.el('span', {}, `0 / ${params.pairs}`);
        const tally = L.el('div', { class: 'skill-tally' }, L.el('div', { class: 'skill-pips' }, pips), count);
        const hud = L.el('div', { class: 'skill-clock' });
        stage.classList.add('skill-stage');
        const scene = L.el('div', { class: 'skill-game' },
          board,
          L.el('div', { class: 'skill-side' },
            hud,
            L.el('div', { class: 'skill-label' }, 'Pares encontrados'),
            tally,
            L.el('p', { class: 'skill-hint' }, 'Destapa dos cartas. Si son el ', L.el('b', {}, 'mismo destino'), ', quedan fijas.'),
          ),
        );
        stage.append(scene);

        // Tamaño real del tablero (la escena ya está en el DOM): cartas grandes para TV.
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const box = board.getBoundingClientRect();
        land.style.setProperty('--mem-w', `${Math.round(box.width)}px`); // cuánto cruzan las gaviotas
        // El reparto se apaga al terminar: si la clase queda, tapar un par distinto (quitar .wrong)
        // vuelve a disparar la entrada y la carta desaparece hasta medio segundo.
        setTimeout(() => grid.classList.remove('mem-deal'), cards.length * DEAL_STEP_MS + DEAL_MS);
        const gap = (cards.length >= 12 ? 1 : 1.4) * rem; // mazos grandes: menos aire, cartas más grandes
        // El tablero deja libre un margen: por ahí se ve el paisaje (cielo arriba, mar abajo).
        const fit = layout(cards.length, box.width * 0.94, box.height * 0.86, gap, MAX_CARD_REM * rem);
        const cardH = Math.max(40, Math.floor(fit.h));
        const cardW = Math.floor(cardH * CARD_RATIO);
        grid.style.gridTemplateColumns = `repeat(${fit.cols}, ${cardW}px)`;
        grid.style.gridAutoRows = `${cardH}px`;
        grid.style.gap = `${gap}px`;

        let stopClock = () => {};
        Promise.resolve(ready).then(() => {
          if (done) return;
          started = true;
          grid.classList.remove('mem-deal'); // por si el reloj arranca antes de terminar el reparto
          t0 = performance.now();
          cards.forEach((c) => { c.el.disabled = false; });
          stopClock = L.ladder.clock(hud, params.limitS, timeUp, { pressure: true, edge: scene });
        });

        function center(c) {
          const b = board.getBoundingClientRect();
          const r = c.el.getBoundingClientRect();
          return [((r.left + r.width / 2 - b.left) / b.width) * 100, ((r.top + r.height / 2 - b.top) / b.height) * 100];
        }

        function hidePair() {
          clearTimeout(hideTimer);
          hideTimer = null;
          open.forEach((c) => { c.open = false; c.el.classList.remove('open', 'wrong'); });
          open = [];
        }

        function flip(c) {
          if (!started || done || c.matched || c.open) return;
          // Un tercer toque mientras se ven dos distintas las tapa en el acto y sigue con la nueva.
          if (open.length === 2) hidePair();
          c.open = true;
          c.el.classList.add('open');
          open.push(c);
          if (open.length < 2) return;

          const [a, b] = open;
          if (a.dest !== b.dest) {
            a.el.classList.add('wrong');
            b.el.classList.add('wrong');
            // Castigo visual tras el giro de la segunda carta: se sacuden las dos cartas (.wrong) y el
            // reloj. El tablero entero no: se veía como un salto y corría las cartas bajo el mouse,
            // así que el clic siguiente podía perderse.
            setTimeout(() => {
              if (done) return;
              if (L.sound) L.sound.play('wrong'); // suena aunque un tercer toque ya las haya tapado
              if (!a.open || !b.open) return;
              L.ladder.penalty(hud);
            }, 300);
            hideTimer = setTimeout(hidePair, MISMATCH_MS);
            return;
          }

          open = [];
          a.matched = true;
          b.matched = true;
          a.el.disabled = true;
          b.el.disabled = true;
          found += 1;
          count.textContent = `${found} / ${params.pairs}`;
          if (pips[found - 1]) pips[found - 1].classList.add('on');
          flash(tally, 'bump', 320);
          const last = found === params.pairs;
          // Espera a que termine el giro de la segunda carta antes de marcar el par.
          setTimeout(() => {
            [a, b].forEach((card) => {
              card.el.classList.add('matched');
              const [x, y] = center(card);
              sparks(fx, x, y, 8);
            });
            if (L.sound) L.sound.play(last ? 'chime' : 'correct');
          }, 220);
          if (last) win();
        }

        function win() {
          const ms = performance.now() - t0;
          done = true;
          stopClock();
          cards.forEach((c) => { c.el.disabled = true; });
          setTimeout(() => {
            board.classList.add('won');
            fx.append(L.el('div', { class: 'fx-stamp' }, '¡PARES COMPLETOS!', L.icon('check')));
          }, 260);
          setTimeout(() => resolve({ passed: true, ms }), WIN_MS);
        }

        function timeUp() {
          if (done) return;
          done = true;
          clearTimeout(hideTimer);
          cards.forEach((c) => {
            c.el.disabled = true;
            if (!c.matched) c.el.classList.add('open', 'missed');
          });
          flash(board, 'miss', 420);
          setTimeout(() => resolve({ passed: false, ms: params.limitS * 1000 }), TIMEOUT_MS);
        }

        cards.forEach((c) => L.onPress(c.el, () => flip(c), { allowBusy: true, gapMs: PRESS_GAP_MS }));
      });
    },
  };
})();
;
'use strict';

// Rompecabezas postal: la postal de un destino cortada en g×g piezas mezcladas; se tocan dos piezas
// para intercambiarlas y las que quedan en su lugar pierden la costura. Si hay fotos en
// media/postales/ se usa una; si no, la postal se dibuja en canvas con los tokens de marca.
// El premio lo decide el servidor; aquí solo pasado/ms (ms al colocar la última pieza).
(() => {
  const L = window.L360;

  const RATIO = 1.5; // postal apaisada 3:2
  const WIN_MS = 1200;
  const TIMEOUT_MS = 1200;
  const PRESS_GAP_MS = 150;
  const DESTINOS = ['Margarita', 'Los Roques', 'Chichiriviche', 'Tucacas', 'Choroní'];

  // Fotos opcionales: la lista se pide una vez al cargar; sin respuesta se usa la postal dibujada.
  let photos = [];
  L.api('GET', '/api/postales').then((d) => { photos = (d && d.postales) || []; }).catch(() => {});

  // El destino no se repite dos niveles seguidos: la escalera se siente otro viaje en cada nivel.
  let lastName = null;
  function pickAvoiding(list, nameOf) {
    const pool = list.filter((item) => nameOf(item) !== lastName);
    const from = pool.length ? pool : list;
    return from[Math.floor(Math.random() * from.length)];
  }

  function nameFromFile(url) {
    return decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, '').split(/[-_\s]+/)
      .filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function cycles(order) {
    const seen = new Array(order.length).fill(false);
    let count = 0;
    for (let i = 0; i < order.length; i += 1) {
      if (seen[i]) continue;
      count += 1;
      for (let j = i; !seen[j]; j = order[j]) seen[j] = true;
    }
    return count;
  }

  // order[casilla] = pieza. Ninguna pieza empieza en su lugar; en 2×2 además un solo ciclo
  // (3 intercambios) para que no se resuelva con dos toques de casualidad.
  function scramble(n) {
    for (;;) {
      const order = shuffle([...Array(n).keys()]);
      if (order.some((p, s) => p === s)) continue;
      if (n <= 4 && cycles(order) > 1) continue;
      return order;
    }
  }

  // ---------- postal ----------

  const PALM = new Path2D('M119 420c-8-120-4-230 26-330l10 3c-26 100-30 206-22 327zM150 88c-40-40-110-44-150-10 50-6 100 2 150 14zM150 88c30-44 96-58 140-30-50 2-96 12-140 34zM150 88c-6-46-40-80-86-88 30 26 58 56 86 90zM150 88c16-40 56-64 100-62-40 14-72 34-100 64zM150 88c-46-4-88 20-108 58 34-26 72-44 108-56z');

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  // Escena plana: cielo de atardecer, sol a rayas, nubes, mar con velero, arena, palmera, sello
  // con el logo y el nombre del destino. Cada zona es distinta para que las piezas se reconozcan.
  function drawScene(ctx, W, H, tok, v) {
    const horizon = H * 0.6;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, tok('--dusk'));
    sky.addColorStop(0.35, tok('--dusk-3'));
    sky.addColorStop(0.72, tok('--coral'));
    sky.addColorStop(1, tok('--orange'));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);

    const sx = W * v.sunX;
    const r = H * 0.2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, horizon, r, Math.PI, 0);
    ctx.clip();
    const sun = ctx.createLinearGradient(sx - r, horizon - r, sx + r, horizon);
    sun.addColorStop(0, tok('--gold'));
    sun.addColorStop(1, tok('--orange'));
    ctx.fillStyle = sun;
    ctx.fillRect(sx - r, horizon - r, r * 2, r);
    ctx.fillStyle = 'rgba(18, 38, 43, 0.35)';
    for (let y = horizon - r * 0.45, gap = r * 0.09; y < horizon; y += gap * 2, gap *= 0.85) ctx.fillRect(sx - r, y, r * 2, gap);
    ctx.restore();

    ctx.fillStyle = 'rgba(247, 241, 230, 0.28)';
    [[0.08, 0.1, 1], [0.5, 0.2, 0.7], [0.72, 0.07, 0.85]].forEach(([x, y, s]) => {
      const cx = W * x;
      const cy = H * y;
      const u = H * 0.05 * s;
      roundRect(ctx, cx, cy + u * 0.9, u * 7, u * 1.6, u * 0.8);
      roundRect(ctx, cx + u * 1.5, cy, u * 3.4, u * 2, u);
    });

    const sea = ctx.createLinearGradient(0, horizon, 0, H * 0.82);
    sea.addColorStop(0, tok('--seafoam'));
    sea.addColorStop(1, tok('--seafoam-deep'));
    ctx.fillStyle = sea;
    ctx.fillRect(0, horizon, W, H * 0.22);
    ctx.fillStyle = 'rgba(247, 241, 230, 0.22)';
    for (let i = 0; i < 4; i += 1) {
      const y = horizon + H * (0.03 + i * 0.05);
      for (let x = (i % 2) * W * 0.06; x < W; x += W * 0.12) roundRect(ctx, x, y, W * 0.05, H * 0.006, H * 0.003);
    }

    const bx = W * v.boatX;
    const by = horizon + H * 0.075;
    const u = H * 0.012;
    ctx.fillStyle = tok('--dusk-2');
    ctx.beginPath();
    ctx.moveTo(bx - u * 6, by); ctx.lineTo(bx + u * 6, by); ctx.lineTo(bx + u * 4.5, by + u * 2); ctx.lineTo(bx - u * 4.5, by + u * 2);
    ctx.fill();
    ctx.fillStyle = tok('--card');
    ctx.beginPath();
    ctx.moveTo(bx, by - u * 9); ctx.lineTo(bx + u * 5, by - u * 0.8); ctx.lineTo(bx, by - u * 0.8);
    ctx.fill();
    ctx.fillStyle = tok('--gold');
    ctx.beginPath();
    ctx.moveTo(bx - u * 0.6, by - u * 7); ctx.lineTo(bx - u * 4, by - u * 0.8); ctx.lineTo(bx - u * 0.6, by - u * 0.8);
    ctx.fill();

    ctx.fillStyle = tok('--sand');
    ctx.fillRect(0, H * 0.82, W, H * 0.18);
    ctx.fillStyle = 'rgba(58, 21, 5, 0.18)';
    [[0.3, 0.9], [0.36, 0.94], [0.55, 0.88], [0.62, 0.95], [0.8, 0.91]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.ellipse(W * x, H * y, H * 0.012, H * 0.007, 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    const s = (H * 0.88) / 420;
    ctx.save();
    ctx.translate(v.palmLeft ? W * 0.02 : W * 0.98, H * 0.12);
    ctx.scale(v.palmLeft ? s : -s, s);
    ctx.fillStyle = tok('--ink-deep');
    ctx.fill(PALM);
    ctx.restore();
  }

  function drawPhoto(ctx, W, H, img) {
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    const shade = ctx.createLinearGradient(0, H * 0.55, 0, H);
    shade.addColorStop(0, 'rgba(11, 24, 28, 0)');
    shade.addColorStop(1, 'rgba(11, 24, 28, 0.6)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
  }

  // Encima de la escena o la foto: "Saludos desde", nombre grande, sello con logo y marco crema.
  function drawPostcardMarks(ctx, W, H, tok, name, v) {
    const display = tok('--display') || 'Georgia, serif';
    const mono = tok('--mono') || 'monospace';
    const tx = v.palmLeft ? W * 0.58 : W * 0.42;
    let size = H * 0.19;
    ctx.font = `600 ${size}px ${display}`;
    const maxW = W * 0.62;
    const measured = ctx.measureText(name).width;
    if (measured > maxW) size *= maxW / measured;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${Math.round(H * 0.045)}px ${mono}`;
    ctx.fillStyle = tok('--card');
    ctx.fillText('SALUDOS DESDE', tx, H * 0.56);
    ctx.font = `600 ${size}px ${display}`;
    ctx.fillStyle = tok('--dusk');
    ctx.fillText(name, tx + H * 0.008, H * 0.78 + H * 0.008);
    ctx.fillStyle = tok('--card');
    ctx.fillText(name, tx, H * 0.78);

    const sw = W * 0.13;
    const sh = sw * 1.15;
    const sxp = v.palmLeft ? W - sw - W * 0.05 : W * 0.05;
    const syp = H * 0.1;
    ctx.fillStyle = tok('--card');
    roundRect(ctx, sxp, syp, sw, sh, sw * 0.04);
    ctx.fillStyle = tok('--orange');
    roundRect(ctx, sxp + sw * 0.08, syp + sw * 0.08, sw * 0.84, sh - sw * 0.16, sw * 0.03);
    ctx.fillStyle = tok('--card');
    roundRect(ctx, sxp + sw * 0.14, syp + sw * 0.14, sw * 0.72, sh - sw * 0.28, sw * 0.02);
    if (L.logo.complete && L.logo.naturalWidth) {
      const lw = sw * 0.6;
      const lh = (lw * L.logo.naturalHeight) / L.logo.naturalWidth;
      ctx.drawImage(L.logo, sxp + (sw - lw) / 2, syp + (sh - lh) / 2, lw, Math.min(lh, sh * 0.6));
    } else {
      ctx.fillStyle = tok('--gold');
      ctx.beginPath();
      ctx.arc(sxp + sw / 2, syp + sh / 2, sw * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Matasellos sobre la estampilla, con las ondas de cancelación hacia el centro de la postal.
    drawPostmark(ctx, sxp + sw * (v.palmLeft ? 0.18 : 0.82), syp + sh * 0.88, sw * 0.4, tok, mono, v.palmLeft ? -1 : 1);

    // Marco de postal: banda del color de la tarjeta con las franjas de correo aéreo.
    const b = H * 0.05;
    ctx.fillStyle = tok('--card');
    ctx.fillRect(0, 0, W, b);
    ctx.fillRect(0, H - b, W, b);
    ctx.fillRect(0, 0, b, H);
    ctx.fillRect(W - b, 0, b, H);
    const dash = b * 0.95;
    ctx.lineWidth = b * 0.32;
    ctx.setLineDash([dash, dash]);
    [['--orange', 0], ['--seafoam', dash]].forEach(([color, off]) => {
      ctx.strokeStyle = tok(color);
      ctx.lineDashOffset = -off;
      ctx.strokeRect(b / 2, b / 2, W - b, H - b);
    });
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }

  function drawPostmark(ctx, x, y, r, tok, mono, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.22 * dir);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = tok('--dusk');
    ctx.fillStyle = tok('--dusk');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.76, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `700 ${Math.max(6, Math.round(r * 0.28))}px ${mono}`;
    ctx.fillText('LOTUS', 0, -r * 0.24);
    ctx.fillText('360', 0, r * 0.02);
    ctx.font = `700 ${Math.max(6, Math.round(r * 0.24))}px ${mono}`;
    ctx.fillText('18·09', 0, r * 0.38);
    ctx.lineWidth = r * 0.13;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(dir * r * 1.05, i * r * 0.44);
      ctx.lineTo(dir * r * 2.6, i * r * 0.44);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderPostal(W, H, name, v, img) {
    const css = getComputedStyle(document.documentElement);
    const tok = (k) => css.getPropertyValue(k).trim();
    const canvas = document.createElement('canvas');
    const ctx = L.fitCanvas(canvas, W, H);
    if (img) drawPhoto(ctx, W, H, img); else drawScene(ctx, W, H, tok, v);
    drawPostcardMarks(ctx, W, H, tok, name, v);
    return postalUrl(canvas.toDataURL('image/jpeg', 0.9));
  }

  // La postal va como blob: URL corta, no como data: URL (~130 KB). Las piezas la leen desde
  // `var(--pz-img)` y Chrome vuelve a resolver ese texto en cada cambio de estilo de cada pieza:
  // con data: URL, intercambiar, fallar o perder congelaba la pantalla (medido 5 ms por pieza).
  // Solo vive la última postal: la anterior se libera al pintar otra.
  let lastPostal = null;
  function postalUrl(dataUrl) {
    const [head, b64] = dataUrl.split(',');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    if (lastPostal) URL.revokeObjectURL(lastPostal);
    lastPostal = URL.createObjectURL(new Blob([bytes], { type: head.slice(5).split(';')[0] }));
    return lastPostal;
  }

  // ---------- juego ----------

  const SPARKS = ['var(--gold)', 'var(--orange)', 'var(--seafoam-soft)'];
  function sparks(fx, x, y, count) {
    const nodes = [];
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const d = 4 + Math.random() * 5;
      const s = 0.7 + Math.random() * 0.8;
      nodes.push(L.el('i', {
        class: `fx-spark${i % 3 === 2 ? ' round' : ''}`,
        style: `left:${x}%;top:${y}%;width:${s}rem;height:${s}rem;background:${SPARKS[i % 3]};--dx:${(Math.cos(a) * d).toFixed(2)}rem;--dy:${(Math.sin(a) * d).toFixed(2)}rem;--r:${Math.round(Math.random() * 360)}deg`,
      }));
    }
    fx.append(...nodes);
    setTimeout(() => nodes.forEach((node) => node.remove()), 900);
  }

  function flash(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  L.games.rompecabezas = {
    ladder: true,
    title: 'Rompecabezas postal',
    tagline: 'Arma la postal del destino: toca dos piezas para cambiarlas de lugar.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6.5v2.3a1.7 1.7 0 1 0 3 0V4H20v6.5h-2.3a1.7 1.7 0 1 0 0 3H20V20h-6.5v-2.3a1.7 1.7 0 1 0-3 0V20H4v-6.5h2.3a1.7 1.7 0 1 0 0-3H4z"/></svg>',

    describeLevel(p) {
      return `${p.grid}×${p.grid} piezas · ${p.limitS} s`;
    },

    playLevel(stage, n, params, ready) {
      return new Promise((resolve) => {
        const g = params.grid;
        const total = g * g;
        let started = false;
        let done = false;
        let t0 = 0;
        let selected = null;
        const pieceAt = scramble(total); // casilla -> pieza
        const slotOf = new Array(total);
        pieceAt.forEach((p, s) => { slotOf[p] = s; });

        const photo = photos.length ? pickAvoiding(photos, nameFromFile) : null;
        const name = photo ? nameFromFile(photo) : pickAvoiding(DESTINOS, (x) => x);
        lastName = name;
        const variant = { sunX: 0.42 + Math.random() * 0.16, boatX: 0.3 + Math.random() * 0.4, palmLeft: Math.random() < 0.5 };

        const board = L.el('div', { class: 'pz-board' });
        const fx = L.el('div', { class: 'pz-fx' });
        const area = L.el('div', { class: 'pz-area' }, board);
        const pips = Array.from({ length: total }, () => L.el('i'));
        const count = L.el('span', {}, `0 / ${total}`);
        const tally = L.el('div', { class: 'skill-tally' }, L.el('div', { class: 'skill-pips' }, pips), count);
        const ref = L.el('img', { class: 'pz-ref', alt: '' });
        const hud = L.el('div', { class: 'skill-clock' });
        stage.classList.add('skill-stage');
        const scene = L.el('div', { class: 'skill-game' },
          area,
          L.el('div', { class: 'skill-side' },
            hud,
            L.el('div', { class: 'skill-label' }, 'Piezas en su lugar'),
            tally,
            L.el('div', { class: 'pz-ref-wrap' }, ref, L.el('div', { class: 'skill-label pz-ref-cap' }, 'Así debe quedar')),
            L.el('p', { class: 'skill-hint' }, 'Toca ', L.el('b', {}, 'dos piezas'), ' para cambiarlas de lugar.'),
          ),
        );
        stage.append(scene);

        // Tablero 3:2 lo más grande posible en el área (la escena ya está en el DOM).
        const box = area.getBoundingClientRect();
        const W = Math.max(120, Math.floor(Math.min(box.width, box.height * RATIO)));
        const H = Math.floor(W / RATIO);
        board.style.width = `${W}px`;
        board.style.height = `${H}px`;

        function paint(img) {
          const url = renderPostal(W, H, name, variant, img);
          board.style.setProperty('--pz-img', `url("${url}")`);
          ref.src = url;
        }
        paint(null);
        const display = getComputedStyle(document.documentElement).getPropertyValue('--display').trim();
        if (document.fonts && !document.fonts.check(`600 20px ${display}`)) {
          document.fonts.load(`600 20px ${display}`).then(() => { if (!started && !photo) paint(null); }).catch(() => {});
        }
        if (photo) {
          const img = new Image();
          img.onload = () => { if (!started) paint(img); };
          img.src = photo;
        }

        const tiles = Array.from({ length: total }, (_, p) => {
          const el = L.el('button', { class: 'pz-tile', type: 'button', disabled: true, 'aria-label': 'Pieza' });
          el.style.width = `${100 / g}%`;
          el.style.height = `${100 / g}%`;
          el.style.backgroundSize = `${g * 100}% ${g * 100}%`;
          el.style.backgroundPosition = `${((p % g) / (g - 1)) * 100}% ${(Math.floor(p / g) / (g - 1)) * 100}%`;
          return el;
        });
        function place(p) {
          const s = slotOf[p];
          // translate en % del tamaño de la pieza (1 casilla = 100%): se mueve en la GPU, sin layout.
          tiles[p].style.translate = `${(s % g) * 100}% ${Math.floor(s / g) * 100}%`;
          tiles[p].classList.toggle('ok', s === p);
        }
        tiles.forEach((_, p) => place(p));
        board.append(...tiles, fx);

        let placed = 0;
        function updateTally() {
          placed = slotOf.filter((s, p) => s === p).length;
          count.textContent = `${placed} / ${total}`;
          pips.forEach((pip, i) => pip.classList.toggle('on', i < placed));
          return placed;
        }

        let stopClock = () => {};
        Promise.resolve(ready).then(() => {
          if (done) return;
          started = true;
          t0 = performance.now();
          tiles.forEach((el) => { el.disabled = false; });
          stopClock = L.ladder.clock(hud, params.limitS, timeUp, { pressure: true, edge: scene });
        });

        function center(p) {
          const s = slotOf[p];
          return [((s % g) + 0.5) / g * 100, (Math.floor(s / g) + 0.5) / g * 100];
        }

        function press(p) {
          if (!started || done || slotOf[p] === p) return;
          if (selected === null) {
            selected = p;
            tiles[p].classList.add('selected');
            return;
          }
          // Tocar otra vez la misma pieza la suelta (tolerancia a clics errados).
          if (selected === p) {
            tiles[p].classList.remove('selected');
            selected = null;
            return;
          }
          const a = selected;
          selected = null;
          tiles[a].classList.remove('selected');
          [slotOf[a], slotOf[p]] = [slotOf[p], slotOf[a]];
          [a, p].forEach((q) => {
            tiles[q].classList.add('moving');
            setTimeout(() => tiles[q].classList.remove('moving'), 260);
            place(q);
          });
          const before = placed;
          const k = updateTally();
          if (k > before) {
            flash(tally, 'bump', 320);
            [a, p].filter((q) => slotOf[q] === q).forEach((q) => {
              tiles[q].disabled = true;
              setTimeout(() => {
                flash(tiles[q], 'ok-flash', 520);
                const [x, y] = center(q);
                sparks(fx, x, y, 7);
              }, 240);
            });
            const last = k === total;
            setTimeout(() => { if (L.sound) L.sound.play(last ? 'chime' : 'correct'); }, 240);
          } else {
            // Intercambio que no acomoda ninguna pieza: castigo visual en las dos piezas y el reloj.
            setTimeout(() => {
              if (done) return;
              if (L.sound) L.sound.play('wrong');
              [a, p].forEach((q) => flash(tiles[q], 'nope', 420));
              L.ladder.penalty(hud);
            }, 240);
          }
          if (k === total) win();
        }

        function win() {
          const ms = performance.now() - t0;
          done = true;
          stopClock();
          tiles.forEach((el) => { el.disabled = true; });
          setTimeout(() => {
            board.classList.add('won');
            fx.append(L.el('div', { class: 'fx-stamp' }, '¡POSTAL COMPLETA!', L.icon('check')));
          }, 280);
          setTimeout(() => resolve({ passed: true, ms }), WIN_MS);
        }

        function timeUp() {
          if (done) return;
          done = true;
          tiles.forEach((el) => { el.disabled = true; el.classList.remove('selected'); });
          flash(board, 'miss', 420);
          // Se muestra la postal armada, apagada, antes del aviso de derrota.
          setTimeout(() => {
            board.classList.add('missed');
            slotOf.forEach((_, p) => { slotOf[p] = p; place(p); });
          }, 300);
          setTimeout(() => resolve({ passed: false, ms: params.limitS * 1000 }), TIMEOUT_MS);
        }

        tiles.forEach((el, p) => L.onPress(el, () => press(p), { allowBusy: true, gapMs: PRESS_GAP_MS }));
      });
    },
  };
})();
;
'use strict';

// Corte tropical: frutas venezolanas saltan desde abajo y se cortan pasando el mouse rápido por
// encima (sin clic: el kiosco solo tiene mouse). Cortar `target` frutas antes del reloj pasa el
// nivel; desde N2 salen tormentas y cortar una pierde el nivel. Frutas, mitades, jugo y estela van
// en un canvas; el paisaje de atrás es CSS quieto. ms se toma al cortar la última fruta. El premio
// lo decide el servidor.
(() => {
  const L = window.L360;

  const G = 1.27; // gravedad en altos de tablero por s² (a velocidad 1, ~2 s en el aire)
  const RADIUS = 0.085; // radio de la fruta en altos de tablero
  const MIN_SWIPE = 0.9; // velocidad mínima del mouse para cortar, en altos de tablero por segundo
  const TRAIL_MS = 150; // largo de la estela
  const COMBO_GAP_MS = 240; // cortes más juntos que esto suman combo
  const STORM_GRACE_MS = 1500; // sin tormentas al arrancar
  const MAX_DROPS = 160;
  const MAX_STAINS = 10;
  const WIN_MS = 1400;
  const LOSE_MS = 1600;
  const TIMEOUT_MS = 1200;
  const SOUND_GAP_MS = 110;
  const STORM_SHIELD_MS = 700; // tras un golpe perdonado, las tormentas que sigan en el aire no cuentan
  const SKIES = ['sunset', 'dusk', 'night'];
  const PALM = '<svg viewBox="0 0 120 200" aria-hidden="true"><path d="M62 200C58 150 60 110 70 70" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><path fill="currentColor" d="M70 70C50 50 25 52 5 70 28 58 48 62 70 72ZM70 70C62 40 42 25 20 22 42 34 58 50 69 72ZM70 70C80 42 100 30 118 32 98 40 84 54 71 72ZM70 70C92 58 110 64 118 84 104 70 88 68 71 72ZM70 70C70 45 78 25 92 12 82 32 76 52 71 72Z"/></svg>';

  // Colores en tokens de :root. juice: color del jugo y de la mancha.
  const FRUITS = {
    mango: { rind: '--orange', flesh: '--gold', juice: '--gold' },
    pina: { rind: '--gold', flesh: '--gold-soft', juice: '--gold-soft' },
    patilla: { rind: '--jungle', flesh: '--berry', juice: '--berry' },
    coco: { rind: '--btn-ink', flesh: '--card', juice: '--card' },
    lechosa: { rind: '--gold', flesh: '--orange', juice: '--orange' },
  };
  const FRUIT_IDS = Object.keys(FRUITS);

  function ellipse(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  }

  function shine(ctx, r, c) {
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = c('--card');
    ellipse(ctx, -r * 0.38, -r * 0.4, r * 0.26, r * 0.14, -0.7);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function leaf(ctx, x, y, len, rot, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.45, len, 0);
    ctx.quadraticCurveTo(len * 0.5, len * 0.25, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  // Fruta entera, centrada en (0,0) con radio r. Plana: cuerpo, un detalle y un brillo.
  function drawWhole(ctx, id, r, c) {
    const f = FRUITS[id];
    if (id === 'mango') {
      ctx.save();
      ctx.rotate(-0.35);
      ellipse(ctx, 0, 0, r, r * 0.84);
      ctx.fillStyle = c(f.rind);
      ctx.fill();
      ctx.clip();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = c('--coral');
      ellipse(ctx, r * 0.45, -r * 0.45, r * 0.8, r * 0.7);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      leaf(ctx, r * 0.05, -r * 0.82, r * 0.75, -0.5, c('--jungle'));
    } else if (id === 'pina') {
      for (let k = -2; k <= 2; k += 1) leaf(ctx, 0, -r * 0.7, r * (0.75 - Math.abs(k) * 0.1), -Math.PI / 2 + k * 0.38, c(k % 2 ? '--seafoam' : '--jungle'));
      ctx.save();
      ellipse(ctx, 0, r * 0.12, r * 0.8, r * 0.9);
      ctx.fillStyle = c(f.rind);
      ctx.fill();
      ctx.clip();
      ctx.strokeStyle = c('--coral');
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = r * 0.07;
      for (let k = -3; k <= 3; k += 1) {
        ctx.beginPath(); ctx.moveTo(k * r * 0.42 - r, -r); ctx.lineTo(k * r * 0.42 + r, r * 1.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(k * r * 0.42 + r, -r); ctx.lineTo(k * r * 0.42 - r, r * 1.2); ctx.stroke();
      }
      ctx.restore();
    } else if (id === 'patilla') {
      ctx.save();
      ellipse(ctx, 0, 0, r, r * 0.92);
      ctx.fillStyle = c(f.rind);
      ctx.fill();
      ctx.clip();
      ctx.strokeStyle = c('--seafoam-deep');
      ctx.lineWidth = r * 0.2;
      for (let k = -2; k <= 2; k += 1) {
        ctx.beginPath();
        ctx.moveTo(k * r * 0.46, -r);
        ctx.bezierCurveTo(k * r * 0.46 + r * 0.18, -r * 0.3, k * r * 0.46 - r * 0.18, r * 0.3, k * r * 0.46, r);
        ctx.stroke();
      }
      ctx.restore();
    } else if (id === 'coco') {
      ellipse(ctx, 0, 0, r, r);
      ctx.fillStyle = c(f.rind);
      ctx.fill();
      ctx.lineWidth = r * 0.09;
      ctx.strokeStyle = c('--coral');
      ctx.stroke();
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = r * 0.05;
      for (let k = 0; k < 7; k += 1) {
        const a = (k / 7) * Math.PI * 2 + 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45);
        ctx.lineTo(Math.cos(a + 0.2) * r * 0.75, Math.sin(a + 0.2) * r * 0.75);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = c('--ink-deep');
      [[-0.2, -0.55], [0.2, -0.55], [0, -0.3]].forEach(([x, y]) => { ellipse(ctx, x * r, y * r, r * 0.1, r * 0.1); ctx.fill(); });
    } else {
      ctx.save();
      ellipse(ctx, 0, 0, r * 0.74, r, 0.5);
      ctx.fillStyle = c(f.rind);
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = c('--jungle');
      ellipse(ctx, -r * 0.5, -r * 0.95, r * 0.8, r * 0.7);
      ctx.fill();
      ctx.restore();
    }
    shine(ctx, r, c);
  }

  // Mitad: medio disco con el borde plano sobre el eje x y la cáscara hacia +y; la pulpa a la vista.
  function drawHalf(ctx, id, r, c) {
    const f = FRUITS[id];
    const half = (rad, color) => {
      ctx.beginPath();
      ctx.moveTo(-rad, 0);
      ctx.arc(0, 0, rad, Math.PI, 0, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    half(r, c(f.rind));
    half(r * 0.84, c(f.flesh));
    ctx.fillStyle = c('--ink-deep');
    if (id === 'patilla') {
      [0.5, 1.1, 1.6, 2.1, 2.7].forEach((a) => { ellipse(ctx, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.07, r * 0.11, a); ctx.fill(); });
    } else if (id === 'lechosa') {
      for (let k = 0; k < 7; k += 1) { ellipse(ctx, (k - 3) * r * 0.1, r * 0.22 + (k % 2) * r * 0.1, r * 0.06, r * 0.06); ctx.fill(); }
    } else if (id === 'mango') {
      ctx.fillStyle = c('--sand');
      ctx.globalAlpha = 0.6;
      ellipse(ctx, 0, r * 0.28, r * 0.42, r * 0.22);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (id === 'coco') {
      half(r * 0.55, c('--sand'));
    } else {
      ctx.fillStyle = c('--gold');
      ellipse(ctx, 0, r * 0.3, r * 0.16, r * 0.4);
      ctx.fill();
    }
  }

  // Tormenta: nube oscura con un rayo dorado y borde naranja, para que se lea como "no tocar".
  function drawStorm(ctx, r, c) {
    ctx.fillStyle = c('--dusk-3');
    ctx.strokeStyle = c('--orange');
    ctx.lineWidth = r * 0.08;
    const puffs = [[-0.48, 0.12, 0.46], [0, -0.18, 0.6], [0.5, 0.1, 0.46], [0.02, 0.22, 0.5]];
    puffs.forEach(([x, y, s]) => { ellipse(ctx, x * r, y * r, s * r, s * r); ctx.stroke(); });
    puffs.forEach(([x, y, s]) => { ellipse(ctx, x * r, y * r, s * r, s * r); ctx.fill(); });
    ctx.fillStyle = c('--gold');
    ctx.beginPath();
    ctx.moveTo(r * 0.12, -r * 0.12);
    ctx.lineTo(-r * 0.22, r * 0.46);
    ctx.lineTo(r * 0.02, r * 0.46);
    ctx.lineTo(-r * 0.16, r * 1.02);
    ctx.lineTo(r * 0.3, r * 0.3);
    ctx.lineTo(r * 0.06, r * 0.3);
    ctx.lineTo(r * 0.24, -r * 0.12);
    ctx.closePath();
    ctx.fill();
  }

  // Sprite pre-renderizado a la densidad de la pantalla: cada cuadro solo hace drawImage.
  function sprite(r, draw) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.ceil(r * 3);
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(size * dpr);
    cv.height = cv.width;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, (size * dpr) / 2, (size * dpr) / 2);
    draw(ctx);
    return { cv, size };
  }

  function buildLand(sky) {
    const land = L.el('div', { class: 'ct-land', 'aria-hidden': 'true' });
    land.innerHTML = `<div class="ct-sun"></div><div class="ct-sea"></div>
      <i class="ct-palm l">${PALM}</i><i class="ct-palm r">${PALM}</i>`;
    land.dataset.sky = sky;
    return land;
  }

  function segDist(px, py, a, dx, dy, len2) {
    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / len2));
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }

  L.games.corte = {
    ladder: true,
    title: 'Corte tropical',
    tagline: 'Corta las frutas al vuelo deslizando el dedo. ¡Esquiva la tormenta!',
    livesIcon: 'umbrella',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="14" r="6"/><path d="M9 8c0-2 1-3.5 3-4.5"/><path d="M4 21 21 4"/></svg>',

    describeLevel(p) {
      return `${p.target} frutas · ${p.limitS} s${p.storm ? ' · con tormentas' : ''}`;
    },

    playLevel(stage, n, params, ready) {
      return new Promise((resolve) => {
        const css = getComputedStyle(document.documentElement);
        const tok = (k) => css.getPropertyValue(k).trim();
        const speed = params.speed || 1;

        const canvas = L.el('canvas', { class: 'ct-canvas' });
        const flashEl = L.el('div', { class: 'ct-flash' });
        const fx = L.el('div', { class: 'ct-fx' });
        const board = L.el('div', { class: 'ct-board', 'data-sky': params.sky || SKIES[(n - 1) % SKIES.length] },
          buildLand(params.sky || SKIES[(n - 1) % SKIES.length]), canvas, flashEl, fx);
        const count = L.el('b', {}, '0');
        const tally = L.el('div', { class: 'skill-tally ct-tally' }, count, L.el('span', {}, `/ ${params.target}`));
        const meterFill = L.el('i');
        const hud = L.el('div', { class: 'skill-clock' });
        // Intentos (config.json > ladder.games.corte.lives, los lleva el servidor entre niveles):
        // cada tormenta cortada gasta un paraguas y el juego sigue; sin paraguas, pierde.
        const hasLives = params.lives != null;
        const lives = Number.isInteger(params.lives) && params.lives > 0 ? params.lives : 1;
        const lifeIcons = Array.from({ length: lives }, () => L.el('i', { class: 'on' }, L.icon('umbrella')));
        const livesBox = hasLives ? L.el('div', { class: 'runway-lives ct-lives' },
          L.el('span', {}, 'Intentos'), L.el('div', { class: 'runway-lives-row' }, lifeIcons)) : null;
        const b = (t) => L.el('b', {}, t);
        const stormHint = params.storm
          ? (hasLives ? [' Cada ', b('tormenta'), ' que cortes gasta un paraguas.'] : [' Si cortas una ', b('tormenta'), ', pierdes.'])
          : (hasLives ? [' Más adelante salen ', b('tormentas'), ': cortar una gasta un paraguas.'] : '');
        stage.classList.add('skill-stage');
        const scene = L.el('div', { class: 'skill-game' },
          board,
          L.el('div', { class: 'skill-side' },
            hud,
            L.el('div', { class: 'skill-label' }, 'Frutas cortadas'),
            tally,
            L.el('div', { class: 'ct-meter' }, meterFill),
            livesBox,
            L.el('p', { class: 'skill-hint' }, 'Pasa el mouse ', L.el('b', {}, 'rápido'), ' sobre las frutas para cortarlas.', stormHint),
          ),
        );
        stage.append(scene);

        const box = board.getBoundingClientRect();
        const W = Math.max(200, Math.round(box.width));
        const H = Math.max(200, Math.round(box.height));
        const ctx = L.fitCanvas(canvas, W, H);
        const R = Math.max(18, H * RADIUS);
        const g = G * H * speed * speed;
        const whole = {};
        const halves = {};
        FRUIT_IDS.forEach((id) => {
          whole[id] = sprite(R, (c) => drawWhole(c, id, R, tok));
          halves[id] = sprite(R, (c) => drawHalf(c, id, R, tok));
        });
        const storm = sprite(R * 1.15, (c) => drawStorm(c, R * 1.15, tok));
        const juice = Object.fromEntries(FRUIT_IDS.map((id) => [id, tok(FRUITS[id].juice)]));
        const gold = tok('--gold');
        const cream = tok('--card');

        const objs = []; // frutas, tormentas y mitades en vuelo
        const drops = [];
        const stains = [];
        const trail = [];
        let started = false;
        let done = false;
        let t0 = 0;
        let nextVolley = 0;
        let cut = 0;
        let combo = 0;
        let lastCut = 0;
        let lastSound = 0;
        let pointer = null;
        let misses = 0;
        let shieldUntil = 0;
        let stopClock = () => {};

        function flash(el, cls, ms) {
          el.classList.remove(cls);
          void el.offsetWidth;
          el.classList.add(cls);
          setTimeout(() => el.classList.remove(cls), ms);
        }

        function launch(kind, delay) {
          const r = kind === 'storm' ? R * 1.15 : R;
          const x0 = W * (0.16 + Math.random() * 0.68);
          const y0 = H + r * 1.2;
          const h = y0 - H * (0.12 + Math.random() * 0.3); // cumbre entre 12% y 42% del alto
          const air = 2 * Math.sqrt((2 * h) / g);
          const tx = W * (0.28 + Math.random() * 0.44);
          objs.push({
            kind, r, wait: delay,
            id: kind === 'storm' ? 'storm' : FRUIT_IDS[Math.floor(Math.random() * FRUIT_IDS.length)],
            x: x0, y: y0, vx: (tx - x0) / air, vy: -Math.sqrt(2 * g * h),
            a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 2.6 * speed,
          });
        }

        // Tandas de 1 a 2-4 piezas; la próxima llega cuando toca según `rate` (piezas por segundo).
        function volley(elapsedMs) {
          const maxK = params.rate < 1.4 ? 2 : params.rate < 1.9 ? 3 : 4;
          const k = 1 + Math.floor(Math.random() * maxK);
          let storms = 0;
          for (let i = 0; i < k; i += 1) {
            const isStorm = params.storm > 0 && elapsedMs > STORM_GRACE_MS && storms === 0 && Math.random() < params.storm;
            if (isStorm) storms += 1;
            launch(isStorm ? 'storm' : 'fruit', i * (0.12 + Math.random() * 0.12));
          }
          nextVolley = elapsedMs + (k / params.rate) * 1000;
        }

        function splash(o, ux, uy) {
          const color = juice[o.id];
          for (let i = 0; i < 12 && drops.length < MAX_DROPS; i += 1) {
            const side = i % 2 ? 1 : -1;
            const a = Math.atan2(uy, ux) + side * (Math.PI / 2) + (Math.random() - 0.5) * 1.6;
            const v = H * (0.4 + Math.random() * 0.8);
            const life = 0.45 + Math.random() * 0.4;
            drops.push({ x: o.x, y: o.y, vx: Math.cos(a) * v + o.vx * 0.3, vy: Math.sin(a) * v - H * 0.2, r: R * (0.06 + Math.random() * 0.09), life, max: life, color });
          }
          if (stains.length >= MAX_STAINS) stains.shift();
          stains.push({ x: o.x, y: o.y, r: o.r * 1.25, a: Math.random() * Math.PI, life: 1.6, max: 1.6, color });
        }

        function slice(o, ux, uy) {
          o.dead = true;
          const nx = -uy;
          const ny = ux;
          const ang = Math.atan2(uy, ux);
          [1, -1].forEach((s) => objs.push({
            kind: 'half', id: o.id, r: o.r, wait: 0,
            x: o.x + nx * s * o.r * 0.12, y: o.y + ny * s * o.r * 0.12,
            vx: o.vx * 0.6 + nx * s * H * 0.28 + ux * H * 0.12,
            vy: Math.min(o.vy, 0) * 0.35 + ny * s * H * 0.28 - H * 0.12,
            a: ang + (s > 0 ? 0 : Math.PI), va: s * (2 + Math.random() * 2.5),
          }));
          splash(o, ux, uy);

          cut += 1;
          count.textContent = String(cut);
          meterFill.style.transform = `scaleX(${Math.min(1, cut / params.target)})`;
          tally.classList.remove('bump');
          void tally.offsetWidth;
          tally.classList.add('bump');
          const now = performance.now();
          combo = now - lastCut < COMBO_GAP_MS ? combo + 1 : 1;
          lastCut = now;
          if (combo >= 3) showCombo(o.x, o.y, combo);
          if (L.sound && now - lastSound > SOUND_GAP_MS) { lastSound = now; L.sound.play('whoosh'); }
          if (cut >= params.target) win();
        }

        function showCombo(x, y, k) {
          fx.querySelectorAll('.ct-combo').forEach((el) => el.remove());
          const el = L.el('div', { class: 'ct-combo', style: `left:${(x / W) * 100}%;top:${(y / H) * 100}%` }, `¡COMBO ×${k}!`);
          fx.append(el);
          setTimeout(() => el.remove(), 900);
        }

        function hitStorm(o, now) {
          misses += 1;
          if (L.sound) L.sound.play('wrong');
          const icon = lifeIcons[lives - misses];
          if (icon) { icon.classList.remove('on'); flash(icon, 'lost', 600); }
          if (misses < lives) {
            // Golpe perdonado: la tormenta estalla, cuesta un paraguas y todo sigue como iba.
            o.dead = true;
            shieldUntil = now + STORM_SHIELD_MS;
            flash(flashEl, 'on', 560);
            flash(board, 'miss', 420);
            if (L.ladder.penalty) L.ladder.penalty(hud);
            const stamp = L.el('div', { class: 'fx-stamp storm soft' }, '¡TORMENTA!');
            fx.append(stamp);
            setTimeout(() => stamp.remove(), 900);
            return;
          }
          const ms = performance.now() - t0;
          done = true;
          stopClock();
          o.frozen = true;
          flashEl.classList.add('on');
          board.classList.add('miss');
          if (L.ladder.penalty) L.ladder.penalty(hud);
          fx.append(L.el('div', { class: 'fx-stamp storm' }, '¡TORMENTA!'));
          setTimeout(() => resolve({ passed: false, ms: Math.min(ms, params.limitS * 1000), misses }), LOSE_MS);
        }

        function win() {
          const ms = performance.now() - t0;
          done = true;
          stopClock();
          setTimeout(() => {
            board.classList.add('won');
            fx.append(L.el('div', { class: 'fx-stamp' }, '¡COSECHA COMPLETA!', L.icon('check')));
          }, 200);
          if (L.sound) L.sound.play('chime');
          setTimeout(() => resolve({ passed: true, ms, misses }), WIN_MS);
        }

        function timeUp() {
          if (done) return;
          done = true;
          board.classList.add('miss');
          setTimeout(() => resolve({ passed: false, ms: params.limitS * 1000, misses }), TIMEOUT_MS);
        }

        // El corte se decide en cada movimiento del mouse: el tramo desde el punto anterior corta lo
        // que toca si va lo bastante rápido (dejar el mouse quieto encima no corta, ni una tormenta).
        canvas.addEventListener('pointermove', (e) => {
          const rect = canvas.getBoundingClientRect();
          const p = { x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() };
          if (pointer && started && !done) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const len2 = dx * dx + dy * dy;
            const len = Math.sqrt(len2);
            if (len > 0 && (len / Math.max(1, p.t - pointer.t)) * 1000 >= MIN_SWIPE * H) {
              for (const o of objs) {
                if (done) break;
                if (o.kind === 'half' || o.dead || o.wait > 0 || o.y - o.r > H) continue;
                if (o.kind === 'storm' && p.t < shieldUntil) continue;
                const reach = o.kind === 'storm' ? o.r * 0.75 : o.r * 1.05;
                if (segDist(o.x, o.y, pointer, dx, dy, len2) > reach) continue;
                if (o.kind === 'storm') hitStorm(o, p.t);
                else slice(o, dx / len, dy / len);
              }
            }
          }
          pointer = p;
          trail.push(p);
        });
        canvas.addEventListener('pointerleave', () => { pointer = null; });

        function step(dt, now) {
          for (const o of objs) {
            if (o.frozen) continue;
            if (o.wait > 0) { o.wait -= dt; continue; }
            o.vy += g * dt;
            o.x += o.vx * dt;
            o.y += o.vy * dt;
            o.a += o.va * dt;
          }
          for (let i = objs.length - 1; i >= 0; i -= 1) {
            const o = objs[i];
            if (o.dead || (o.vy > 0 && o.y - o.r > H + o.r)) objs.splice(i, 1);
          }
          for (let i = drops.length - 1; i >= 0; i -= 1) {
            const d = drops[i];
            d.vy += g * 0.9 * dt;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.life -= dt;
            if (d.life <= 0) drops.splice(i, 1);
          }
          for (let i = stains.length - 1; i >= 0; i -= 1) {
            stains[i].life -= dt;
            if (stains[i].life <= 0) stains.splice(i, 1);
          }
          while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
        }

        function draw() {
          ctx.clearRect(0, 0, W, H);
          for (const s of stains) {
            ctx.globalAlpha = 0.45 * Math.min(1, s.life / 0.6);
            ctx.fillStyle = s.color;
            ellipse(ctx, s.x, s.y, s.r, s.r * 0.7, s.a);
            ctx.fill();
            ellipse(ctx, s.x + s.r * 0.6, s.y - s.r * 0.3, s.r * 0.35, s.r * 0.3, s.a);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          for (const o of objs) {
            if (o.wait > 0) continue;
            const sp = o.kind === 'storm' ? storm : o.kind === 'half' ? halves[o.id] : whole[o.id];
            const grow = o.frozen ? 1.25 : 1;
            ctx.save();
            ctx.translate(o.x, o.y);
            ctx.rotate(o.kind === 'storm' ? Math.sin(o.a) * 0.15 : o.a);
            ctx.drawImage(sp.cv, (-sp.size / 2) * grow, (-sp.size / 2) * grow, sp.size * grow, sp.size * grow);
            ctx.restore();
          }
          for (const d of drops) {
            ctx.globalAlpha = Math.max(0, d.life / d.max);
            ctx.fillStyle = d.color;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          if (trail.length > 1) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 1; i < trail.length; i += 1) {
              const k = i / (trail.length - 1);
              ctx.beginPath();
              ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
              ctx.lineTo(trail[i].x, trail[i].y);
              ctx.globalAlpha = 0.35 * k;
              ctx.strokeStyle = gold;
              ctx.lineWidth = R * 0.34 * k + 1;
              ctx.stroke();
              ctx.globalAlpha = 0.9 * k;
              ctx.strokeStyle = cream;
              ctx.lineWidth = R * 0.1 * k + 1;
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
          if (pointer) {
            ctx.strokeStyle = cream;
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pointer.x, pointer.y, R * 0.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // El bucle vive mientras el canvas esté en pantalla: al pasar a la decisión o al resultado,
        // la escalera reemplaza la escena y el bucle se corta solo.
        let last = 0;
        function frame(now) {
          if (!canvas.isConnected) return;
          const dt = last ? Math.min(0.04, (now - last) / 1000) : 0;
          last = now;
          if (started && !done && now - t0 >= nextVolley) volley(now - t0);
          step(dt, now);
          draw();
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);

        Promise.resolve(ready).then(() => {
          if (done) return;
          started = true;
          t0 = performance.now();
          nextVolley = 0;
          stopClock = L.ladder.clock(hud, params.limitS, timeUp, { pressure: true, edge: scene });
        });
      });
    },
  };
})();
;
'use strict';

// Torre de maletas: la maleta va y viene arriba de la torre y un clic la suelta. Lo que sobresale
// de la de abajo se corta y cae; la torre sigue con el ancho del solape. Soltarla casi justo encaja
// entera (¡PERFECTO!) y tres seguidas la agrandan un poco. Si no pisa nada, se cae y pierdes. Pasa
// al apilar `floors` maletas antes del reloj. Todo DOM: las maletas quietas van con left/bottom
// fijos; la que se mueve, la cámara y lo que cae, solo con transform. El premio lo decide el servidor.
(() => {
  const L = window.L360;

  const BASE_W = 0.38; // ancho de la primera maleta, en anchos de tablero
  const EDGE = 0.03; // margen de los extremos del vaivén, en anchos de tablero
  const CAMERA = 0.6; // la maleta activa nunca sube más allá de este alto del tablero
  const SETTLE_MS = 380; // entre soltar una y que entre la siguiente (lo que cae, la cámara)
  const GROW_STREAK = 3; // perfectos seguidos para que la maleta crezca
  const GROW = 0.05; // cuánto crece, en anchos de tablero (nunca más que la primera)
  const MIN_PERFECT_PX = 3;
  const TAG_MIN_PX = 76; // más angosta que esto, la etiqueta no entra
  const WIN_MS = 2000;
  const LOSE_MS = 1700;
  const TIMEOUT_MS = 1200;
  const COLORS = ['--orange', '--seafoam', '--gold', '--berry', '--lagoon'];
  const TAGS = ['PMV', 'LRV', 'MRD', 'CCS', 'CAJ', 'CBL', 'VLN', 'BRM'];
  const SKIES = ['day', 'sunset', 'night'];

  function bagEl(k, w) {
    return L.el('div', {
      class: w < TAG_MIN_PX ? 'tw-bag slim' : 'tw-bag',
      style: `width:${w}px;--c:var(${COLORS[k % COLORS.length]})`,
    }, L.el('i', { class: 'tw-body' }, L.el('i', { class: 'tw-handle' }), L.el('b', { class: 'tw-tag' }, TAGS[k % TAGS.length])));
  }

  // Suelo del aeropuerto: pista con línea discontinua, terminal y torre de control en silueta y el
  // carrito de equipaje donde se apoya la primera maleta.
  function buildGround(cartX, cartW) {
    const i = (cls, style) => L.el('i', { class: cls, style });
    return L.el('div', { class: 'tw-ground', 'aria-hidden': 'true' },
      i('tw-terminal'), i('tw-ctower'), i('tw-tarmac'),
      L.el('div', { class: 'tw-cart', style: `left:${cartX}px;width:${cartW}px` }, i('tw-wheel l'), i('tw-wheel r')));
  }

  L.games.torre = {
    ladder: true,
    title: 'Torre de maletas',
    tagline: 'Toca la pantalla para soltar cada maleta justo encima de la otra. ¡Lo que sobresale se cae!',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="14" width="18" height="7" rx="1.5"/><rect x="6" y="7" width="13" height="7" rx="1.5"/><path d="M10.5 7V5h4v2"/><path d="M8 17.5h2M14 10.5h2"/></svg>',

    describeLevel(p) {
      return `${p.floors} maletas · ${p.limitS} s`;
    },

    playLevel(stage, n, params, ready) {
      return new Promise((resolve) => {
        const speed = params.speed || 0.8;
        const perfect = params.perfect == null ? 0.04 : params.perfect;
        // Gracia por retardo de la TV, como en Aterriza: se toma la posición de hace `lateMs`.
        const lateMs = Math.min(200, Math.max(0, Number(params.lateMs) || 0));
        const sky = params.sky || SKIES[(n - 1) % SKIES.length];

        const world = L.el('div', { class: 'tw-world' });
        const high = L.el('div', { class: 'tw-high' });
        const clouds = L.el('div', { class: 'tw-clouds', 'aria-hidden': 'true' },
          L.el('i', { class: 'tw-cloud c1' }), L.el('i', { class: 'tw-cloud c2' }), L.el('i', { class: 'tw-cloud c3' }));
        const fx = L.el('div', { class: 'tw-fx' });
        const board = L.el('div', { class: 'tw-board', 'data-sky': sky },
          L.el('div', { class: 'tw-sky' }), high,
          L.el('i', { class: 'tw-jet', 'aria-hidden': 'true' }, L.icon('plane')),
          clouds, world, fx);
        const count = L.el('b', {}, '0');
        const tally = L.el('div', { class: 'skill-tally tw-tally' }, count, L.el('span', {}, `/ ${params.floors}`));
        const meterFill = L.el('i');
        const pips = Array.from({ length: GROW_STREAK }, () => L.el('i'));
        const hud = L.el('div', { class: 'skill-clock' });
        stage.classList.add('skill-stage');
        const scene = L.el('div', { class: 'skill-game' },
          board,
          L.el('div', { class: 'skill-side' },
            hud,
            L.el('div', { class: 'skill-label' }, 'Maletas apiladas'),
            tally,
            L.el('div', { class: 'ct-meter tw-meter' }, meterFill),
            L.el('div', { class: 'tw-streak' }, L.el('span', {}, 'Racha perfecta'), L.el('div', { class: 'skill-pips' }, ...pips)),
            L.el('p', { class: 'skill-hint' }, 'Haz ', L.el('b', {}, 'clic'), ' para soltar la maleta. ',
              L.el('b', {}, `${GROW_STREAK} perfectas`), ' seguidas la agrandan.'),
          ),
        );
        stage.append(scene);

        const box = board.getBoundingClientRect();
        const W = Math.max(240, Math.round(box.width));
        const H = Math.max(240, Math.round(box.height));
        const BH = Math.round(Math.max(30, Math.min(60, H * 0.085)));
        const GROUND = Math.round(H * 0.16);
        const BASE_Y = GROUND + Math.round(BH * 0.6); // tope del carrito
        const w0 = Math.round(W * BASE_W);
        board.style.setProperty('--bw', `${W}px`);
        board.style.setProperty('--bh', `${BH}px`);
        board.style.setProperty('--ground', `${GROUND}px`);
        board.style.setProperty('--cart', `${BASE_Y - GROUND}px`);
        world.append(buildGround(Math.round((W - w0) / 2), w0));

        let top = { x: Math.round((W - w0) / 2), w: w0 };
        let cur = null; // maleta en vaivén: {el, w, y, from, t0, dropped}
        let placed = 0;
        let streak = 0;
        let started = false;
        let done = false;
        let t0 = 0;
        let stopClock = () => {};

        // Vaivén en función del tiempo (no de los cuadros): entra desde afuera por un costado y
        // después rebota entre los márgenes. El clic se evalúa con la hora exacta del pointerdown.
        function posAt(b, t) {
          const lo = W * EDGE;
          const hi = Math.max(lo + 1, W * (1 - EDGE) - b.w);
          const s = (Math.max(0, t - b.t0) / 1000) * speed * W;
          const d = s - (lo + b.w); // la entrada arranca en x = -w
          let u;
          if (d < 0) {
            u = s - b.w;
          } else {
            const span = hi - lo;
            const m = d % (2 * span);
            u = m <= span ? lo + m : hi - (m - span);
          }
          return b.from < 0 ? u : lo + hi - u;
        }

        function camera() {
          const camY = Math.max(0, BASE_Y + (placed + 1) * BH - H * CAMERA);
          world.style.transform = `translateY(${camY}px)`;
          clouds.style.transform = `translateY(${Math.round(camY * 0.35)}px)`;
        }

        function spawn() {
          if (done) return;
          const b = { w: top.w, y: BASE_Y + placed * BH, from: placed % 2 ? 1 : -1, t0: performance.now(), dropped: false };
          b.el = bagEl(placed, b.w);
          b.el.style.bottom = `${b.y}px`;
          b.el.style.transform = `translateX(${posAt(b, b.t0)}px)`;
          world.append(b.el);
          cur = b;
          camera();
        }

        function pop(text, x, y, gold) {
          const el = L.el('div', { class: gold ? 'tw-pop gold' : 'tw-pop', style: `left:${Math.round(x)}px;bottom:${Math.round(y)}px` }, text);
          world.append(el);
          setTimeout(() => el.remove(), 900);
        }

        function progress() {
          count.textContent = String(placed);
          meterFill.style.transform = `scaleX(${Math.min(1, placed / params.floors)})`;
          high.style.opacity = String(Math.min(1, placed / params.floors));
          pips.forEach((p, k) => p.classList.toggle('on', k < streak % GROW_STREAK || (streak > 0 && streak % GROW_STREAK === 0)));
          tally.classList.remove('bump');
          void tally.offsetWidth;
          tally.classList.add('bump');
        }

        function chunk(b, x, w, dir) {
          if (w < 1) return;
          const el = bagEl(placed, w);
          el.classList.add('tw-chunk');
          el.style.left = `${Math.round(x)}px`;
          el.style.bottom = `${b.y}px`;
          el.style.setProperty('--dir', String(dir));
          world.append(el);
          setTimeout(() => el.remove(), 1100);
        }

        function place(b, x, w, hit) {
          b.el.style.transform = '';
          b.el.style.left = `${Math.round(x)}px`;
          b.el.style.width = `${Math.round(w)}px`;
          b.el.classList.toggle('slim', w < TAG_MIN_PX);
          b.el.classList.add('landed');
          if (hit) b.el.classList.add('perfect');
          top = { x, w };
          placed += 1;
          progress();
          if (hit) pop(streak > 1 ? `¡PERFECTO ×${streak}!` : '¡PERFECTO!', x + w / 2, b.y + BH, true);
          if (placed >= params.floors) { win(); return; } // win() suena a juego completo
          // Recortada no es fallo (la torre sigue): golpe de madera neutro; perfecta, acierto.
          if (L.sound) L.sound.play(hit ? 'correct' : 'tap');
          setTimeout(spawn, SETTLE_MS);
        }

        function drop(t) {
          const b = cur;
          b.dropped = true;
          const x = posAt(b, Math.max(b.t0, t));
          const dev = x - top.x;
          const left = Math.max(x, top.x);
          const overlap = Math.min(x + b.w, top.x + top.w) - left;
          if (overlap <= 0) { fall(b, x); return; }
          if (Math.abs(dev) <= Math.max(MIN_PERFECT_PX, perfect * b.w)) {
            streak += 1;
            let nx = top.x;
            let nw = b.w;
            if (streak % GROW_STREAK === 0 && nw < w0) {
              const g = Math.min(w0 - nw, W * GROW);
              nw += g;
              nx = Math.max(0, Math.min(W - nw, nx - g / 2));
              setTimeout(() => pop('¡CRECE!', nx + nw / 2, b.y + BH * 2.1, false), 260);
            }
            place(b, nx, nw, true);
          } else {
            streak = 0;
            chunk(b, dev > 0 ? left + overlap : x, b.w - overlap, dev > 0 ? 1 : -1);
            place(b, left, overlap, false);
          }
        }

        function fall(b, x) {
          const ms = performance.now() - t0;
          done = true;
          stopClock();
          b.el.style.transform = `translateX(${x}px)`;
          b.el.style.setProperty('--dir', String(x > top.x ? 1 : -1));
          b.el.classList.add('falling');
          board.classList.add('miss');
          if (L.ladder.penalty) L.ladder.penalty(hud);
          if (L.sound) L.sound.play('wrong');
          fx.append(L.el('div', { class: 'fx-stamp lost' }, '¡SE CAYÓ!'));
          setTimeout(() => resolve({ passed: false, ms: Math.min(ms, params.limitS * 1000) }), LOSE_MS);
        }

        function win() {
          // El servidor rechaza tiempos por debajo de minS (que no llega al cliente): la entrada desde
          // afuera y la pausa entre maletas lo dejan fuera de alcance (≥ 0,4 s por maleta).
          const ms = performance.now() - t0;
          done = true;
          stopClock();
          const total = BASE_Y + placed * BH + BH;
          world.style.transform = `scale(${Math.min(1, (H * 0.9) / total).toFixed(3)})`;
          clouds.style.transform = '';
          board.classList.add('won');
          setTimeout(() => {
            fx.append(L.el('div', { class: 'fx-stamp' }, '¡TORRE COMPLETA!', L.icon('check')));
            if (L.ladder.burst) L.ladder.burst(fx, ((top.x + top.w / 2) / W) * 100, 22, 14);
          }, 450);
          if (L.sound) L.sound.play('chime');
          setTimeout(() => resolve({ passed: true, ms }), WIN_MS);
        }

        function timeUp() {
          if (done) return;
          done = true;
          if (cur) cur.dropped = true;
          board.classList.add('miss');
          setTimeout(() => resolve({ passed: false, ms: params.limitS * 1000 }), TIMEOUT_MS);
        }

        // Soltar en pointerdown (no al levantar el botón): en un juego de reflejos los ~100 ms de un
        // clic se notarían. Cuenta la posición del último cuadro dibujado, que es la que se ve.
        let shown = 0;
        board.addEventListener('pointerdown', (e) => {
          if (e.button !== 0 || !started || done || !cur || cur.dropped) return;
          drop((shown || performance.now()) - lateMs);
        });

        function frame(now) {
          if (!board.isConnected) return;
          shown = now;
          if (cur && !cur.dropped) cur.el.style.transform = `translateX(${posAt(cur, now).toFixed(1)}px)`;
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        camera();

        Promise.resolve(ready).then(() => {
          if (done) return;
          started = true;
          t0 = performance.now();
          spawn();
          stopClock = L.ladder.clock(hud, params.limitS, timeUp, { pressure: true, edge: scene });
        });
      });
    },
  };
})();
;
'use strict';

// Sigue tu maleta: en la cinta de equipaje hay `bags` maletas iguales. El pase de abordar entra en
// una, la cinta arranca y las maletas se intercambian de a pares en arco (`swaps` veces, `swapMs`
// cada una). Cuando paran, el jugador hace clic en la que cree que tiene el pase. El reloj visible
// arranca recién al elegir, con lo que queda de `limitS`; el tiempo del nivel se cuenta desde el
// inicio, así que la entrada del pase y la mezcla ya superan el mínimo del servidor. Todo DOM: las
// maletas se mueven solo con transform (Web Animations). El premio lo decide el servidor.
(() => {
  const L = window.L360;

  const ENTRY_MS = 1500; // el pase aparece, vuela sobre su maleta y entra
  const PAUSE_MS = 350; // entre la entrada y la primera mezcla
  const GAP_MS = 50; // entre dos intercambios
  const TRACK_BIAS = 0.5; // chance de que la maleta del pase esté en el intercambio
  const REVEAL_MS = 650; // entre abrir la elegida y abrir la correcta (si falló)
  const WIN_MS = 2100;
  const LOSE_MS = 2300;
  const TIMEOUT_MS = 1500;
  const PRESS_GAP_MS = 120;
  const SKIES = ['day', 'sunset', 'night'];
  const EASE_X = 'cubic-bezier(.45, 0, .55, 1)';

  function passEl() {
    return L.el('div', { class: 'mv-pass' },
      L.el('i', { class: 'mv-pass-stub' }, L.icon('plane')),
      L.el('div', { class: 'mv-pass-body' }, L.el('b', {}, 'PASE'), L.el('i', { class: 'mv-pass-code' })));
  }

  function bagEl() {
    const i = (cls) => L.el('i', { class: cls });
    const lift = L.el('div', { class: 'mv-lift' },
      L.el('div', { class: 'mv-case' }, i('mv-grip'), i('mv-shell'), i('mv-lid'), L.el('b', { class: 'mv-tag' }, 'L360'), i('mv-wheels')));
    return { el: L.el('div', { class: 'mv-bag' }, lift), lift, box: lift.firstChild };
  }

  // Terminal de llegadas: ventanales con el cielo del nivel y un avión que cruza, cartel de la cinta.
  function buildHall(sky) {
    const i = (cls, ...kids) => L.el('i', { class: cls }, ...kids);
    return L.el('div', { class: 'mv-hall', 'data-sky': sky, 'aria-hidden': 'true' },
      L.el('div', { class: 'mv-windows' }, i('mv-jet', L.icon('plane'))),
      L.el('div', { class: 'mv-sign' }, i('mv-sign-dot'), L.el('span', {}, 'CINTA 3 · VUELO LT-360')),
    );
  }

  L.games.maleta = {
    ladder: true,
    title: 'Sigue tu maleta',
    tagline: 'Tu pase entra en una maleta y la cinta las mezcla. Toca donde quedó.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="12" height="12" rx="2"/><path d="M10 8V5h4v3"/><path d="M9 20v1.5M15 20v1.5"/><path d="M4 4.5c2-1.4 4-1.4 6 0" stroke-dasharray="1.5 1.8"/><path d="M11 13.5h2"/></svg>',

    describeLevel(p) {
      return `${p.bags} maletas · ${p.swaps} mezclas`;
    },

    playLevel(stage, n, params, ready) {
      return new Promise((resolve) => {
        const count = params.bags;
        const swaps = params.swaps;
        const swapMs = params.swapMs;
        const limitMs = params.limitS * 1000;
        const sky = params.sky || SKIES[(n - 1) % SKIES.length];

        const slats = L.el('i', { class: 'mv-slats' });
        const belt = L.el('div', { class: 'mv-belt', 'aria-hidden': 'true' }, slats, L.el('i', { class: 'mv-rail' }));
        const floor = L.el('div', { class: 'mv-floor' });
        const fx = L.el('div', { class: 'mv-fx' });
        const prompt = L.el('div', { class: 'mv-prompt' }, '¿Dónde quedó tu pase?');
        const board = L.el('div', { class: 'mv-board', 'data-sky': sky }, buildHall(sky), belt, floor, prompt, fx);
        const phase = L.el('div', { class: 'mv-phase' }, 'Mira bien');
        const tallyNum = L.el('b', {}, '0');
        const tally = L.el('div', { class: 'skill-tally mv-tally' }, tallyNum, L.el('span', {}, `/ ${swaps}`));
        const meterFill = L.el('i');
        const hud = L.el('div', { class: 'skill-clock mv-clock' },
          L.el('div', { class: 'mv-wait' }, L.icon('clock'), 'El reloj arranca al elegir'));
        stage.classList.add('skill-stage');
        const scene = L.el('div', { class: 'skill-game' },
          board,
          L.el('div', { class: 'skill-side' },
            hud,
            phase,
            L.el('div', { class: 'skill-label' }, 'Mezclas'),
            tally,
            L.el('div', { class: 'ct-meter mv-meter' }, meterFill),
            L.el('p', { class: 'skill-hint' }, 'Sigue la maleta con ', L.el('b', {}, 'tu pase'), '. Cuando la cinta pare, haz ',
              L.el('b', {}, 'clic'), ' en ella.'),
          ),
        );
        stage.append(scene);

        const box = board.getBoundingClientRect();
        const W = Math.max(320, Math.round(box.width));
        const H = Math.max(260, Math.round(box.height));
        const BELT = Math.round(H * 0.2); // alto de la cinta desde el piso del tablero
        const FLOOR = Math.round(BELT * 0.62); // donde apoyan las ruedas (CSS .mv-bag bottom)
        const spacing = W / (count + 1);
        const BW = Math.round(Math.min(spacing * 0.62, H * 0.25));
        const BH = Math.round(BW * 1.28);
        const ARC = Math.round(BH * 0.6);
        board.style.setProperty('--belt', `${BELT}px`);
        board.style.setProperty('--bw', `${BW}px`);
        board.style.setProperty('--bh', `${BH}px`);
        board.style.setProperty('--W', `${W}px`);
        const slotX = (k) => Math.round(spacing * (k + 1) - BW / 2);

        // bags[b] = maleta b; at[s] = maleta en el lugar s. `target` es la del pase.
        const bags = Array.from({ length: count }, (_, k) => {
          const b = bagEl();
          b.slot = k;
          b.el.style.transform = `translateX(${slotX(k)}px)`;
          floor.append(b.el);
          return b;
        });
        const at = bags.slice();
        const target = bags[Math.floor(Math.random() * count)];

        let belted = null;
        try {
          belted = slats.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(4rem)' }], { duration: 1800, iterations: Infinity });
        } catch { /* sin Web Animations: la cinta queda quieta */ }

        let choosing = false;
        let done = false;
        let t0 = 0;
        let stopClock = () => {};
        const timers = [];
        const later = (fn, ms) => timers.push(setTimeout(() => { if (board.isConnected) fn(); }, ms));

        function setPhase(text, cls) {
          phase.textContent = text;
          phase.className = cls ? `mv-phase ${cls}` : 'mv-phase';
        }

        // El pase aparece arriba, vuela hasta su maleta y entra; la maleta se abre y se cierra.
        function enterPass() {
          const p = passEl();
          const pw = Math.round(BW * 0.9);
          p.style.width = `${pw}px`;
          fx.append(p);
          const x0 = W / 2 - pw / 2;
          const y0 = H * 0.12;
          const x1 = slotX(target.slot) + (BW - pw) / 2;
          const y1 = H - FLOOR - BH - pw * 0.55;
          const y2 = H - FLOOR - BH * 0.55;
          const opts = { duration: ENTRY_MS, easing: 'linear', fill: 'forwards' };
          try {
            p.animate([
              { transform: `translate(${x0}px, ${y0}px) scale(0.5) rotate(-8deg)`, opacity: 0 },
              { transform: `translate(${x0}px, ${y0}px) scale(1.15) rotate(-4deg)`, opacity: 1, offset: 0.2, easing: 'cubic-bezier(.3, 0, .3, 1)' },
              { transform: `translate(${x1}px, ${y1}px) scale(1) rotate(6deg)`, opacity: 1, offset: 0.58, easing: 'cubic-bezier(.5, 0, .9, .6)' },
              { transform: `translate(${x1}px, ${y2}px) scale(0.55) rotate(0deg)`, opacity: 0, offset: 0.86 },
              { transform: `translate(${x1}px, ${y2}px) scale(0.55)`, opacity: 0 },
            ], opts);
          } catch { p.style.opacity = '0'; }
          later(() => { target.el.classList.add('open'); if (L.sound) L.sound.play('paper'); }, ENTRY_MS * 0.5);
          later(() => { target.el.classList.remove('open'); target.el.classList.add('got'); }, ENTRY_MS * 0.9);
          later(() => { p.remove(); target.el.classList.remove('got'); }, ENTRY_MS + 700);
        }

        // Dos maletas cambian de lugar: una pasa por arriba (se aleja) y la otra por abajo (se acerca).
        function swapPair(s1, s2) {
          const a = at[s1];
          const b = at[s2];
          at[s1] = b;
          at[s2] = a;
          a.slot = s2;
          b.slot = s1;
          const move = (bag, from, to, up) => {
            const xa = slotX(from);
            const xb = slotX(to);
            bag.el.classList.add(up ? 'back' : 'front');
            bag.el.style.transform = `translateX(${xb}px)`;
            try {
              bag.el.animate([{ transform: `translateX(${xa}px)` }, { transform: `translateX(${xb}px)` }], { duration: swapMs, easing: EASE_X });
              const lift = up ? `translateY(${-ARC}px) scale(0.9)` : `translateY(${Math.round(BH * 0.14)}px) scale(1.08)`;
              bag.lift.animate([
                { transform: 'none', easing: 'ease-out' },
                { transform: lift, offset: 0.5, easing: 'ease-in' },
                { transform: 'none' },
              ], { duration: swapMs });
            } catch { /* sin Web Animations: salta directo al lugar nuevo */ }
            setTimeout(() => bag.el.classList.remove('back', 'front'), swapMs);
          };
          move(a, s1, s2, Math.random() < 0.5);
          move(b, s2, s1, !a.el.classList.contains('back'));
        }

        function pickPair(last) {
          for (let tries = 0; tries < 20; tries += 1) {
            let s1;
            let s2;
            if (Math.random() < TRACK_BIAS) {
              s1 = target.slot;
              s2 = Math.floor(Math.random() * (count - 1));
              if (s2 >= s1) s2 += 1;
            } else {
              s1 = Math.floor(Math.random() * count);
              s2 = Math.floor(Math.random() * (count - 1));
              if (s2 >= s1) s2 += 1;
            }
            const key = `${Math.min(s1, s2)}-${Math.max(s1, s2)}`;
            if (key !== last || tries === 19) return [s1, s2, key];
          }
          return [0, 1, '0-1'];
        }

        function mix() {
          setPhase('Mezclando', 'busy');
          board.classList.add('mixing');
          if (belted && belted.updatePlaybackRate) belted.updatePlaybackRate(5);
          let k = 0;
          let last = '';
          const step = () => {
            if (done) return;
            if (k >= swaps) { choose(); return; }
            const [s1, s2, key] = pickPair(last);
            last = key;
            swapPair(s1, s2);
            k += 1;
            tallyNum.textContent = String(k);
            meterFill.style.transform = `scaleX(${k / swaps})`;
            if (L.sound && k % 2) L.sound.play('whoosh');
            later(step, swapMs + GAP_MS);
          };
          step();
        }

        function choose() {
          board.classList.remove('mixing');
          board.classList.add('choosing');
          if (belted && belted.updatePlaybackRate) belted.updatePlaybackRate(0.35);
          setPhase('¡Elige!', 'go');
          choosing = true;
          const left = limitMs - (performance.now() - t0);
          if (left <= 0) { timeUp(); return; }
          hud.replaceChildren();
          stopClock = L.ladder.clock(hud, left / 1000, timeUp, { pressure: true, edge: scene });
          if (L.sound) L.sound.play('rise');
        }

        // sfx: 'correct'/'wrong' al elegir; 'paper' al mostrar dónde estaba (como en la entrada).
        function open(bag, withPass, sfx) {
          bag.el.classList.add('open', withPass ? 'right' : 'wrong');
          if (withPass) bag.box.append(passEl());
          else bag.box.append(L.el('b', { class: 'mv-empty' }, 'VACÍA'));
          if (L.sound) L.sound.play(sfx);
        }

        function finish() {
          done = true;
          choosing = false;
          stopClock();
          board.classList.remove('choosing');
          if (belted && belted.updatePlaybackRate) belted.updatePlaybackRate(0);
        }

        function pick(bag) {
          if (!choosing || done) return;
          const ms = performance.now() - t0;
          if (ms >= limitMs) { timeUp(); return; }
          finish();
          if (bag === target) {
            open(bag, true, 'correct');
            setPhase('¡Encontrado!', 'go');
            const cx = ((slotX(bag.slot) + BW / 2) / W) * 100;
            later(() => {
              fx.append(L.el('div', { class: 'fx-stamp' }, '¡PASE ENCONTRADO!', L.icon('check')));
              if (L.ladder.burst) L.ladder.burst(fx, cx, 40, 14);
              if (L.sound) L.sound.play('chime');
            }, 380);
            setTimeout(() => resolve({ passed: true, ms }), WIN_MS);
            return;
          }
          open(bag, false, 'wrong');
          board.classList.add('miss');
          if (L.ladder.penalty) L.ladder.penalty(hud);
          setPhase('No era esa', 'lost');
          later(() => {
            open(target, true, 'paper');
            fx.append(L.el('div', { class: 'fx-stamp lost' }, '¡ESTABA AQUÍ!'));
          }, REVEAL_MS);
          setTimeout(() => resolve({ passed: false, ms: Math.min(ms, limitMs) }), LOSE_MS);
        }

        function timeUp() {
          if (done) return;
          finish();
          board.classList.add('miss');
          setPhase('Se acabó', 'lost');
          open(target, true, 'paper');
          setTimeout(() => resolve({ passed: false, ms: limitMs }), TIMEOUT_MS);
        }

        // Sin clic de toque: elegir ya suena a acierto o fallo (y mientras barajan no hay nada que tocar).
        bags.forEach((b) => L.onPress(b.el, () => pick(b), { allowBusy: true, silent: true, gapMs: PRESS_GAP_MS }));

        Promise.resolve(ready).then(() => {
          if (done || !board.isConnected) return;
          t0 = performance.now();
          enterPass();
          later(mix, ENTRY_MS + PAUSE_MS);
        });
      });
    },
  };
})();
;
window.JUEGOS_WEB = {
  "juegos": {
    "aterriza": {
      "label": "Aterriza el avión",
      "levels": [
        {
          "limitS": 20,
          "minS": 2,
          "landings": 3,
          "zone": 0.22,
          "speed": 0.5
        },
        {
          "limitS": 24,
          "minS": 3,
          "landings": 4,
          "zone": 0.15,
          "speed": 0.7
        },
        {
          "limitS": 28,
          "minS": 3,
          "landings": 5,
          "zone": 0.1,
          "speed": 0.9
        }
      ],
      "lives": {
        "start": 3,
        "minLevel3": 2
      }
    },
    "memoria": {
      "label": "Memoria de destinos",
      "levels": [
        {
          "limitS": 20,
          "minS": 2,
          "pairs": 4
        },
        {
          "limitS": 28,
          "minS": 4,
          "pairs": 6
        },
        {
          "limitS": 42,
          "minS": 7,
          "pairs": 10
        }
      ],
      "lives": null
    },
    "rompecabezas": {
      "label": "Rompecabezas postal",
      "levels": [
        {
          "limitS": 22,
          "minS": 4,
          "grid": 3
        },
        {
          "limitS": 42,
          "minS": 8,
          "grid": 4
        },
        {
          "limitS": 60,
          "minS": 12,
          "grid": 5
        }
      ],
      "lives": null
    },
    "corte": {
      "label": "Corte tropical",
      "levels": [
        {
          "limitS": 18,
          "minS": 4,
          "target": 13,
          "rate": 1.3,
          "storm": 0,
          "speed": 1.08
        },
        {
          "limitS": 22,
          "minS": 6,
          "target": 20,
          "rate": 1.8,
          "storm": 0.18,
          "speed": 1.2
        },
        {
          "limitS": 28,
          "minS": 8,
          "target": 24,
          "rate": 2.1,
          "storm": 0.22,
          "speed": 1.25
        }
      ],
      "lives": {
        "start": 3,
        "minLevel3": 2
      }
    },
    "torre": {
      "label": "Torre de maletas",
      "levels": [
        {
          "limitS": 25,
          "minS": 3,
          "floors": 8,
          "speed": 0.95,
          "perfect": 0.045
        },
        {
          "limitS": 30,
          "minS": 4,
          "floors": 11,
          "speed": 1.2,
          "perfect": 0.035
        },
        {
          "limitS": 35,
          "minS": 5,
          "floors": 13,
          "speed": 1.35,
          "perfect": 0.03
        }
      ],
      "lives": null
    },
    "maleta": {
      "label": "Sigue tu maleta",
      "levels": [
        {
          "limitS": 14,
          "minS": 3,
          "bags": 3,
          "swaps": 6,
          "swapMs": 600
        },
        {
          "limitS": 14,
          "minS": 4,
          "bags": 4,
          "swaps": 10,
          "swapMs": 450
        },
        {
          "limitS": 14,
          "minS": 4,
          "bags": 5,
          "swaps": 14,
          "swapMs": 350
        }
      ],
      "lives": null
    }
  }
};
;
'use strict';

// App de /juegos (versión web recortada): menú → minijuego (nivel 1) → giro → registro → código.
// No reusa app.js ni L.ladder.run del stand (acoplados a /api/run/*, check-in y guards de kiosco).
// El navegador solo habla con /api/juegos/<accion> (pagina-web-next), que verifica Turnstile en girar
// y reclamar y reenvía a la edge function juegos-api. El premio lo decide el servidor antes de animar.
(() => {
  const L = window.L360;
  const CFG = window.JUEGOS_WEB.juegos;
  const ORDEN = ['memoria', 'maleta', 'rompecabezas', 'aterriza', 'torre', 'corte'];
  const SESION = 'juegos_sesion';
  const CONTACTO = 'juegos_contacto';
  const TIER = { descuento: 'coupon', giro_extra: 'retry', prioritaria: 'small', digital: 'small', nada: 'fallback' };
  const MENSAJES = {
    limite_ip: 'Hoy ya se jugaron muchas partidas desde tu conexión. Vuelve mañana.',
    limite_telefono: 'Este número ya canjeó un descuento en los últimos 30 días.',
    ya_reclamado: 'Este premio ya se reclamó con otro número.',
    token_invalido: 'La partida venció. Empieza una nueva.',
    sin_giro: 'Primero hay que ganar el minijuego.',
    tiempo_imposible: 'No pudimos validar la partida. Intenta de nuevo.',
    nivel_invalido: 'La partida se desincronizó. Empieza una nueva.',
    datos_invalidos: 'Revisa tu nombre y tu número de WhatsApp.',
    turnstile: 'No pudimos verificar que eres una persona. Intenta de nuevo.',
    seguridad: 'No cargó la verificación de seguridad. Recarga la página.',
    red: 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.',
    default: 'Algo salió mal. Intenta de nuevo.',
  };
  const screen = document.getElementById('screen');
  const backBtn = document.getElementById('back-btn');

  const fail = (code) => Object.assign(new Error(MENSAJES[code] || MENSAJES.default), { code });

  async function api(accion, body = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(`/api/juegos/${accion}`, {
        method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok === false) throw fail(data && data.error);
      return data;
    } catch (e) {
      throw e.code ? e : fail('red');
    } finally {
      clearTimeout(timer);
    }
  }

  let scriptTs = null;
  function cargarTurnstile() {
    if (window.turnstile) return Promise.resolve();
    scriptTs = scriptTs || new Promise((resolve, reject) => {
      const s = L.el('script', { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true });
      s.onload = resolve;
      s.onerror = () => { scriptTs = null; reject(fail('seguridad')); };
      document.head.append(s);
    });
    return scriptTs;
  }

  let cfgTs = null;
  function configTurnstile() {
    cfgTs = cfgTs || fetch('/api/turnstile-config').then((r) => r.json()).catch(() => null);
    return cfgTs;
  }
  // Script y site key se piden al abrir la página, no al tocar "Girar".
  function precargarTurnstile() {
    configTurnstile();
    cargarTurnstile().catch(() => {});
  }

  // Token de un solo uso; el widget solo se ve si Cloudflare pide interacción.
  async function verificar(host) {
    const cfg = await configTurnstile();
    if (!cfg || !cfg.ok || !cfg.site_key) { cfgTs = null; throw fail('seguridad'); }
    await cargarTurnstile();
    return new Promise((resolve, reject) => {
      const id = window.turnstile.render(host, {
        sitekey: cfg.site_key,
        appearance: 'interaction-only',
        callback: (t) => { try { window.turnstile.remove(id); } catch { /* ya removido */ } resolve(t); },
        'error-callback': () => { try { window.turnstile.remove(id); } catch { /* ya removido */ } reject(fail('seguridad')); },
        'timeout-callback': () => { try { window.turnstile.remove(id); } catch { /* ya removido */ } reject(fail('seguridad')); },
      });
    });
  }

  // Pide el token en cuanto aparece la pantalla: al tocar el botón ya está listo (vale 300 s).
  function tokenAnticipado(host) {
    let p;
    let t0;
    let listo = false;
    const pedir = () => {
      listo = false;
      t0 = Date.now();
      p = verificar(host).then((t) => { listo = true; return t; });
      p.catch(() => {});
    };
    pedir();
    return {
      get listo() { return listo; },
      async obtener() {
        if (Date.now() - t0 > 240000) pedir();
        try { return await p; } catch { pedir(); return await p; }
      },
    };
  }

  function show(name, ...nodes) {
    document.body.dataset.screen = name;
    backBtn.hidden = name !== 'intro';
    screen.replaceChildren(L.el('div', { class: 'jw-screen' }, ...nodes));
    window.scrollTo(0, 0);
  }

  const btn = (text, cls, onClick) => {
    const b = L.el('button', { class: `btn ${cls} btn-xl`, type: 'button' }, text);
    b.addEventListener('click', () => onClick(b));
    return b;
  };
  const head = (eyebrow, title, lead) => [
    L.el('div', { class: 'eyebrow' }, eyebrow),
    L.el('h2', { class: 'title' }, title),
    lead ? L.el('p', { class: 'lead' }, lead) : null,
  ];
  // Intentos del nivel n (aterriza y corte): los fallos de los niveles anteriores se descuentan y el
  // nivel 3 completa hasta `minLevel3`, igual que en el stand (src/ladder.js).
  function vidasDe(id, n, fallos) {
    const v = CFG[id].lives;
    if (!v) return null;
    const left = v.start - fallos;
    return n === 3 && left < v.minLevel3 ? { lives: v.minLevel3, bonus: true } : { lives: left, bonus: false };
  }
  const paramsDe = (id, n = 1, fallos = 0) => {
    const vidas = vidasDe(id, n, fallos);
    return { ...CFG[id].levels[n - 1], lives: vidas ? vidas.lives : null };
  };
  const reglaDe = (id, n = 1, fallos = 0) => { try { return L.games[id].describeLevel(paramsDe(id, n, fallos)); } catch { return ''; } };

  // Con un premio ya reclamado, las partidas del mismo dispositivo son solo por diversión (sin servidor,
  // sin giro). Dura lo que el cupón (30 días); el servidor igual limita un descuento por teléfono.
  const RECLAMADO = 'juegos_reclamado';
  const recreativo = () => {
    const t = L.store.get(RECLAMADO);
    return Number.isFinite(t) && Date.now() - t < 30 * 864e5;
  };
  const AVISO_RECREATIVO = 'Ya reclamaste tu premio: desde ahora los juegos son solo por diversión y ya no suman giros ni premios.';

  function menu() {
    L.store.del(SESION);
    const cards = ORDEN.filter((id) => L.games[id] && CFG[id]).map((id, i) => {
      const g = L.games[id];
      const card = L.el('button', { class: 'jw-card', type: 'button', style: `--i:${i}` },
        L.el('span', { class: 'jw-card-icon' }, L.svg(g.icon)),
        L.el('span', { class: 'jw-card-text' }, L.el('b', {}, g.title), L.el('small', {}, g.tagline)));
      card.addEventListener('click', () => intro(id));
      return card;
    });
    show('menu',
      ...(recreativo()
        ? head('Modo recreativo', 'Sigue jugando por diversión', 'Elige un juego:')
        : head('Juega y viaja', 'Gana un minijuego y gira la ruleta', 'Supera los 3 niveles de un juego para ganar un giro. Elige uno:')),
      recreativo() ? L.el('p', { class: 'jw-aviso' }, AVISO_RECREATIVO) : null,
      L.el('div', { class: 'jw-grid' }, cards));
  }

  function intro(id) {
    const g = L.games[id];
    const recrea = recreativo();
    show('intro',
      L.el('div', { class: 'jw-hero' }, L.svg(g.icon)),
      ...head('Minijuego', g.title, g.tagline),
      L.el('p', { class: 'jw-rule' }, `Nivel 1: ${reglaDe(id)}`),
      L.el('p', { class: 'jw-aviso' }, recrea ? AVISO_RECREATIVO : 'Supera los 3 niveles seguidos para ganar un giro de la ruleta.'),
      btn(recrea ? 'Jugar por diversión' : 'Jugar', 'btn-primary', async (b) => {
        b.disabled = true;
        try {
          // La sesión se pide mientras corre la cuenta atrás; jugar() espera el token antes de arrancar.
          const sesion = recrea ? null : api('iniciar', { juego: id });
          if (sesion) sesion.catch(() => {});
          await jugar(id, sesion);
        } catch (e) { L.toast(e.message); b.disabled = false; }
      }));
    backBtn.onclick = menu;
  }

  // 3-2-1 de cada nivel, con el número de nivel, los intentos (si el juego los usa) y el aviso que toque.
  function cuentaAtras(stage, { n, texto, vidas, aviso }) {
    return new Promise((resolve) => {
      const num = L.el('div', { class: 'ladder-count-num' }, '3');
      const intentos = vidas && `${vidas.bonus ? '¡Intento extra! Tienes' : n === 1 ? 'Tienes' : 'Te quedan'} ${vidas.lives} ${vidas.lives === 1 ? 'intento' : 'intentos'}${n === 1 ? ' en total' : ''}`;
      stage.append(L.el('div', { class: 'ladder-count' }, L.el('div', { class: 'ladder-count-card' },
        L.el('div', { class: 'eyebrow' }, `Nivel ${n} de 3`), L.el('h2', { class: 'title' }, texto),
        intentos ? L.el('p', { class: 'ladder-count-lives' }, intentos) : null,
        aviso ? L.el('p', { class: 'lead' }, aviso) : null, num)));
      let left = 3;
      const timer = setInterval(() => {
        left -= 1;
        if (left > 0) {
          num.textContent = String(left);
          num.classList.remove('pop');
          void num.offsetWidth;
          num.classList.add('pop');
          return;
        }
        clearInterval(timer);
        num.closest('.ladder-count').remove();
        resolve();
      }, 1000);
    });
  }

  const errorPantalla = (e) => show('error', ...head('Ups', e.message), btn('Volver a los juegos', 'btn-primary', menu));

  // Los 3 niveles seguidos; fallar uno termina la partida. El resultado de cada nivel se registra en el
  // servidor mientras corre la cuenta atrás del siguiente, así que nunca hay una espera visible.
  // `sesion` es la promesa de `iniciar`; null = modo recreativo (sin servidor).
  async function jugar(id, sesion) {
    const g = L.games[id];
    const recrea = !sesion;
    let pendiente = sesion;
    let token = null;
    let fallos = 0;
    for (let n = 1; n <= 3; n++) {
      const stage = L.el('div', { class: 'game-stage' });
      show('juego', stage);
      const vidas = vidasDe(id, n, fallos);
      const params = paramsDe(id, n, fallos);
      let go;
      const ready = new Promise((r) => { go = r; });
      const playing = g.playLevel(stage, n, params, ready);
      await cuentaAtras(stage, {
        n,
        texto: reglaDe(id, n, fallos),
        vidas,
        aviso: n > 1 ? `¡Nivel ${n - 1} superado!${recrea ? '' : n === 3 ? ' Uno más y ganas un giro.' : ''}`
          : recrea ? 'Modo recreativo: no suma giros ni premios.' : 'Supera los 3 niveles seguidos para ganar un giro.',
      });
      if (pendiente) {
        try {
          const r = await pendiente;
          if (n === 1) {
            token = r.token;
            L.store.set(SESION, { token, juego: id });
          }
        } catch (e) { return errorPantalla(e); }
      }
      const t0 = performance.now();
      go();
      const outcome = await playing;
      fallos += outcome.misses || 0;
      const paso = Boolean(outcome.passed);
      if (!recrea) {
        // Aterriza no informa `ms`; el reloj propio incluye la animación de fin, que puede pasarse del límite.
        const ms = Math.min(Math.round(outcome.ms ?? (performance.now() - t0)), params.limitS * 1000);
        pendiente = api('nivel', { token, nivel: n, ms, paso });
        pendiente.catch(() => {});
      }
      if (!paso) {
        L.store.del(SESION);
        return perdiste(id, n);
      }
      if (n === 3) {
        if (recrea) return recreativoFin(id);
        try {
          const res = await pendiente;
          return res.completo ? ganaste(token, '¡Superaste los 3 niveles!', 'Ganaste un giro') : errorPantalla(new Error(MENSAJES.default));
        } catch (e) { return errorPantalla(e); }
      }
    }
  }

  function recreativoFin(id) {
    show('recreativo',
      ...head('Modo recreativo', '¡Completaste los 3 niveles!', 'Esta vez fue solo por diversión: no suma giros ni premios.'),
      L.el('div', { class: 'jw-actions' },
        btn('Jugar otra vez', 'btn-primary', () => intro(id)),
        btn('Otro juego', 'btn-secondary', menu)));
  }

  function perdiste(id, n) {
    show('perdiste',
      ...head('Casi', 'No lo lograste esta vez', `Llegaste al nivel ${n} de 3. Inténtalo otra vez o prueba con otro juego.`),
      L.el('div', { class: 'jw-actions' },
        btn('Intentar de nuevo', 'btn-primary', () => intro(id)),
        btn('Otro juego', 'btn-secondary', menu)));
  }

  // Pantalla previa al giro: la verificación (Turnstile) y el sorteo ocurren al tocar, antes de animar.
  function ganaste(token, eyebrow, titulo) {
    const host = L.el('div', { class: 'jw-turnstile' });
    const ts = tokenAnticipado(host);
    show('ganaste',
      ...head(eyebrow, titulo, 'Gira la ruleta y descubre tu premio.'),
      host,
      btn('Girar la ruleta', 'btn-primary', async (b) => {
        b.disabled = true;
        if (!ts.listo) b.textContent = 'Verificando…';
        try {
          const r = await api('girar', { token, turnstile: await ts.obtener() });
          await ruleta(r);
          await resultado(token, r);
        } catch (e) {
          L.toast(e.message);
          b.disabled = false;
          b.textContent = 'Girar la ruleta';
        }
      }));
  }

  function ruleta(r) {
    const stage = L.el('div', { class: 'game-stage' });
    show('ruleta', stage);
    return new Promise((resolve) => {
      L.games.brujula.mount(stage, {
        result: { prizeId: r.premio_id, tier: TIER[r.tipo], retryToken: r.tipo === 'giro_extra' },
        nombre: '',
        wheel: 'web',
        copy: { eyebrow: 'Tu giro', title: 'Gira y descubre tu premio', lead: 'Buena suerte:' },
        onRevealStart() {},
        onDone: () => setTimeout(resolve, 1200),
      });
      // El sorteo ya está hecho: la rueda arranca sola en vez de pedir un segundo toque.
      setTimeout(() => {
        const spin = stage.querySelector('.side-panel .btn-primary');
        if (spin) spin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      }, 500);
    });
  }

  function resultado(token, r) {
    if (r.giros > 0) return ganaste(token, '¡Gira otra vez!', 'Te toca un giro más');
    if (r.tipo === 'nada') {
      L.store.del(SESION);
      return show('nada',
        ...head('Casi', 'Esta vez no hubo premio', 'Juega de nuevo: cada minijuego ganado es un giro nuevo.'),
        btn('Jugar otra vez', 'btn-primary', menu));
    }
    return reclamo(token, r.etiqueta);
  }

  function reclamo(token, etiqueta) {
    const guardado = L.store.get(CONTACTO) || {};
    const nombre = L.el('input', { class: 'jw-input', name: 'nombre', autocomplete: 'name', maxlength: '80', required: true, value: guardado.nombre || '' });
    const telefono = L.el('input', { class: 'jw-input', name: 'telefono', type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: '20', placeholder: '0412 1234567', required: true, value: guardado.telefono || '' });
    const promos = L.el('input', { type: 'checkbox', name: 'acepta_promos' });
    const host = L.el('div', { class: 'jw-turnstile' });
    const ts = tokenAnticipado(host);
    const enviar = L.el('button', { class: 'btn btn-primary btn-xl', type: 'submit' }, 'Guardar mi premio');
    const form = L.el('form', { class: 'jw-form', novalidate: true },
      L.el('label', {}, L.el('span', {}, 'Tu nombre'), nombre),
      L.el('label', {}, L.el('span', {}, 'Tu WhatsApp'), telefono),
      L.el('label', { class: 'jw-check' }, promos, L.el('span', {}, 'Quiero recibir promociones de viajes por WhatsApp (opcional)')),
      host, enviar);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (nombre.value.trim().length < 2 || telefono.value.replace(/\D/g, '').length < 10) return L.toast(MENSAJES.datos_invalidos);
      enviar.disabled = true;
      enviar.textContent = 'Guardando…';
      try {
        const res = await api('reclamar', {
          token, nombre: nombre.value.trim(), telefono: telefono.value.trim(), acepta_promos: promos.checked, turnstile: await ts.obtener(),
        });
        L.store.set(CONTACTO, { nombre: nombre.value.trim(), telefono: telefono.value.trim() });
        L.store.set(RECLAMADO, Date.now());
        final(res);
      } catch (err) {
        L.toast(err.message);
        enviar.disabled = false;
        enviar.textContent = 'Guardar mi premio';
      }
    });
    show('reclamo', ...head('¡Ganaste!', etiqueta, 'Déjanos tus datos para guardar tu premio y entregarte tu código.'), form);
  }

  function final(res) {
    const vence = res.vence_en ? new Date(res.vence_en).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    const copiar = btn('Copiar código', 'btn-secondary', async (b) => {
      try { await navigator.clipboard.writeText(res.codigo); b.textContent = '¡Copiado!'; } catch { L.toast(`Tu código: ${res.codigo}`); }
    });
    show('final',
      ...head('Premio guardado', res.etiqueta, 'Este es tu código. Escríbenos por WhatsApp para canjearlo.'),
      L.el('div', { class: 'jw-code', 'aria-label': 'Tu código' }, res.codigo),
      vence ? L.el('p', { class: 'jw-vence' }, `Válido hasta el ${vence}`) : null,
      L.el('p', { class: 'jw-aviso' }, `${AVISO_RECREATIVO} Puedes seguir jugando todo lo que quieras.`),
      L.el('div', { class: 'jw-actions' },
        L.el('a', { class: 'btn btn-primary btn-xl', href: res.whatsapp_url, target: '_blank', rel: 'noopener' }, 'Canjear por WhatsApp'),
        copiar,
        btn('Seguir jugando por diversión', 'btn-secondary', menu)));
  }

  // Recarga del navegador integrado (Instagram/TikTok): retoma donde iba, sin repetir el juego.
  async function arrancar() {
    const s = L.store.get(SESION);
    if (!s || !s.token) return menu();
    try {
      const st = await api('estado', { token: s.token });
      if (!st.paso) return menu();
      if (st.giros > 0) return ganaste(s.token, 'Sigues en juego', 'Tienes un giro esperando');
      if (st.premio_id && st.tipo !== 'nada') return reclamo(s.token, st.etiqueta);
    } catch { /* sesión vencida o sin red: menú */ }
    return menu();
  }

  precargarTurnstile();
  arrancar();
})();
