'use strict';

// Sonido 100% sintetizado con Web Audio: groove R&B de turismo con capas por pantalla y efectos fijos.
// Todo es opcional: si el navegador no deja sonar, la experiencia visual queda completa.
(() => {
  const L = window.L360;
  const KEY = 'l360-audio';
  const settings = { music: true, sfx: true, musicVol: 0.55, sfxVol: 0.75, ...(L.store.get(KEY) || {}) };

  let ctx = null;
  let master, musicBus, duckBus, sfxBus, reverbIn, noise;
  let scratchGain = null;

  const midi = (n) => 440 * 2 ** ((n - 69) / 12);

  // Ruido con semilla fija (mulberry32): el reverb y cada golpe suenan igual en cada arranque.
  function seeded(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -16;
    master.ratio.value = 3;
    master.connect(ctx.destination);

    duckBus = ctx.createGain();
    duckBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = settings.music ? settings.musicVol : 0;
    musicBus.connect(duckBus);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = settings.sfx ? settings.sfxVol : 0;
    sfxBus.connect(master);

    // Reverb con respuesta al impulso sintética (ruido que decae): sala cálida, sin archivos.
    // Cola de 1,2 s (antes 2,6): la convolución es lo que más CPU gasta del audio en la laptop.
    const len = Math.floor(ctx.sampleRate * 1.2);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    const rnd = seeded(360);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * (1 - i / len) ** 3;
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    reverbIn = ctx.createGain();
    reverbIn.connect(conv).connect(wet).connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    return ctx;
  }

  const ready = () => ctx && ctx.state === 'running';

  // ---------- primitivas ----------

  // Envolvente percusiva: ataque corto y caída exponencial.
  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function out(node, bus, pan = 0, send = 0) {
    let last = node;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      last = last.connect(p);
    }
    last.connect(bus);
    if (send) {
      const s = ctx.createGain();
      s.gain.value = send;
      last.connect(s).connect(reverbIn);
    }
  }

  function osc(type, freq, t, stop) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.start(t);
    o.stop(stop);
    return o;
  }

  // Siempre el mismo tramo del ruido: cada golpe suena idéntico (nada al azar).
  function noiseSrc(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.start(t, 0, Math.min(dur, noise.duration));
    return s;
  }

  // Piano eléctrico FM: tono redondo con brillo inicial que se apaga.
  function epiano(t, note, vel, bus, { pan = 0, send = 0.25, decay = 1.8 } = {}) {
    const f = midi(note);
    const end = t + decay + 0.1;
    const car = osc('sine', f, t, end);
    const mod = osc('sine', f, t, end);
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(f * 1.1, t);
    modGain.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.5);
    mod.connect(modGain).connect(car.frequency);
    const g = ctx.createGain();
    env(g, t, vel, 0.006, decay);
    car.connect(g);
    out(g, bus, pan, send);
  }

  // Campana: parciales inarmónicos, para premios y detalles.
  function bell(t, note, vel, bus, { pan = 0, send = 0.5, decay = 1.6 } = {}) {
    const f = midi(note);
    [[1, 1], [2.76, 0.28], [5.4, 0.09]].forEach(([ratio, amp], i) => {
      const o = osc('sine', f * ratio, t, t + decay + 0.1);
      const g = ctx.createGain();
      env(g, t, vel * amp, 0.004, decay / (1 + i));
      o.connect(g);
      out(g, bus, pan, send);
    });
  }

  function noiseHit(t, dur, { type = 'bandpass', freq = 2000, q = 1, peak = 0.2, attack = 0.002, bus = sfxBus, pan = 0, send = 0 } = {}) {
    const s = noiseSrc(t, dur + 0.05);
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    env(g, t, peak, attack, dur);
    s.connect(f).connect(g);
    out(g, bus, pan, send);
    return f;
  }

  // ---------- kit playero: madera, marimba, sello, metales y platillo (en Fa, como la música) ----------

  // Bloque de madera: tono que cae apenas + clic de ruido. Toques y tic del reloj.
  function wood(t, freq, peak, decay) {
    const o = osc('triangle', freq, t, t + decay + 0.05);
    o.frequency.exponentialRampToValueAtTime(freq * 0.82, t + decay);
    const g = ctx.createGain();
    env(g, t, peak, 0.001, decay);
    o.connect(g);
    out(g, sfxBus);
    noiseHit(t, 0.006, { freq: freq * 2.6, q: 3, peak: peak * 0.45 });
  }

  // Marimba: fundamental redonda + parciales altos que se apagan enseguida (el golpe de la baqueta).
  function marimba(t, note, vel, { pan = 0, send = 0.15, decay = 0.45 } = {}) {
    const f = midi(note);
    [[1, 1, 1], [4, 0.14, 0.12], [9.9, 0.04, 0.05]].forEach(([ratio, amp, dk], i) => {
      const o = osc('sine', f * ratio, t, t + decay * dk + 0.05);
      const g = ctx.createGain();
      env(g, t, vel * amp, 0.002, decay * dk);
      o.connect(g);
      out(g, sfxBus, pan, i ? 0 : send);
    });
  }

  // Sello de pasaporte: golpe sordo del mango + goma contra el papel.
  function stamp(t, peak) {
    const o = osc('sine', 210, t, t + 0.2);
    o.frequency.exponentialRampToValueAtTime(62, t + 0.09);
    const g = ctx.createGain();
    env(g, t, peak, 0.002, 0.14);
    o.connect(g);
    out(g, sfxBus, 0, 0.08);
    noiseHit(t, 0.045, { type: 'lowpass', freq: 1300, peak: peak * 0.5 });
    noiseHit(t + 0.004, 0.018, { type: 'highpass', freq: 3800, q: 0.7, peak: peak * 0.18 });
  }

  // Metal de fanfarria: dos sierras apenas desafinadas con un filtro que se abre al atacar.
  function brass(t, note, vel, dur, { pan = 0, send = 0.3 } = {}) {
    const f = midi(note);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(f * 1.5, t);
    lp.frequency.exponentialRampToValueAtTime(f * 6, t + 0.05);
    lp.frequency.exponentialRampToValueAtTime(f * 3, t + 0.05 + Math.min(dur, 0.4));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.03);
    g.gain.linearRampToValueAtTime(vel * 0.75, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    [-6, 6].forEach((cents) => {
      const o = osc('sawtooth', f, t, t + dur + 0.25);
      o.detune.setValueAtTime(cents, t);
      o.connect(lp);
    });
    lp.connect(g);
    out(g, sfxBus, pan, send);
  }

  // Platillo: ruido agudo con cola larga al reverb + cuerpo corto.
  function cymbal(t, peak, dur) {
    noiseHit(t, dur, { type: 'highpass', freq: 6500, q: 0.6, peak, attack: 0.003, send: 0.35 });
    noiseHit(t, 0.25, { freq: 3800, q: 0.9, peak: peak * 0.6 });
  }

  // ---------- música "Ruta Caribe": groove R&B de turismo (~96 BPM) ----------
  // Todo fijo, sin azar: cada vuelta de 16 compases (40 s) suena idéntica. Cada capa tiene su
  // volumen y la pantalla elige la mezcla (mood) con fundidos, sin cortar el tema. Una capa en
  // silencio deja de programar notas (ahorra CPU en la laptop).

  const BPM = 96;
  const SIX = 60 / BPM / 4;   // semicorchea
  const SWING = SIX * 0.18;   // semicorcheas impares apenas atrasadas
  const STEPS = 16;           // semicorcheas por compás

  // Fa mayor. Voicings de piano eléctrico sin fundamental (la pone el bajo).
  const CH = {
    Bbmaj9: { bass: 46, notes: [62, 65, 69, 72] },
    Am7: { bass: 45, notes: [64, 67, 69, 72] },
    Gm9: { bass: 43, notes: [58, 62, 65, 69] },
    C9sus: { bass: 48, notes: [58, 62, 65, 67] },
    Dm9: { bass: 50, notes: [60, 64, 65, 69] },
    C13: { bass: 48, notes: [58, 62, 64, 69] },
  };
  // Parte A (8 compases) + parte B (8 compases), un acorde por compás.
  const FORM = ['Bbmaj9', 'Am7', 'Gm9', 'C9sus', 'Bbmaj9', 'Am7', 'Gm9', 'C9sus',
    'Dm9', 'Am7', 'Bbmaj9', 'C9sus', 'Dm9', 'Am7', 'Gm9', 'C13'].map((k) => CH[k]);

  const COMP = [[0, 0.065, 1.1], [6, 0.045, 0.3], [10, 0.055, 0.8], [14, 0.045, 0.3, true]]; // [semicorchea, fuerza, caída, anticipa el acorde que viene]
  const BASS = [[0, 3, 0], [3, 2, 0], [6, 1, 12], [8, 3, 7], [11, 2, 0], [14, 2, 12]];      // [semicorchea, duración, intervalo]
  const KICK = [0, 6, 8, 11];
  const CLAP = [4, 12];
  const HAT = [0.05, 0.018, 0.032, 0.02, 0.05, 0.018, 0.032, 0.02, 0.05, 0.018, 0.032, 0.02, 0.05, 0.018, 0, 0.02]; // 14 = abierto
  const SHAKER = [0.03, 0.015, 0.022, 0.015];
  const PALMAS = [7, 15];

  // Melodía de steel-drum, un compás por fila: [semicorchea, nota, duración].
  const HOOK = [
    [[2, 72, 2], [4, 74, 2], [6, 77, 3], [10, 74, 2], [12, 72, 3]],
    [[0, 69, 4], [6, 72, 2], [8, 76, 6]],
    [[2, 74, 2], [4, 77, 2], [6, 79, 3], [10, 77, 2], [12, 74, 3]],
    [[0, 77, 4], [6, 74, 2], [8, 72, 6]],
  ];
  const MELODY = [
    ...HOOK,
    HOOK[0], HOOK[1], HOOK[2], [[0, 77, 3], [4, 79, 3], [8, 81, 6]],
    [[4, 76, 2], [6, 77, 2], [8, 81, 6]],
    [[0, 79, 4], [6, 76, 2], [8, 72, 6]],
    [[2, 74, 2], [4, 77, 2], [6, 81, 3], [10, 79, 2], [12, 77, 3]],
    [[0, 79, 8], [12, 77, 2], [14, 79, 2]],
    [[0, 81, 4], [6, 77, 2], [8, 76, 2], [10, 74, 4]],
    [[0, 72, 8], [12, 69, 2], [14, 72, 2]],
    [[0, 74, 4], [6, 70, 2], [8, 74, 2], [10, 77, 4]],
    [[0, 76, 6], [8, 79, 2], [12, 81, 4]],
  ];

  // Mezclas por pantalla: full = espera/menú, game = jugando (sin batería ni melodía, más bajo),
  // cima = todo más palmas, shaker y steel-drum una octava arriba.
  const LAYERS = ['keys', 'bass', 'drums', 'hat', 'melody', 'extra'];
  // Reverb por capa y después de su volumen: al apagarse una capa no quedan colas sueltas.
  const SEND = { keys: 0.35, bass: 0, drums: 0.08, hat: 0, melody: 0.4, extra: 0.5 };
  const MOODS = {
    full: { level: 1, keys: 1, bass: 1, drums: 1, hat: 1, melody: 1, extra: 0 },
    game: { level: 0.65, keys: 0.85, bass: 0.8, drums: 0, hat: 0.6, melody: 0, extra: 0 },
    cima: { level: 1, keys: 1, bass: 1, drums: 1, hat: 1, melody: 1, extra: 1 },
  };
  let mood = 'full';
  let moodBus = null;
  const layer = {}; // nombre → { bus, send, until }: hasta cuándo se siguen programando notas
  let step = 0;
  let nextTime = 0;
  let timer = null;

  function applyMood(tau) {
    const m = MOODS[mood];
    const now = ctx.currentTime;
    moodBus.gain.cancelScheduledValues(now);
    moodBus.gain.setTargetAtTime(m.level, now, tau);
    for (const name of LAYERS) {
      const l = layer[name];
      l.bus.gain.cancelScheduledValues(now);
      l.bus.gain.setTargetAtTime(m[name], now, tau);
      l.send.gain.cancelScheduledValues(now);
      l.send.gain.setTargetAtTime(SEND[name] * m.level, now, tau);
      l.until = m[name] > 0 ? Infinity : now + tau * 6;
    }
  }

  function buildLayers() {
    if (moodBus) return;
    moodBus = ctx.createGain();
    moodBus.connect(musicBus);
    for (const name of LAYERS) {
      const bus = ctx.createGain();
      bus.gain.value = 0;
      bus.connect(moodBus);
      const send = ctx.createGain();
      send.gain.value = 0;
      bus.connect(send).connect(reverbIn);
      layer[name] = { bus, send, until: 0 };
    }
    hatVoice = noiseVoice(layer.hat.bus, 'highpass', 7500, 0.5, 0.25);
    shakerVoice = noiseVoice(layer.extra.bus, 'bandpass', 5500, 1.2, 0.4);
  }

  // Hi-hat y shaker: una sola fuente de ruido en bucle cada uno; cada golpe es solo una envolvente
  // (no crea nodos nuevos en cada semicorchea).
  let hatVoice = null;
  let shakerVoice = null;
  function noiseVoice(bus, type, freq, q, pan) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    s.connect(f).connect(g);
    out(g, bus, pan);
    s.start();
    return g;
  }

  const on = (name, t) => layer[name].until > t;

  // Steel-drum: parciales armónicos 1-2-3 que se apagan rápido, como un pan golpeado.
  function steel(t, note, vel, bus, { pan = 0, send = 0, decay = 0.6 } = {}) {
    const f = midi(note);
    [[1, 1, 1], [2, 0.45, 0.5], [3, 0.14, 0.3]].forEach(([ratio, amp, dk], i) => {
      const o = osc('sine', f * ratio, t, t + decay * dk + 0.1);
      const g = ctx.createGain();
      env(g, t, vel * amp, 0.003, decay * dk);
      o.connect(g);
      out(g, bus, pan, i ? 0 : send);
    });
  }

  function pad(t, chord, dur, bus) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.Q.value = 0.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.6);
    g.gain.setValueAtTime(0.045, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
    chord.notes.forEach((n, i) => {
      const o = osc('sawtooth', midi(n - 12), t, t + dur + 1.3);
      o.detune.value = i % 2 ? 6 : -6;
      o.connect(lp);
    });
    lp.connect(g);
    out(g, bus);
  }

  function bassNote(t, note, dur, bus) {
    const f = midi(note);
    const o = osc('sine', f, t, t + dur + 0.2);
    const o2 = osc('triangle', f * 2, t, t + dur + 0.2);
    const g = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.14;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.08, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    o.connect(g);
    o2.connect(g2).connect(g);
    out(g, bus);
  }

  function kick(t, peak, bus) {
    const k = osc('sine', 120, t, t + 0.35);
    k.frequency.exponentialRampToValueAtTime(48, t + 0.11);
    const g = ctx.createGain();
    env(g, t, peak, 0.003, 0.26);
    k.connect(g);
    out(g, bus);
  }

  // Palmas: dos golpes de ruido casi juntos, como varias manos.
  function clap(t, peak, bus, pan = 0) {
    noiseHit(t, 0.02, { freq: 1500, q: 0.8, peak: peak * 0.7, bus, pan });
    noiseHit(t + 0.012, 0.12, { freq: 1500, q: 0.8, peak, bus, pan });
  }

  function scheduleStep(s, t) {
    const bar = Math.floor(s / STEPS) % FORM.length;
    const i = s % STEPS;
    const chord = FORM[bar];

    if (on('keys', t)) {
      const bus = layer.keys.bus;
      if (i === 0) pad(t, chord, SIX * STEPS, bus);
      for (const [at, vel, decay, push] of COMP) {
        if (at !== i) continue;
        const c = push ? FORM[(bar + 1) % FORM.length] : chord;
        c.notes.forEach((n, k) => epiano(t + k * 0.01, n, vel, bus, { send: 0, decay }));
      }
    }

    if (on('bass', t)) {
      for (const [at, len, interval] of BASS) if (at === i) bassNote(t, chord.bass + interval, len * SIX, layer.bass.bus);
    }

    if (on('drums', t)) {
      if (KICK.includes(i)) kick(t, i === 0 ? 0.22 : 0.16, layer.drums.bus);
      if (CLAP.includes(i)) clap(t, 0.11, layer.drums.bus);
    }

    if (on('hat', t)) {
      if (i === 14) env(hatVoice, t, 0.04, 0.004, 0.16);
      else env(hatVoice, t, HAT[i], 0.002, 0.035);
    }

    const mel = on('melody', t);
    const extra = on('extra', t);
    if (mel || extra) {
      for (const [at, note, len] of MELODY[bar]) {
        if (at !== i) continue;
        const decay = 0.35 + len * 0.06;
        if (mel) steel(t, note, 0.075, layer.melody.bus, { decay });
        if (extra) steel(t, note + 12, 0.03, layer.extra.bus, { pan: -0.35, decay: decay * 0.8 });
      }
    }
    if (extra) {
      env(shakerVoice, t, SHAKER[i % 4], 0.01, 0.06);
      if (PALMAS.includes(i)) clap(t, 0.06, layer.extra.bus, -0.3);
    }
  }

  function tickMusic() {
    if (!ready()) return;
    while (nextTime < ctx.currentTime + 0.2) {
      scheduleStep(step, nextTime + (step % 2 ? SWING : 0));
      nextTime += SIX;
      step++;
    }
  }

  function startMusic() {
    if (timer || !settings.music || !ready()) return;
    buildLayers();
    applyMood(0.01);
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(tickMusic, 40);
  }

  function stopMusic() {
    clearInterval(timer);
    timer = null;
  }

  // ---------- efectos ----------

  // Un sonido fijo por acción (nada al azar). Los nombres viejos siguen andando para los juegos.
  const SFX = {
    tap(t) { wood(t, 1150, 0.16, 0.05); },                 // toque
    tick(t) { wood(t, 1900, 0.11, 0.022); },               // tic del reloj y de la rueda
    correct(t) {                                           // acierto: 2 notas de marimba que suben
      marimba(t, 77, 0.2, { pan: -0.1 });
      marimba(t + 0.085, 84, 0.2, { pan: 0.1 });
    },
    wrong(t) {                                             // fallo: bonk grave y suave
      const o = osc('sine', 175, t, t + 0.3);
      o.frequency.exponentialRampToValueAtTime(87, t + 0.16);
      const g = ctx.createGain();
      env(g, t, 0.2, 0.004, 0.22);
      o.connect(g);
      out(g, sfxBus);
      noiseHit(t, 0.03, { type: 'lowpass', freq: 600, peak: 0.06 });
    },
    levelup(t) {                                           // subir nivel: arpegio de steel-drum
      [77, 81, 84].forEach((n, i) => steel(t + i * 0.1, n, i === 2 ? 0.2 : 0.16, sfxBus, { pan: -0.25 + i * 0.25, send: 0.3, decay: 0.8 }));
    },
    stand(t) {                                             // plantarse: sello de pasaporte ("ka-chunk")
      stamp(t, 0.1);
      stamp(t + 0.14, 0.24);
    },
    lose(t) {                                              // perder: 2 notas suaves que bajan
      marimba(t, 72, 0.14, { send: 0.3, decay: 0.8 });
      marimba(t + 0.26, 65, 0.13, { send: 0.3, decay: 1.1 });
    },
    coupon(t) {                                            // cupón: chime + sello cuando aparece el código
      SFX.chime(t);
      stamp(t + 0.43, 0.24); // = REVEAL.coupon − REVEAL.prize en winner-card.js
    },
    cima(t) {                                              // cima: fanfarria larga + platillo
      [[0, 72, 0.1], [0.13, 72, 0.1], [0.26, 72, 0.1], [0.4, 77, 1.1]].forEach(([at, n, d]) => brass(t + at, n, 0.05, d));
      [65, 69, 72].forEach((n, i) => brass(t + 0.4, n, 0.035, 1.1, { pan: -0.3 + i * 0.3 }));
      kick(t + 0.4, 0.5, sfxBus);
      cymbal(t + 0.4, 0.07, 1.8);
      [77, 81, 84, 89].forEach((n, i) => steel(t + 0.7 + i * 0.08, n, 0.1, sfxBus, { pan: -0.3 + i * 0.2, send: 0.35, decay: 0.7 }));
      bell(t + 1.1, 89, 0.1, sfxBus, { decay: 2 });
    },
    press(t) {
      const o = osc('triangle', 540, t, t + 0.2);
      o.frequency.exponentialRampToValueAtTime(380, t + 0.08);
      const g = ctx.createGain();
      env(g, t, 0.16, 0.003, 0.12);
      o.connect(g);
      out(g, sfxBus, 0, 0.12);
    },
    whoosh(t) {
      const f = noiseHit(t, 0.5, { freq: 300, q: 0.9, peak: 0.08, attack: 0.18, send: 0.2 });
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.45);
    },
    tick(t) {
      noiseHit(t, 0.014, { freq: 3200, q: 2.2, peak: 0.22 });
      const o = osc('sine', 2100, t, t + 0.03);
      const g = ctx.createGain();
      env(g, t, 0.04, 0.001, 0.012);
      o.connect(g);
      out(g, sfxBus);
    },
    flap(t) {
      noiseHit(t, 0.02, { type: 'highpass', freq: 2000, q: 0.7, peak: 0.14 });
    },
    paper(t) {
      const f = noiseHit(t, 0.55, { freq: 2600, q: 0.6, peak: 0.07, attack: 0.08 });
      f.frequency.linearRampToValueAtTime(1700, t + 0.5);
    },
    seal(t) { stamp(t, 0.22); },
    rise(t) {
      const f = noiseHit(t, 1.3, { freq: 500, q: 1.2, peak: 0.05, attack: 1.1, send: 0.4 });
      f.frequency.exponentialRampToValueAtTime(5000, t + 1.2);
    },
    chime(t) {
      [77, 81, 84, 89].forEach((n, i) => bell(t + i * 0.09, n, 0.11, sfxBus, { pan: -0.3 + i * 0.2 }));
    },
    win(t) {                                               // premio grande: fanfarria + campanas
      [[0, 0.12], [0.16, 0.12], [0.32, 1.3]].forEach(([at, d]) => [65, 69, 72, 77].forEach((n, i) => brass(t + at, n, 0.03, d, { pan: -0.3 + i * 0.2 })));
      cymbal(t + 0.32, 0.06, 2);
      [77, 81, 84, 89, 93, 96].forEach((n, i) => bell(t + 0.45 + i * 0.1, n, 0.09, sfxBus, { pan: -0.4 + i * 0.16, decay: 2.2 }));
      noiseHit(t + 0.5, 1.8, { type: 'highpass', freq: 8000, q: 0.5, peak: 0.025, attack: 1.2, send: 0.6 });
    },
    soft(t) {
      epiano(t, 76, 0.09, sfxBus, { send: 0.45 });
      epiano(t + 0.28, 72, 0.08, sfxBus, { send: 0.45 });
    },
    retry(t) {                                             // otro intento
      [72, 77, 81].forEach((n, i) => epiano(t + i * 0.13, n, 0.09, sfxBus, { send: 0.4 }));
    },
  };

  // ---------- API ----------

  function applyVolumes() {
    if (!ctx) return;
    const now = ctx.currentTime;
    musicBus.gain.setTargetAtTime(settings.music ? settings.musicVol : 0, now, 0.3);
    sfxBus.gain.setTargetAtTime(settings.sfx ? settings.sfxVol : 0, now, 0.05);
  }

  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume().then(startMusic).catch(() => {});
    else startMusic();
  }

  L.sound = {
    play(name) {
      if (!settings.sfx || !ready() || !SFX[name]) return;
      try { SFX[name](ctx.currentTime + 0.005); } catch { /* el sonido nunca rompe la pantalla */ }
    },

    // Raspado continuo: llamar en cada movimiento con la intensidad (0..1).
    scratch(level) {
      if (!settings.sfx || !ready()) return;
      const now = ctx.currentTime;
      if (!scratchGain) {
        const s = ctx.createBufferSource();
        s.buffer = noise;
        s.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 2200;
        f.Q.value = 0.7;
        scratchGain = ctx.createGain();
        scratchGain.gain.value = 0;
        s.connect(f).connect(scratchGain).connect(sfxBus);
        s.start();
      }
      scratchGain.gain.cancelScheduledValues(now);
      scratchGain.gain.setTargetAtTime(Math.min(1, level) * 0.1, now, 0.02);
      scratchGain.gain.setTargetAtTime(0, now + 0.09, 0.05);
    },

    // Baja la música mientras se revela un resultado.
    duck(ms = 4000) {
      if (!ctx) return;
      const now = ctx.currentTime;
      duckBus.gain.cancelScheduledValues(now);
      duckBus.gain.setTargetAtTime(0.3, now, 0.15);
      duckBus.gain.setTargetAtTime(1, now + ms / 1000, 0.8);
    },

    // Mezcla de la música según la pantalla: 'full' (espera/menú), 'game' (jugando) o 'cima'.
    mood(name) {
      if (!MOODS[name] || name === mood) return;
      mood = name;
      if (ready() && moodBus) applyMood(0.5);
    },

    get settings() { return { ...settings }; },

    set(partial) {
      Object.assign(settings, partial);
      L.store.set(KEY, settings);
      applyVolumes();
      if (settings.music) startMusic();
      else stopMusic();
    },
  };

  // Con --autoplay-policy=no-user-gesture-required arranca solo; si no, con el primer clic.
  document.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      L.sound.set({ music: !settings.music });
      L.toast(settings.music ? 'Música activada' : 'Música en silencio', 1800);
    }
  });
  unlock();
})();
