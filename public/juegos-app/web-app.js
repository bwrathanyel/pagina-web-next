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
