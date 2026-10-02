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

  // Token de un solo uso; el widget solo se ve si Cloudflare pide interacción.
  async function verificar(host) {
    const cfg = await fetch('/api/turnstile-config').then((r) => r.json()).catch(() => null);
    if (!cfg || !cfg.ok || !cfg.site_key) throw fail('seguridad');
    await cargarTurnstile();
    return new Promise((resolve, reject) => {
      const id = window.turnstile.render(host, {
        sitekey: cfg.site_key,
        appearance: 'interaction-only',
        callback: (t) => { try { window.turnstile.remove(id); } catch { /* ya removido */ } resolve(t); },
        'error-callback': () => reject(fail('seguridad')),
        'timeout-callback': () => reject(fail('seguridad')),
      });
    });
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
  const paramsDe = (id) => ({ ...CFG[id].level, lives: CFG[id].lives });
  const reglaDe = (id) => { try { return L.games[id].describeLevel(paramsDe(id)); } catch { return ''; } };

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
      ...head('Juega y viaja', 'Gana un minijuego y gira la ruleta', 'Descuentos y premios para tu próximo viaje. Elige un juego:'),
      L.el('div', { class: 'jw-grid' }, cards));
  }

  function intro(id) {
    const g = L.games[id];
    show('intro',
      L.el('div', { class: 'jw-hero' }, L.svg(g.icon)),
      ...head('Minijuego', g.title, g.tagline),
      L.el('p', { class: 'jw-rule' }, reglaDe(id)),
      btn('Jugar', 'btn-primary', async (b) => {
        b.disabled = true;
        try {
          const { token } = await api('iniciar', { juego: id });
          L.store.set(SESION, { token, juego: id });
          await jugar(id, token);
        } catch (e) { L.toast(e.message); b.disabled = false; }
      }));
    backBtn.onclick = menu;
  }

  function cuentaAtras(stage, texto) {
    return new Promise((resolve) => {
      const num = L.el('div', { class: 'ladder-count-num' }, '3');
      stage.append(L.el('div', { class: 'ladder-count' }, L.el('div', { class: 'ladder-count-card' },
        L.el('div', { class: 'eyebrow' }, 'Prepárate'), L.el('h2', { class: 'title' }, texto), num)));
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

  async function jugar(id, token) {
    const g = L.games[id];
    const stage = L.el('div', { class: 'game-stage' });
    show('juego', stage);
    const params = paramsDe(id);
    let go;
    const ready = new Promise((r) => { go = r; });
    const playing = g.playLevel(stage, 1, params, ready);
    await cuentaAtras(stage, reglaDe(id));
    const t0 = performance.now();
    go();
    const outcome = await playing;
    // Aterriza no informa `ms`; el reloj propio incluye la animación de fin, que puede pasarse del límite.
    const ms = Math.min(Math.round(outcome.ms ?? (performance.now() - t0)), params.limitS * 1000);
    try {
      const res = await api('nivel', { token, ms, paso: Boolean(outcome.passed) });
      if (res.paso) return ganaste(token, '¡Lo lograste!', 'Ganaste un giro');
      L.store.del(SESION);
      perdiste(id);
    } catch (e) {
      show('error', ...head('Ups', e.message), btn('Volver a los juegos', 'btn-primary', menu));
    }
  }

  function perdiste(id) {
    show('perdiste',
      ...head('Casi', 'No lo lograste esta vez', 'Inténtalo otra vez o prueba con otro juego.'),
      L.el('div', { class: 'jw-actions' },
        btn('Intentar de nuevo', 'btn-primary', () => intro(id)),
        btn('Otro juego', 'btn-secondary', menu)));
  }

  // Pantalla previa al giro: la verificación (Turnstile) y el sorteo ocurren al tocar, antes de animar.
  function ganaste(token, eyebrow, titulo) {
    const host = L.el('div', { class: 'jw-turnstile' });
    show('ganaste',
      ...head(eyebrow, titulo, 'Gira la ruleta y descubre tu premio.'),
      host,
      btn('Girar la ruleta', 'btn-primary', async (b) => {
        b.disabled = true;
        b.textContent = 'Verificando…';
        try {
          const r = await api('girar', { token, turnstile: await verificar(host) });
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
          token, nombre: nombre.value.trim(), telefono: telefono.value.trim(), acepta_promos: promos.checked, turnstile: await verificar(host),
        });
        L.store.set(CONTACTO, { nombre: nombre.value.trim(), telefono: telefono.value.trim() });
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
      L.el('div', { class: 'jw-actions' },
        L.el('a', { class: 'btn btn-primary btn-xl', href: res.whatsapp_url, target: '_blank', rel: 'noopener' }, 'Canjear por WhatsApp'),
        copiar,
        btn('Jugar otra vez', 'btn-secondary', menu)));
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

  arrancar();
})();
