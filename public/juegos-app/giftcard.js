'use strict';

// Gift card de Lotus 360 dibujada en SVG, con la estética de las tarjetas impresas: 5% = cielo con
// nubes y regalo naranja; 10% = playa con palmeras y regalo azul y amarillo. Todo el movimiento es CSS
// (transform/opacity, ver .gc en styles.css); el SVG es solo dibujo.
//   create({ pct, code, mode }) -> nodo DOM. mode: 'full' (todo se mueve) | 'lite' (solo el brillo) | 'still'.
//   image(pct, px) -> Promise<Image|null> estática (para canvas, sin textos chicos).
// El % viene del premio ("Gift card 10%"); si no se puede leer, quien llama usa su ícono de siempre.
(() => {
  const L = window.L360;
  const W = 340;
  const H = 200;
  let uid = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  const THEMES = {
    sky: {
      lid: '#f5a41c', body: '#f5a41c', ribbon: '#2b3c8c', band: '#f5a41c', bow: '#f5a41c', medal: '#1f2b66', peak: '#ffffff',
      brand: '#f5a41c', box: '#ffffff', ink: '#1f2b66',
    },
    beach: {
      lid: '#1d2b63', body: '#f2b31b', ribbon: '#1d2b63', band: '#2b3b80', bow: '#1d2b63', medal: '#ffffff', peak: '#1d2b63',
      brand: '#ffffff', box: '#ffffff', ink: '#1d2b63',
    },
  };

  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="6" rx="36" ry="12" fill="#b9cffc" opacity=".55"/>`
    + '<g fill="#fff"><ellipse rx="34" ry="12"/><circle cx="-14" cy="-9" r="14"/><circle cx="6" cy="-15" r="18"/><circle cx="24" cy="-6" r="12"/></g></g>';

  const frond = (x, y, a, l) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 0Q${l * 0.5} ${-l * 0.34} ${l} 0Q${l * 0.5} ${-l * 0.02} 0 0Z"/>`;

  const palm = (bx, by, tx, ty, s, delay) => `<g class="gc-palm" style="transform-origin:${bx}px ${by}px;animation-delay:${delay}s">`
    + `<path d="M${bx} ${by}C${bx - 10} ${by - (by - ty) * 0.5} ${tx + 12} ${ty + (by - ty) * 0.3} ${tx} ${ty}" stroke="#c8b48c" stroke-width="${(3.6 * s).toFixed(1)}" fill="none" stroke-linecap="round"/>`
    + `<g fill="#2c9440">${[-165, -125, -70, -20, 25, 160].map((a, i) => frond(tx, ty, a, (i % 2 ? 24 : 27) * s)).join('')}</g>`
    + `<g fill="#1d7431">${[-145, -45, 8].map((a) => frond(tx, ty, a, 20 * s)).join('')}</g></g>`;

  const spark = (x, y, k) => `<g transform="translate(${x} ${y})"><path class="gc-spark" style="animation-delay:${-k * 0.9}s" fill="#fff" d="M0-6Q0 0 6 0Q0 0 0 6Q0 0-6 0Q0 0 0-6Z"/></g>`;

  function background(theme, id) {
    if (theme === 'sky') {
      return `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#2f4fd0"/><stop offset=".55" stop-color="#1c2f9a"/><stop offset="1" stop-color="#10195f"/></linearGradient></defs>`
        + `<rect width="${W}" height="${H}" fill="url(#${id}b)"/>`
        + `<g class="gc-drift">${cloud(58, 92, 1.3)}${cloud(28, 40, 0.8)}${cloud(120, 150, 0.7)}</g>`
        + `<g class="gc-drift gc-rev">${cloud(282, 66, 1.45)}${cloud(300, 128, 0.9)}${cloud(232, 22, 0.7)}</g>`
        + `<rect y="112" width="${W}" height="88" fill="url(#${id}o)"/>`
        + `<defs><linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10195f" stop-opacity="0"/><stop offset="1" stop-color="#10195f" stop-opacity=".82"/></linearGradient></defs>`;
    }
    return `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8f7"/><stop offset="1" stop-color="#5cc3ea"/></linearGradient>`
      + `<linearGradient id="${id}w" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#22b0e3"/><stop offset=".5" stop-color="#1279c6"/><stop offset="1" stop-color="#0b2f86"/></linearGradient>`
      + `<linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2f86" stop-opacity="0"/><stop offset="1" stop-color="#0b2f86" stop-opacity=".85"/></linearGradient></defs>`
      + `<rect width="${W}" height="${H}" fill="url(#${id}w)"/><rect width="${W}" height="48" fill="url(#${id}s)"/>`
      + `<g fill="#fff">${[[34, 74, 40], [70, 96, 30], [20, 122, 26], [96, 66, 22]].map(([x, y, w], k) => `<rect class="gc-glint" style="--k:${k}" x="${x}" y="${y}" width="${w}" height="2.4" rx="1.2"/>`).join('')}</g>`
      + `<path d="M${W} 76C314 84 298 112 262 152L${W} 164Z" fill="#efe9d6"/>`
      + `${palm(326, 132, 240, 32, 1, 0)}${palm(336, 124, 324, 56, 0.8, -2.4)}`
      + `<rect y="100" width="${W}" height="100" fill="url(#${id}o)"/>`;
  }

  // Regalo con lazo y el sello de Lotus (montaña sobre olas) en la cinta.
  function gift(t) {
    return '<g class="gc-gift">'
      + `<g fill="${t.bow}"><ellipse cx="150" cy="26" rx="19" ry="10" transform="rotate(-14 150 26)"/><ellipse cx="190" cy="26" rx="19" ry="10" transform="rotate(14 190 26)"/></g>`
      + `<rect x="118" y="36" width="104" height="24" rx="8" fill="${t.lid}"/>`
      + `<path d="M126 62h88v46a9 9 0 0 1-9 9h-70a9 9 0 0 1-9-9z" fill="${t.body}"/>`
      + `<rect x="126" y="58" width="88" height="4" fill="${t.ribbon}"/>`
      + `<path d="M158 30H182V116L170 104 158 116Z" fill="${t.band}" stroke="${t.ribbon}" stroke-width="3" stroke-linejoin="round"/>`
      + `<circle cx="170" cy="53" r="11.5" fill="${t.medal}"/>`
      + `<path d="M162 57l4.5-9 3.5 5 3.5-7 6 11z" fill="${t.peak}"/>`
      + `<path d="M161.5 60.5q2-2 4 0t4 0 4 0 4 0" fill="none" stroke="${t.peak}" stroke-width="1.4" stroke-linecap="round"/>`
      + '</g>';
  }

  function svg(pct, { code = '', mini = false } = {}) {
    const theme = pct >= 10 ? 'beach' : 'sky';
    const t = THEMES[theme];
    const id = `gc${(uid += 1)}`;
    const font = 'font-family="Arial Black, Arial, sans-serif" font-weight="900"';
    const txt = `${pct}%`;
    let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`;
    out += background(theme, id);
    out += `<g fill="#fff">${spark(96, 34, 0)}${spark(252, 92, 1)}${spark(226, 20, 2)}</g>`;
    out += gift(t);
    if (mini) {
      out += `<text x="170" y="192" text-anchor="middle" font-size="${txt.length > 2 ? 78 : 88}" fill="#fff" ${font}>${txt}</text>`;
    } else {
      out += `<text x="14" y="142" font-size="13" fill="#fff" letter-spacing="1.5" font-family="Arial, sans-serif" font-weight="800">VALOR</text>`;
      out += `<text x="12" y="188" font-size="${txt.length > 2 ? 42 : 52}" fill="#fff" ${font}>${txt}</text>`;
      out += `<text x="170" y="150" text-anchor="middle" font-size="16" fill="${t.brand}" letter-spacing="1.5" font-family="Arial, sans-serif" font-weight="800">LOTUS360</text>`;
      out += `<text x="170" y="170" text-anchor="middle" font-size="18" fill="${t.brand}" letter-spacing="1" font-family="Arial, sans-serif" font-weight="800">GIFT CARD</text>`;
      if (code) {
        out += `<rect x="238" y="132" width="90" height="52" rx="7" fill="${t.box}"/>`
          + `<text x="283" y="146" text-anchor="middle" font-size="7.5" fill="#6b7280" letter-spacing="1.5" font-family="Arial, sans-serif" font-weight="700">CÓDIGO</text>`
          + `<text x="283" y="172" text-anchor="middle" font-size="21" fill="${t.ink}" letter-spacing="2" font-family="Consolas, 'Courier New', monospace" font-weight="700">${esc(code)}</text>`;
      }
    }
    return `${out}</svg>`;
  }

  L.giftCard = {
    // "Gift card de 10% de descuento…" -> 10; null si no hay porcentaje.
    pctOf(text) {
      const m = /(\d{1,3})\s*%/.exec(String(text || ''));
      return m ? Number(m[1]) : null;
    },

    create({ pct, code = '', mode = 'full', mini = false }) {
      return L.el('div', { class: `gc gc-${pct >= 10 ? 'beach' : 'sky'} ${mode}${mini ? ' mini' : ''}`, role: 'img', 'aria-label': `Gift card ${pct}%` },
        L.svg(svg(pct, { code, mini })),
        mode === 'still' ? null : L.el('i', { class: 'gc-sheen' }));
    },

    // Imagen estática (para canvas): solo dibujo, sin animación.
    image(pct, px = 170) {
      const h = Math.round((px * H) / W);
      const markup = svg(pct, { mini: true }).replace('<svg ', `<svg width="${px}" height="${h}" `);
      return new Promise((resolve) => {
        const img = new Image(px, h);
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
      });
    },
  };
})();
