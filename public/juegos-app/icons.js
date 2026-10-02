'use strict';

// Íconos propios: 24×24, trazo 1.6 con puntas redondas, color heredado (currentColor).
// Ilustraciones SVG de destino para fondos y tarjetas. Todo estático, nunca texto de usuario.
(() => {
  const L = window.L360;

  const PATHS = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    envelope: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    ticket: '<path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1z"/><path d="M15 6.8v10.4" stroke-dasharray="1.6 2"/>',
    board: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M6.5 13h5M6.5 16.5h5M14.5 13h3M14.5 16.5h3"/>',
    plane: '<path d="M21 3L3 10.5l7 3L13.5 21z"/><path d="M21 3L10 13.5"/>',
    umbrella: '<path d="M21 12a9 9 0 0 0-18 0z"/><path d="M12 12v6.5a2 2 0 0 0 4 0"/><path d="M12 3v1"/>',
    palm: '<path d="M12 21c0-5 .6-9 2-12"/><path d="M14 9c-2-3-6-3.5-8.5-1.5 2.5 0 5 .5 8.5 1.5zM14 9c1.5-3 5-4 7.5-2.5-2.5.3-5 1.2-7.5 2.5zM14 9c-.5-2.5-2.5-4.5-5-5 1.5 1.5 3 3 5 5z"/><path d="M5 21h14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    sunset: '<path d="M3 17c2 0 2-1.5 4.5-1.5S9.5 17 12 17s2.5-1.5 4.5-1.5S19 17 21 17M6 20.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/><path d="M6.5 13a5.5 5.5 0 0 1 11 0"/><path d="M12 3.5v2M5.2 6.2l1.3 1.3M18.8 6.2l-1.3 1.3"/>',
    wave: '<path d="M2.5 9.5c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2M2.5 15.5c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
    snack: '<path d="M6.5 5.5h11l.7 2.5-.7 8.5.7 2.5H5.8l.7-2.5-.7-8.5z"/><path d="M6.5 5.5 6 3.5h12l-.5 2M6.5 16.5 6 20.5h12l-.5-4"/><circle cx="12" cy="11.5" r="2.4"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8c-1-3-5-4-5-1.5C7 8 12 8 12 8zM12 8c1-3 5-4 5-1.5C17 8 12 8 12 8z"/>',
    percent: '<path d="M18.5 5.5l-13 13"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".7" fill="currentColor" stroke="none"/>',
    suitcase: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M8.5 7.5v-2A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5v2M3 12.5h18M10 12.5v2h4v-2"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M7.5 12h9"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    sparkles: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    click: '<path d="M9.5 9.5l10 4-4.3 1.5-1.7 4.5z"/><path d="M5 4.5l1.3 1.3M3.5 9.5h1.8M9.5 3.5v1.8M13.2 5.2l-1.2 1.2"/>',
    arrow: '<path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5"/>',
    repeat: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    mountain: '<path d="M2.5 19.5l6.5-11 4 6.5 2.5-3.5 6 8z"/><path d="M6.8 12.2l2.2 1.3 2-1.3"/>',
    waterfall: '<path d="M3 5.5h18"/><path d="M8 5.5v9M12 5.5v12M16 5.5v9"/><path d="M4.5 19c1.5 0 2-1 3.5-1s2 1 4 1 2.5-1 4-1 2 1 3.5 1"/>',
    boat: '<path d="M12 3.5v13"/><path d="M12 4.5l6.5 10H12z"/><path d="M11 7.5l-5 7h5"/><path d="M3.5 17.5h17l-2.5 3h-12z"/>',
    fish: '<path d="M3 12c3-4.5 9-6 14-2.5L21 7v10l-4-2.5C12 18 6 16.5 3 12z"/><circle cx="8" cy="11.2" r=".9" fill="currentColor" stroke="none"/>',
    chalet: '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5M7.5 12.5h2M14.5 12.5h2"/>',
    dune: '<path d="M2.5 17.5c2.5-4 5.5-6 9-6s6.5 2 10 6"/><path d="M2.5 20.5h19"/><circle cx="17" cy="6" r="2"/>',
    volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  };

  L.icon = (name, cls = '') => L.svg(
    `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`,
  );

  // Escena de atardecer en la playa: cielo, sol con franjas, mar y palmera.
  let uid = 0;
  L.beachScene = (cls = '') => {
    const id = `bs${++uid}`;
    return L.svg(`
<svg class="${cls}" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#12262b"/><stop offset=".45" stop-color="#6b3a3a"/>
      <stop offset=".62" stop-color="#e2733a"/><stop offset=".7" stop-color="#fbc000"/>
    </linearGradient>
    <linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3e827d"/><stop offset="1" stop-color="#0b181c"/>
    </linearGradient>
    <linearGradient id="${id}sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff1b8"/><stop offset="1" stop-color="#fc9a00"/>
    </linearGradient>
    <clipPath id="${id}clip"><rect x="0" y="0" width="390" height="590"/></clipPath>
  </defs>
  <rect width="390" height="844" fill="url(#${id}sky)"/>
  <g clip-path="url(#${id}clip)">
    <circle class="scene-sun" cx="195" cy="560" r="120" fill="url(#${id}sun)"/>
    <g fill="#e2733a" opacity=".55"><rect x="60" y="520" width="270" height="7"/><rect x="60" y="545" width="270" height="10"/><rect x="60" y="572" width="270" height="14"/></g>
  </g>
  <rect y="590" width="390" height="254" fill="url(#${id}sea)"/>
  <g class="scene-waves" stroke="#fbc000" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M40 630h90M200 650h140M90 690h120M250 720h80M30 760h110"/>
  </g>
  <g fill="#0b181c">
    <path d="M300 844c-8-120-4-230 26-330l10 3c-26 100-30 206-22 327z"/>
    <path d="M331 512c-40-40-110-44-150-10 50-6 100 2 150 14zM331 512c30-44 96-58 140-30-50 2-96 12-140 34zM331 512c-6-46-40-80-86-88 30 26 58 56 86 90zM331 512c16-40 56-64 100-62-40 14-72 34-100 64zM331 512c-46-4-88 20-108 58 34-26 72-44 108-56z"/>
  </g>
</svg>`);
  };
})();
