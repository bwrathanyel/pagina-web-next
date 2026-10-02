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
