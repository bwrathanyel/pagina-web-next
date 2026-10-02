'use strict';

// Motor de cliente compartido para la escalera de 3 niveles (memoria, rompecabezas, aterriza).
// El servidor decide status/nivel/premio en cada POST; aquí solo se corre el reloj, se muestran
// las pantallas intermedias y se llama a /api/run/*. La cima se muestra reutilizando la Brújula:
// el resultado ya viene fijado por el servidor antes de que gire.
(() => {
  const L = window.L360;
  const DECISION_LOCK_MS = 600; // tolerancia a clics errados en la pantalla de decisión
  const LOST_MS = 3200; // cuánto se ve el aviso de derrota antes del giro de consuelo
  const CIMA_SPINS = 2; // giros de la cima (src/ladder.js); "Tercer intento" suma uno

  function screen(stage, ...nodes) {
    stage.replaceChildren(...nodes);
  }

  const SPARKS = ['var(--gold)', 'var(--orange)', 'var(--seafoam-soft)', 'var(--card)'];

  // Ráfaga de chispas planas en (x%, y%) de `fx` (capa absoluta), que se limpia sola.
  function sparkBurst(fx, x, y, count) {
    const nodes = [];
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const d = 9 + Math.random() * 12;
      const s = 1 + Math.random() * 1.1;
      nodes.push(L.el('i', {
        class: `fx-spark${i % 3 === 2 ? ' round' : ''}`,
        style: `left:${x}%;top:${y}%;width:${s}rem;height:${s}rem;background:${SPARKS[i % 4]};--dx:${(Math.cos(a) * d).toFixed(2)}rem;--dy:${(Math.sin(a) * d).toFixed(2)}rem;--r:${Math.round(Math.random() * 360)}deg`,
      }));
    }
    fx.append(...nodes);
    setTimeout(() => nodes.forEach((node) => node.remove()), 900);
  }

  // Intentos que le quedan (null si el juego no los usa), para el aviso del nivel y la decisión.
  function livesText(v) {
    if (v.lives == null) return null;
    const word = v.lives === 1 ? 'intento' : 'intentos';
    if (v.livesBonus) return `¡Intento extra! Tienes ${v.lives} ${word}`;
    return v.passed === 0 ? `Tienes ${v.lives} ${word} en total` : `Te quedan ${v.lives} ${word}`;
  }

  // Aviso sobre la escena ya armada, sin clics: nivel + regla corta + 3-2-1. El juego no arranca
  // (ni acepta toques) hasta que termina; el tiempo del nivel se mide desde ahí.
  function countdown(gameStage, n, text, first, lives) {
    return new Promise((resolve) => {
      // Un segundo justo por número: el 3-2-1 dura 3 s de verdad. Antes el primer nivel iba a
      // 1300 ms (3,9 s) y el dueño lo sentía eterno frente al "3" de la pantalla.
      const stepMs = 1000;
      const num = L.el('div', { class: 'ladder-count-num' }, '3');
      gameStage.append(L.el('div', { class: 'ladder-count' },
        L.el('div', { class: 'ladder-count-card' },
          L.el('div', { class: 'eyebrow' }, `Nivel ${n} de 3`),
          L.el('h2', { class: 'title' }, text),
          lives ? L.el('p', { class: 'ladder-count-lives' }, lives) : null,
          first ? L.el('p', { class: 'lead' }, lives
            ? 'Si se acaban los intentos o el tiempo, pierdes lo que no hayas asegurado.'
            : 'Si fallas o se acaba el tiempo, pierdes lo que no hayas asegurado.') : null,
          num,
        ),
      ));
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
      }, stepMs);
    });
  }

  // Gestos de Solcito mientras nadie decide (reemplazan los de la ruleta: nada de "¡Gira!").
  const DECISION_ACTS = [
    ['wink', '¡Tú puedes!', 1500],
    ['look', '¿Qué eliges?', 1900],
    ['wave', '¡Vas muy bien!', 1700],
    ['cool', 'Modo campeón', 2400],
  ];
  const DECISION_HELLO_MS = 2400; // festejo de entrada antes de calmarse

  // Entre niveles: tarjeta con Solcito y el logo a la izquierda; a la derecha el nivel superado,
  // lo que viene, los intentos (un avión por intento) y los dos botones, de una línea cada uno.
  // Solcito duda sobre "Plantarme" y se entusiasma sobre "Seguir".
  function decision(stage, { n, banked, next, nextText, lives, livesLeft, livesBonus, livesIcon, keep, left }) {
    return new Promise((resolve) => {
      const mascot = L.mascot.create({ acts: DECISION_ACTS });
      const fx = L.el('div', { class: 'summit-fx' });
      const option = (cls, verb, prize) => L.el('button', { class: `btn ${cls} btn-xl decide-btn`, disabled: true },
        L.el('b', {}, verb), L.el('span', { class: 'decide-prize' }, prize));
      const cashout = option('btn-secondary', 'Plantarme', banked.short);
      const keepGoing = option('btn-primary', 'Seguir', next.short);
      // Los aviones planean al entrar, uno tras otro (--i escalona el retardo en CSS).
      const planes = livesLeft == null ? null : L.el('div', { class: `runway-lives decide-lives${livesBonus ? ' bonus' : ''}` },
        L.el('div', { class: 'runway-lives-row' },
          ...Array.from({ length: livesLeft }, (_, i) => L.el('i', { class: 'on', style: `--i:${i}` }, L.icon(livesIcon || 'plane')))),
        L.el('span', {}, lives));
      // Sello que cae sobre el premio de plantarse: dice lo mismo que el botón, sin prometer de más.
      const stamp = L.el('span', { class: 'decide-stamp' }, 'Si te plantas', L.el('b', {}, banked.short));
      const hero = L.el('div', { class: 'decide-hero' },
        L.el('div', { class: 'decide-logo' }, L.el('img', { src: 'media/logo.png', alt: '' })),
        mascot.el,
      );

      screen(stage, L.el('div', { class: 'decide' },
        hero,
        L.el('div', { class: 'decide-body' },
          L.el('div', { class: 'eyebrow' }, `Nivel ${n} de 3 superado`, L.icon('check'), stamp),
          L.el('h2', { class: 'title' }, '¿Te plantas o ', L.el('em', {}, 'sigues'), '?'),
          L.el('p', { class: 'decide-next' }, L.el('span', {}, 'Próximo'), nextText),
          planes,
          L.el('div', { class: 'decide-actions' }, cashout, keepGoing),
          L.el('p', { class: 'decide-warn' }, left > 0
            ? `Si sigues y pierdes, vuelves al menú con ${triesText(left)} más.`
            : keep
              ? `Si sigues y pierdes, conservas tu ${keep.short} y un giro.`
              : 'Si sigues y pierdes, te quedas solo con un giro.'),
        ),
        fx,
      ));

      mascot.mood('happy', '¡Vas muy bien!');
      if (L.sound) L.sound.play('levelup');
      setTimeout(() => sparkBurst(fx, 14, 28, 14), 120);
      setTimeout(() => sparkBurst(fx, 14, 62, 12), 520);
      setTimeout(() => { if (mascot.el.dataset.mood === 'happy') mascot.mood('idle', ''); }, DECISION_HELLO_MS);

      // Solcito además se inclina hacia el botón que tiene el mouse encima (rotate/translate, sin filtros).
      const react = (btn, name, text, lean) => {
        btn.addEventListener('pointerenter', () => { mascot.mood(name, text); hero.dataset.lean = lean; });
        btn.addEventListener('pointerleave', () => {
          if (hero.dataset.lean === lean) delete hero.dataset.lean;
          if (mascot.el.dataset.mood === name) mascot.mood('idle', '');
        });
      };
      react(cashout, 'look', '¿Seguro?', 'stay');
      react(keepGoing, 'eager', next.tier === 'cima' ? '¡Vamos por el viaje!' : '¡Vamos por más!', 'go');

      setTimeout(() => { cashout.disabled = false; keepGoing.disabled = false; }, DECISION_LOCK_MS);
      const pick = (choice, other) => () => { other.disabled = true; resolve(choice); };
      // Plantarse suena a sello de pasaporte en vez del toque.
      L.onPress(cashout, () => { if (L.sound) L.sound.play('stand'); pick('cashout', keepGoing)(); }, { silent: true });
      L.onPress(keepGoing, pick('continue', cashout));
    });
  }

  // Oportunidades que quedan después de esta partida (0 = es la última).
  const triesLeft = (v) => Math.max(0, (v.oportunidades || 1) - (v.oportunidad || 1));
  const triesText = (k) => (k === 1 ? '1 oportunidad' : `${k} oportunidades`);

  // Derrota sobre la escena del choque: nunca con las manos vacías. Con oportunidades por delante
  // avisa que vuelve al menú; en la última, el giro de consuelo (y lo que conserva si fue en el
  // nivel 3). Pasa solo, sin botón.
  function lost(gameStage, n, keep, left = 0) {
    return new Promise((resolve) => {
      let lead = keep
        ? `Conservas tu ${keep.short} y te llevas un giro en la ruleta.`
        : 'No te vas con las manos vacías: te llevas un giro en la ruleta.';
      if (left > 0) lead = `Te ${left === 1 ? 'queda' : 'quedan'} ${triesText(left)}: elige un juego y vuelve a intentarlo.`;
      gameStage.append(L.el('div', { class: 'ladder-count' },
        L.el('div', { class: 'ladder-count-card' },
          L.el('div', { class: 'eyebrow' }, `Nivel ${n} de 3`),
          L.el('h2', { class: 'title' }, '¡Casi!'),
          L.el('p', { class: 'lead' }, lead),
        ),
      ));
      if (L.sound) L.sound.play('lose');
      setTimeout(resolve, LOST_MS);
    });
  }

  // Perdió y le queda otra oportunidad: sin giro, turno nuevo para el menú. El POST sale junto con
  // el aviso; al retomar (sin `gameStage`) va directo. `{ otra }` lo abre app.js en el menú.
  async function anotherTry({ token, n, gameStage, left }) {
    const pending = L.api('POST', '/api/run/otra', { token });
    pending.catch(() => {}); // el error sale al esperarlo, después del aviso
    if (gameStage) await lost(gameStage, n, null, left);
    return { otra: await pending };
  }

  const SUMMIT_LOCK_MS = 900; // el último toque del nivel 3 no debe saltarse la celebración
  const SUMMIT_AUTO_MS = 5600; // si nadie toca, pasa sola a la ruleta
  // Cordillera plana con dos cumbres a los lados (el centro queda libre para el texto) y bandera
  // en la de la derecha. El CSS le da aspect-ratio 4/1 (igual al viewBox): nunca se recorta.
  const SUMMIT_LAND = `
    <svg class="summit-land" viewBox="0 0 1600 400" aria-hidden="true">
      <path class="far" d="M0 400V230L140 170L290 220L430 120L560 200L700 250L820 300L960 250L1080 190L1200 140L1330 210L1470 150L1600 190V400Z"/>
      <path class="near" d="M0 400V300L150 220L330 90L470 190L600 280L800 340L1000 280L1130 190L1270 70L1420 200L1600 260V400Z"/>
      <path class="snow" d="M292 118L330 90L366 115L350 112L336 124L322 110L306 122Z"/>
      <path class="snow" d="M1228 100L1270 70L1310 98L1292 94L1278 108L1262 93L1246 106Z"/>
      <g class="flag"><path class="pole" d="M1270 72V2"/><path class="cloth" d="M1272 4L1340 20L1272 38Z"/></g>
    </svg>`;

  // Celebración de la cima antes de la ruleta. No adelanta nada del premio (lo sorteó el servidor
  // y solo se ve al girar): Solcito salta, cordillera con bandera, chispas y avance solo o con un toque.
  // `pending` = el POST de la cima: cuando llega, el texto nombra el premio que ya es suyo.
  function summitIntro(stage, nombre, pending) {
    return new Promise((resolve) => {
      const lead = L.el('p', { class: 'lead' }, `Ganaste ${CIMA_SPINS} giros en la ruleta de los viajes.`);
      pending.then((r) => {
        if (r && r.short) lead.textContent = `Ganaste: ${r.short}, y además ${CIMA_SPINS} giros en la ruleta de los viajes.`;
      }, () => {});
      const mascot = L.mascot.create();
      const fx = L.el('div', { class: 'summit-fx' });
      const btn = L.el('button', { class: 'btn btn-primary btn-xl', disabled: true }, 'Ir a la ruleta');
      const timers = [];
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        resolve();
      };

      screen(stage, L.el('div', { class: 'summit', style: `--auto:${SUMMIT_AUTO_MS}ms` },
        L.svg(SUMMIT_LAND),
        fx,
        L.el('div', { class: 'summit-body' },
          L.el('div', { class: 'summit-hero' }, mascot.el),
          L.el('div', { class: 'eyebrow' }, L.icon('mountain'), 'Nivel 3 de 3 superado'),
          L.el('h2', { class: 'title' }, `${L.firstName(nombre) || 'Viajero'}, llegaste a `, L.el('em', {}, 'la cima')),
          lead,
          L.el('div', { class: 'summit-go' }, btn, L.el('i', { class: 'summit-auto' })),
        ),
      ));

      const burst = (x, y, count) => sparkBurst(fx, x, y, count);
      mascot.mood('big', '¡Lo lograste!');
      if (L.sound) { L.sound.duck(3500); L.sound.play('cima'); }
      later(() => burst(50, 24, 18), 120);
      later(() => burst(21, 30, 14), 650);
      later(() => burst(79, 22, 14), 1050);
      later(() => burst(50, 24, 20), 1700);
      later(() => { btn.disabled = false; }, SUMMIT_LOCK_MS);
      later(finish, SUMMIT_AUTO_MS);
      L.onPress(btn, finish);
    });
  }

  // Cima: el premio de N2 ya es suyo (viene con su código) y además gira la ruleta de la cima
  // CIMA_SPINS veces, con una pausa corta entre giro y giro (cimaPause); "Tercer intento" suma una
  // y un viaje termina la serie. Cada giro siguiente se
  // pide con su número `n`, así un reenvío nunca gasta uno. Al recargar se ve otra vez el último.
  async function summit(stage, { token, nombre, onRevealStart, intro }) {
    // El sorteo sale ya (en paralelo con la celebración); si falla, el error llega al terminar.
    const pending = L.api('POST', '/api/run/summit', { token });
    pending.catch(() => {});
    if (intro) await summitIntro(stage, nombre, pending);
    let current = await pending;
    const first = L.firstName(nombre) || 'Viajero';
    // Misma disposición que la Brújula normal (ruleta + panel con Solcito); solo cambian los textos.
    const spinWheel = (result, copy) => new Promise((resolve) => {
      screen(stage);
      L.games.brujula.mount(stage, { result, nombre, onRevealStart, onDone: resolve, wheel: 'cima', copy });
    });
    if (!current.spins || !current.spins.length) { // cima de antes de los giros múltiples
      await spinWheel(current, { eyebrow: `${first}, llegaste a la cima`, title: 'Gira la ruleta de la cima' });
      return current;
    }
    for (;;) {
      const { spins } = current;
      const spin = spins[spins.length - 1];
      const n = spins.length;
      const total = CIMA_SPINS + (spins.some((x) => x.tier === 'retry') ? 1 : 0);
      const eyebrow = [`${first}, llegaste a la cima`, `${first}, tu segundo giro`, `${first}, tu tercer intento`][n - 1];
      // eslint-disable-next-line no-await-in-loop
      await spinWheel({ ...spin, retryToken: spin.tier === 'retry' ? 'pendiente' : null }, {
        eyebrow,
        title: `Giro ${n} de ${total}`,
        lead: `Ya tienes: ${current.short || current.label}. Además, la ruleta de los viajes:`,
      });
      if (!current.next) break; // viaje o serie terminada: sin pausa, directo a la tarjeta
      // El giro siguiente se sortea mientras corre la pausa; si falla, el error llega al terminarla.
      const nextSpin = L.api('POST', '/api/run/summit', { token, n: current.next });
      nextSpin.catch(() => {});
      // eslint-disable-next-line no-await-in-loop
      await cimaPause(stage, { c: current, spin, n, nextN: current.next, total });
      // eslint-disable-next-line no-await-in-loop
      current = await nextSpin;
    }
    return cimaCard(current);
  }

  const PAUSE_AUTO_MS = 3000; // si nadie toca, la pausa entre giros pasa sola al siguiente
  // Entre giros de la cima, en vez de saltar directo a la otra ruleta: la misma escena de la cima,
  // cae el sello con lo que ya es suyo, entra la pastilla del giro que viene y Solcito lo anima.
  // No adelanta nada del giro siguiente. Avanza sola o con "Girar de nuevo" tras DECISION_LOCK_MS.
  function cimaPause(stage, { c, spin, n, nextN, total }) {
    return new Promise((resolve) => {
      const have = [c.short || c.label, ...c.spins.filter((x) => x.tier === 'small').map((x) => x.label)].join(' + ');
      const extra = spin.tier === 'retry';
      const title = extra
        ? L.el('h2', { class: 'title' }, '¡Ganaste un ', L.el('em', {}, 'giro extra'), '!')
        : L.el('h2', { class: 'title' }, '¡Vamos por ', L.el('em', {}, nextN === total ? 'el último giro' : 'otro giro'), '!');
      const mascot = L.mascot.create();
      const fx = L.el('div', { class: 'summit-fx' });
      const btn = L.el('button', { class: 'btn btn-primary btn-xl', disabled: true }, 'Girar de nuevo');
      const timers = [];
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        resolve();
      };

      screen(stage, L.el('div', { class: 'cima-pause', style: `--auto:${PAUSE_AUTO_MS}ms` },
        L.svg(SUMMIT_LAND),
        fx,
        L.el('div', { class: 'summit-body' },
          L.el('div', { class: 'summit-hero' }, mascot.el),
          L.el('div', { class: 'eyebrow' }, L.icon('check'), `Giro ${n} listo`),
          title,
          L.el('div', { class: 'eyebrow pause-row' },
            L.el('span', { class: 'decide-stamp' }, 'Ya tienes', L.el('b', {}, have)),
            L.el('span', { class: 'pause-pill' }, L.icon('compass'), `Giro ${nextN} de ${total}`)),
          L.el('div', { class: 'summit-go' }, btn, L.el('i', { class: 'summit-auto' })),
        ),
      ));

      const burst = (x, y, count) => sparkBurst(fx, x, y, count);
      if (spin.tier === 'small') {
        mascot.mood('happy', '¡Bien!');
        later(() => mascot.mood('eager', '¡Otro giro!'), 1400);
      } else {
        mascot.mood(extra ? 'big' : 'eager', extra ? '¡Uno más!' : '¡Otro giro!');
      }
      if (L.sound) L.sound.play('chime');
      later(() => burst(50, 22, 16), 120);
      later(() => burst(42, 64, 12), 1150); // el sello cae
      later(() => burst(60, 64, 12), 1700); // entra la pastilla
      later(() => { btn.disabled = false; }, DECISION_LOCK_MS);
      later(finish, PAUSE_AUTO_MS);
      L.onPress(btn, finish);
    });
  }

  // Tarjeta de la cima: si un giro dio viaje, el viaje manda y el premio asegurado (más el souvenir,
  // si también salió) va en "Y ADEMÁS"; si no, manda el premio asegurado y el souvenir va abajo.
  function cimaCard(c) {
    const trip = c.spins.find((x) => x.tier === 'big');
    const souvenir = c.spins.find((x) => x.tier === 'small');
    if (trip) {
      const label = souvenir ? `${c.short || c.label} + ${souvenir.label}` : c.label;
      return { ...c, ...trip, retryToken: null, second: { label, tier: c.tier, couponCode: c.couponCode } };
    }
    return { ...c, second: souvenir ? { label: souvenir.label, tier: souvenir.tier, couponCode: null } : null };
  }

  // Plantarse da el premio del nivel Y un giro en la rueda del plantado (la Brújula sin el cupón
  // que acaba de ganar). "Otro intento" pide el segundo giro por /api/run/spin: /api/play no acepta
  // tokens de escalera. Al recargar se vuelve a ver el giro ya sorteado, igual que en la cima.
  async function plantadoSpin(stage, { token, nombre, result }) {
    let current = result;
    while (current.spin) {
      const spin = current.spin;
      const again = spin.attempt > 1;
      screen(stage);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        L.games.brujula.mount(stage, {
          result: { ...spin, retryToken: spin.retry ? 'pendiente' : null },
          nombre, onRevealStart: () => {}, onDone: resolve, wheel: spin.wheel,
          copy: {
            eyebrow: again ? `${L.firstName(nombre)}, otro intento` : `${L.firstName(nombre)}, te plantaste`,
            title: again ? 'Gira de nuevo' : 'Tu giro de regalo',
            lead: 'Tu premio ya es tuyo. Además, un giro en la ruleta:',
          },
        });
      });
      if (!spin.retry) break;
      // eslint-disable-next-line no-await-in-loop
      current = await L.api('POST', '/api/run/spin', { token });
    }
    return cardResult(current);
  }

  // Quien pierde gira la Brújula tal cual (mismos premios y %). El POST sale junto con el aviso
  // "¡Casi!", así el sorteo ya está hecho cuando aparece la ruleta. Al retomar (sin `gameStage`)
  // se vuelve a ver el giro ya sorteado, igual que en el plantado.
  async function consolation(stage, { token, nombre, n, keep, gameStage, result }) {
    const pending = result && result.spin ? Promise.resolve(result) : L.api('POST', '/api/run/consuelo', { token });
    pending.catch(() => {}); // el error sale al esperarlo, después del aviso
    if (gameStage) await lost(gameStage, n, keep);
    let current = await pending;
    while (current.spin) {
      const spin = current.spin;
      const again = spin.attempt > 1;
      screen(stage);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        L.games.brujula.mount(stage, {
          result: { ...spin, retryToken: spin.retry ? 'pendiente' : null },
          nombre, onRevealStart: () => {}, onDone: resolve, wheel: spin.wheel,
          copy: {
            eyebrow: again ? `${L.firstName(nombre)}, otro intento` : `${L.firstName(nombre)}, casi lo logras`,
            title: again ? 'Gira de nuevo' : 'Tu giro de regalo',
            lead: current.couponCode ? `Conservas tu ${current.short}. Además, un giro en la ruleta:` : 'No te vas con las manos vacías: gira la ruleta.',
          },
        });
      });
      if (!spin.retry) break;
      // eslint-disable-next-line no-await-in-loop
      current = await L.api('POST', '/api/run/consuelo', { token, retry: true });
    }
    // Con el cupón de N1: la tarjeta de dos premios. Sin él, el giro es el resultado.
    if (current.prizeId) return cardResult(current);
    return { ...current, ...current.spin, retryToken: null, spin: null, second: null };
  }

  // Tarjeta con los dos premios: manda el más grande y el otro va en la línea "Y ADEMÁS".
  function cardResult(c) {
    const spin = c.spin;
    const won = spin && ['big', 'coupon', 'small'].includes(spin.tier);
    const mine = { label: c.label, tier: c.tier, couponCode: c.couponCode };
    if (won && spin.tier === 'big') return { ...c, ...spin, retryToken: null, spin: null, second: mine };
    return { ...c, second: won ? { label: spin.label, tier: spin.tier, couponCode: spin.couponCode } : null };
  }

  // Reloj de nivel: barra que se agota en limitS segundos, con aviso en los últimos 5 s.
  // Devuelve una función para detenerlo (al terminar el nivel antes de tiempo).
  // opts.pressure (memoria, rompecabezas): segundos grandes que laten, aviso desde los 10 s,
  // tramo crítico en los últimos 5 s y `data-hud="warn|crit"` en opts.edge (viñeta del borde).
  const WARN_MS = 10000;
  const CRIT_MS = 5000;
  function clock(container, limitS, onTimeout, opts = {}) {
    const fill = L.el('div', { class: 'hud-fill' });
    const secs = opts.pressure ? L.el('b', {}, String(Math.ceil(limitS))) : null;
    const hud = L.el('div', { class: opts.pressure ? 'hud hud-pressure' : 'hud' },
      secs ? L.el('div', { class: 'hud-time' }, secs, L.el('span', {}, 's')) : null,
      L.el('div', { class: 'hud-bar' }, fill));
    container.append(hud);
    const edge = opts.edge || null;
    const totalMs = limitS * 1000;
    const start = performance.now();
    let stopped = false;
    let raf;
    let shown = Math.ceil(limitS);
    let phase = '';
    function tick(now) {
      if (stopped) return;
      const left = Math.max(0, totalMs - (now - start));
      // scaleX (no width): la barra se mueve en la GPU sin layout ni repintado en cada cuadro.
      fill.style.transform = `scaleX(${left / totalMs})`;
      if (!opts.pressure) {
        fill.classList.toggle('hud-warn', left <= CRIT_MS);
      } else {
        const next = left <= CRIT_MS ? 'crit' : left <= WARN_MS ? 'warn' : '';
        if (next !== phase) {
          phase = next;
          hud.dataset.hud = phase;
          if (edge) edge.dataset.hud = phase;
          fill.classList.toggle('hud-warn', phase === 'warn');
          fill.classList.toggle('hud-crit', phase === 'crit');
        }
        const s = Math.ceil(left / 1000);
        if (s !== shown) {
          shown = s;
          secs.textContent = String(s);
          if (phase) {
            secs.classList.remove('beat');
            void secs.offsetWidth;
            secs.classList.add('beat');
            if (phase === 'crit' && s > 0 && L.sound) L.sound.play('tick');
          }
        }
      }
      if (left <= 0) {
        stopped = true;
        if (edge) edge.dataset.hud = '';
        onTimeout();
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (edge) edge.dataset.hud = '';
    };
  }

  // Castigo visual al fallar (par distinto, intercambio que no acomoda nada): el reloj se sacude
  // y destella. No descuenta tiempo; el servidor solo valida el tiempo real del nivel.
  function penalty(container) {
    const hud = container.querySelector('.hud');
    if (!hud) return;
    hud.classList.remove('hud-hit');
    void hud.offsetWidth;
    hud.classList.add('hud-hit');
  }

  L.ladder = {
    clock,
    penalty,
    burst: sparkBurst,

    // stage: contenedor de juego (igual que mount() de los otros juegos).
    // view: resultado de /api/run/start (retoma el nivel correcto si se recarga a mitad).
    // playLevel(stage, n, params, ready) -> Promise<{passed, ms?, precision?, misses?}>. Debe armar la
    // escena en el acto y esperar `ready` para arrancar reloj, animación y toques.
    // params.lives: intentos disponibles en el nivel (null si el juego no los usa).
    // describeLevel(params) -> texto corto para el aviso del nivel y la pantalla de decisión.
    // livesIcon: nombre del ícono (L.icon) de cada intento en la decisión; por defecto el avión.
    // onDone(result, stats): stats = {game, level, ms, precision} de la partida, para la tarjeta.
    async run(stage, { token, view, nombre, playLevel, describeLevel, livesIcon, onRevealStart, onDone }) {
      const describe = describeLevel || ((p) => `${p.limitS} s límite`);
      const stats = (x) => ({ game: x.game, level: x.passed, ms: x.ms, precision: x.precision });
      let v = view;
      onRevealStart();

      // Al retomar (recarga o POST fallido) con un nivel ya pasado, primero va la decisión: nunca
      // se obliga a seguir a quien quizá quería plantarse.
      let decide = v.passed > 0;
      while (v.status === 'jugando') {
        if (decide) {
          const nextText = describe(v.levels[v.level - 1]);
          const choice = await decision(stage, {
            n: v.passed, banked: v.banked, next: v.next, nextText,
            lives: livesText(v), livesLeft: v.lives, livesBonus: v.livesBonus, livesIcon, keep: v.keep, left: triesLeft(v),
          });
          if (choice === 'cashout') {
            const result = await L.api('POST', '/api/run/cashout', { token });
            onDone(await plantadoSpin(stage, { token, nombre, result }), stats(v));
            return;
          }
        }
        const n = v.level;
        const params = { ...v.levels[n - 1], lives: v.lives };
        const gameStage = L.el('div', { class: 'game-stage' });
        screen(stage, gameStage);
        let go;
        const ready = new Promise((r) => { go = r; });
        const playing = playLevel(gameStage, n, params, ready);
        await countdown(gameStage, n, describe(params), v.passed === 0, livesText(v));
        const t0 = performance.now();
        go();
        const outcome = await playing;
        const ms = Math.round(outcome.ms ?? (performance.now() - t0));
        v = await L.api('POST', '/api/run/level', {
          token, n, passed: outcome.passed, ms, precision: outcome.precision ?? null, misses: v.lives == null ? null : (outcome.misses ?? 0),
        });
        if (v.status === 'perdio' && v.otra) { onDone(await anotherTry({ token, n, gameStage, left: triesLeft(v) })); return; }
        if (v.status === 'perdio') { onDone(await consolation(stage, { token, nombre, n, keep: v.keep, gameStage }), stats(v)); return; }
        decide = true;
      }

      if (v.status === 'perdio' && v.otra) { onDone(await anotherTry({ token })); return; }
      if (v.status === 'perdio') { onDone(await consolation(stage, { token, nombre, result: v.result }), stats(v)); return; }
      if (v.status === 'plantado') { onDone(await plantadoSpin(stage, { token, nombre, result: v.result }), stats(v)); return; }
      // La celebración va solo la primera vez: al retomar tras el sorteo (cima_jugada) se ve la ruleta.
      if (L.sound) L.sound.mood('cima');
      const result = await summit(stage, { token, nombre, onRevealStart: () => {}, intro: v.status === 'cima' });
      onDone(result, stats(v));
    },
  };
})();
