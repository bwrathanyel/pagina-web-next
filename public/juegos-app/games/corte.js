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
