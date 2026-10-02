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
