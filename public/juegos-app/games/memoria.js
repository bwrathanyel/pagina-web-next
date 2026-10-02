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
