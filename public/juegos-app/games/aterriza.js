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
