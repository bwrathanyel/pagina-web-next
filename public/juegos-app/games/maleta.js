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
