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
