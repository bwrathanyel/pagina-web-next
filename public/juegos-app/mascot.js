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
