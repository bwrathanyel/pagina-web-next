/* eslint-disable */
// GENERADO por scripts/sync-cotizador-servidor.mjs (repo CRM) desde lotus-crm-preview/app.js. NO EDITAR A MANO.
// @ts-nocheck
// Motor de hoteles de la sección Cotizaciones del CRM, el mismo que usan el bot de ventas y cotizador-chat.
export function motorCotizacionWeb() {
  const cbComparar = true;
const TAR_OCUPACION = new Map([
  ['sgl', 1], ['sencilla', 1], ['hab_sgl', 1], ['1_persona', 1],
  ['dbl', 2], ['doble', 2], ['hab_dbl', 2], ['dbl_pax', 2],
  ['tpl', 3], ['triple', 3],
  ['cdp', 4], ['cpl', 4], ['cdl', 4], ['cdpl', 4], ['cua', 4], ['cuad', 4], ['cuadruple', 4], ['cpl_cua', 4],
  ['qpl', 5], ['quin', 5], ['quint', 5], ['qtp', 5], ['qtpl', 5], ['qui', 5], ['qpl_qui', 5],
  ['sext', 6], ['sex', 6],
  ['sept', 7],
  ['octpl', 8],
]);
const CB_MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const cbHoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
const cbFechaCorta = iso => { if (!iso) return ''; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y.slice(2)}`; };
const cbEsPax = it => !!CB_TIPOS[it.tipo || 'boleto']?.pax;
const cbPax = it => it.adultos === undefined ? { a: Number(it.cant) || 0, n: 0, i: 0 } : { a: Number(it.adultos) || 0, n: Number(it.ninos) || 0, i: Number(it.infantes) || 0 };
const cbPorHabitacion = it => it.tipo === 'hotel' && it.unidad === 'habitacion_noche';
const cbHabitaciones = it => it.habitaciones === undefined ? 1 : Number(it.habitaciones) || 0;
const cbHabitacionesTexto = it => `${cbHabitaciones(it)} ${cbHabitaciones(it) === 1 ? 'habitación' : 'habitaciones'}`;
const cbPorNoche = it => it.tipo === 'hotel' && ['persona_noche', 'habitacion_noche'].includes(it.unidad);
const cbNochesCobro = it => cbPorNoche(it) ? (+cbNoches(it.ida, it.vuelta) || 1) : 1;
const cbImporte = it => {
  if (it.tipo === 'hotel' && it.tramos?.length) return cbTarImporte(it);
  const t = Number(it.tarifa) || 0, extras = it.tipo === 'hotel' ? cbHotelExtras(it).reduce((s, x) => s + x.centavos, 0) : 0;
  if (cbPorHabitacion(it)) return Math.round((cbHabitaciones(it) * t + cbPax(it).n * (Number(it.tarifa_nino) || 0)) * cbNochesCobro(it) * 100 + extras) / 100;
  if (!cbEsPax(it)) return (Number(it.cant) || 0) * t;
  const p = cbPax(it);
  return Math.round((p.a * t + p.n * (Number(it.tarifa_nino) || 0) + p.i * (it.infantes_gratis ? 0 : Number(it.tarifa_infante) || 0)) * cbNochesCobro(it) * 100 + extras) / 100;
};
const cbNochesTexto = n => `${n} noche${n === 1 ? '' : 's'}`;
// BEGIN CB_TARIFAS: funciones puras; snapshots de precios, nunca recalcular documentos guardados.
const cbTarNorm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const cbTarPlanClave = s => {
  const n = cbTarNorm(s);
  return /^(ti|todo incluido|all inclusive)$/.test(n) ? 'todo incluido' : n;
};
const cbTarBloque = t => Array.isArray(t.tarifario_bloques) ? t.tarifario_bloques[0] || {} : t.tarifario_bloques || {};
// El extractor del tarifario a veces pierde la etiqueta "PLAN TODO INCLUIDO" del
// encabezado del hotel pero sí guarda el recuadro de "incluye": de ahí se deduce el
// régimen, solo cuando la propia tarifa declara comidas. Sin eso el asesor veía
// "Plan no indicado en el tarifario" en hoteles que sí lo tienen (Costa Caribe, 2026-10-20).
const cbPlanDeBloque = b => {
  const txt = cbTarNorm([...(b.incluye || []), ...(b.otras || [])].join(' | '));
  if (!txt) return '';
  if (/\btodo incluido\b|\ball inclusive\b/.test(txt)) return 'TODO INCLUIDO';
  const limpio = txt.replace(/regimen opcional[^.|]*/g, ' ').replace(/\bno incluye\b[^.|]*/g, ' ');
  const lista = (limpio.match(/\bincluye[n]?\b\s*:?\s*([^.|]{0,220})/) || [])[1] || '';
  const desayuno = /desayuno/.test(lista), almuerzo = /almuerzo/.test(lista), cena = /cena/.test(lista);
  const bebidas = /bebidas?[^,]{0,60}(alcohol|nacional|ilimitad)/.test(lista);
  if (almuerzo && cena && bebidas) return 'TODO INCLUIDO';
  if (almuerzo && cena) return 'FULL PENSIÓN';
  if (desayuno && (almuerzo || cena)) return 'MEDIA PENSIÓN';
  if (desayuno) return 'SOLO DESAYUNO';
  return '';
};
const cbTarPlan = t => String(t.plan || cbTarBloque(t).plan || cbPlanDeBloque(cbTarBloque(t)) || '').trim();
const cbTarNum = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null;
// Paquete cerrado (2026-11-06): la fila trae `N_noches` (Campamento Morichal: boleto, traslados y 4 noches) y se cobra por persona por el paquete completo.
const cbTarPaqueteNoches = t => Number((Object.entries(t?.precios || {}).find(([k, v]) => /^\d+_noches$/.test(k) && cbTarNum(v) !== null) || ['0'])[0].split('_')[0]);
const cbTarCent = v => Math.round((Number(v) || 0) * 100);
const cbTotalItems = items => items.reduce((s, it) => s + cbTarCent(cbImporte(it)), 0) / 100;
// Opciones para elegir (2026-11-11, pedido del dueño): el cliente compara hoteles en un mismo PDF sin que se sumen.
// Un servicio con `opcion` > 0 pertenece a esa opción; sin `opcion` es común y entra en el total de cada una.
// `total` guarda el de la opción más barata (el «desde»).
const cbOpcionDe = it => Number(it?.opcion) > 0 ? Number(it.opcion) : 0;
const cbConOpciones = items => (items || []).some(it => cbOpcionDe(it));
function cbOpciones(items) {
  const comunes = items.filter(it => !cbOpcionDe(it));
  return [...new Set(items.map(cbOpcionDe).filter(Boolean))].sort((a, b) => a - b).map(n => {
    const propios = items.filter(it => cbOpcionDe(it) === n), todos = [...propios, ...comunes];
    return { n, propios, comunes, items: todos, total: cbTotalItems(todos), titulo: propios.map(cbTitulo).filter(Boolean).join(' + ') };
  });
}
const cbTotalCot = items => cbConOpciones(items) ? Math.min(...cbOpciones(items).map(o => o.total)) : cbTotalItems(items);
const cbTarFecha = s => { const ms = /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? Date.parse(s + 'T00:00:00Z') : NaN; return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === s ? ms : NaN; };
const cbTarIso = ms => new Date(ms).toISOString().slice(0, 10);
const cbTarContexto = it => [it.producto_id, cbTarPlanClave(it.plan), cbTarNorm(it.hab), it.ida, it.vuelta, cbPorHabitacion(it) ? (it.tarifa_variante || '') + (Number(it.adultos) % (cbHabitaciones(it) || 1) ? `~${it.adultos}/${cbHabitaciones(it)}` : '') : it.adultos + (cbHabitaciones(it) > 1 ? '/' + cbHabitaciones(it) : ''), it.unidad].join('|');
function cbTarNoches(a, b) {
  const inicio = cbTarFecha(a), fin = cbTarFecha(b), n = (fin - inicio) / 864e5;
  return Number.isInteger(n) && n > 0 && n <= 366 ? Array.from({ length: n }, (_, i) => cbTarIso(inicio + i * 864e5)) : [];
}
function cbTarUtil(t, hoy) {
  return t.vigente !== false && !t.necesita_revision && (!t.venta_desde || t.venta_desde <= hoy)
    && (t._preventa_viva || !(t.venta_hasta || t.fecha_venta_fin) || (t.venta_hasta || t.fecha_venta_fin) >= hoy) && (!t.fecha_fin || t.fecha_fin >= hoy);
}
// Regla del dueño (2026-11-11), espejo de preventa_sin_reemplazo en SQL: una preventa con la venta
// cerrada se sigue cotizando hasta que exista otra tarifa del producto con venta abierta que cubra sus fechas.
const cbEsPreventa = t => /preventa/i.test(`${t.titulo || ''} ${t.vigencia_texto || ''}`);
const cbTarVentanas = t => Array.isArray(t.ventanas) && t.ventanas.length ? t.ventanas.map(v => [v.desde || null, v.hasta || null]) : [[t.disfrute_desde || null, t.fecha_fin || null]];
const cbTarSeCruzan = (a, b) => cbTarVentanas(a).some(([d1, h1]) => cbTarVentanas(b).some(([d2, h2]) => (!d1 || !h2 || h2 >= d1) && (!h1 || !d2 || d2 <= h1)));
function cbMarcarPreventas(filas, hoy = cbHoy()) {
  const venta = t => t.fecha_venta_fin || t.venta_hasta || '9999-12-31';
  for (const t of filas) t._preventa_viva = cbEsPreventa(t) && !filas.some(x => x !== t && x.vigente !== false
    && venta(x) >= hoy && (!x.fecha_fin || x.fecha_fin >= hoy) && (!cbEsPreventa(x) || venta(x) > venta(t)) && cbTarSeCruzan(t, x));
  return filas;
}
function cbTarOpciones(filas, campo) {
  const grupos = new Map(), clave = campo === 'plan' ? cbTarPlanClave : cbTarNorm;
  for (const t of [...filas].sort((a, b) => (a.orden_pdf ?? 1e9) - (b.orden_pdf ?? 1e9) || a.id - b.id)) {
    const texto = campo === 'plan' ? cbTarPlan(t) : String(t.habitacion || '').trim(), k = clave(texto);
    if (!k) continue;
    const g = grupos.get(k); if (g) g.n++; else grupos.set(k, { texto, n: 1 });
  }
  return [...grupos.values()].sort((a, b) => campo === 'plan' ? b.n - a.n : 0).map(g => g.texto);
}
const cbTarDelPlan = (filas, plan) => filas.some(t => cbTarPlan(t)) ? filas.filter(t => cbTarPlanClave(cbTarPlan(t)) === cbTarPlanClave(plan)) : filas;
function cbTarAmplitud(t, noche) {
  const ws = Array.isArray(t.ventanas) && t.ventanas.some(w => w.desde || w.hasta) ? t.ventanas : [{ desde: t.disfrute_desde, hasta: t.fecha_fin }];
  const ns = cbTarFecha(noche), hits = ws.map(w => [w.desde ? cbTarFecha(w.desde) : -Infinity, w.hasta ? cbTarFecha(w.hasta) : Infinity])
    .filter(([a, b]) => ns >= a && ns <= b).map(([a, b]) => b - a);
  return hits.length ? Math.min(...hits) : null;
}
function cbTarPrecioAdulto(t, adultos, ocupaciones) {
  const p = t.precios || {}, claves = [...ocupaciones].filter(([, n]) => n === Number(adultos)).map(([k]) => k);
  const valores = claves.map(k => cbTarNum(p[k])).filter(v => v !== null);
  if (!valores.length || valores.some(v => v !== valores[0])) return null;
  return valores[0];
}
// Unidad de precio de una tarifa (2026-10-26). Una sola regla para tarjeta, cotización, web y bot:
// manda la fila (`precios.base`), luego el bloque del PDF (`base_precio`), y solo si ninguno la
// declara se deduce de la grilla: DBL > SGL = por habitación, DBL < SGL = por persona, iguales = sin
// decidir. 'persona' sin más siempre fue por persona POR NOCHE en hoteles (confirmado por el dueño).
// Espejo: pagina-web-next/lib/tarifas.ts (unidadTarifa) y supabase/functions/_shared/presupuesto.ts.
const TAR_UNIDADES = { persona: 'persona_noche', persona_noche: 'persona_noche', habitacion: 'habitacion_noche', habitacion_noche: 'habitacion_noche' };
function tarUnidad(t) {
  if (cbTarPaqueteNoches(t)) return { unidad: 'persona', origen: 'fila' };
  const fila = cbTarNorm(t?.precios?.base), bloque = cbTarNorm(cbTarBloque(t || {}).base_precio);
  if (fila) return { unidad: TAR_UNIDADES[fila] || fila, origen: 'fila' };
  if (bloque) return { unidad: TAR_UNIDADES[bloque] || bloque, origen: 'bloque' };
  const sgl = cbTarNum(t?.precios?.sgl), dbl = cbTarNum(t?.precios?.dbl);
  if (sgl === null || dbl === null || sgl === dbl) return { unidad: '', origen: null };
  return { unidad: dbl > sgl ? 'habitacion_noche' : 'persona_noche', origen: 'deducida' };
}
const TAR_UNIDAD_TEXTO = { persona_noche: 'por persona por noche', habitacion_noche: 'por habitación por noche', persona: 'por persona, paquete completo' };
const cbTarBase = t => { if (t._unidad) return t._unidad; const u = tarUnidad(t).unidad; return TAR_UNIDAD_TEXTO[u] ? u : ''; };
// Cotización (2026-10-29): 388 tarifas vigentes no declaran unidad y tarUnidad no decide (SGL = DBL o
// sin SGL); el asesor tenía que elegirla a mano y el precio no salía solo. Solo para esos huecos:
// alias sencilla/doble, PAX ADIC = por habitación, precio que sube con la ocupación = por habitación
// y baja = por persona, SGL = DBL = por habitación, todas iguales sin SGL pero con niño = por persona.
// Lo que siga sin decidir toma la unidad mayoritaria del hotel y, si no hay, por persona por noche.
function cbTarUnidadInferida(t) {
  const p = t.precios || {}, occ = new Map();
  for (const [k, v] of Object.entries(p)) {
    const n = TAR_OCUPACION.get(cbTarNorm(k)) || Number((/^pax_([1-9]\d*)$/.exec(k) || [])[1]) || 0, precio = cbTarNum(v);
    if (n && precio !== null && !occ.has(n)) occ.set(n, precio);
  }
  if (occ.has(1) && occ.has(2) && occ.get(1) !== occ.get(2)) return occ.get(2) > occ.get(1) ? 'habitacion_noche' : 'persona_noche';
  if (Object.entries(p).some(([k, v]) => /^(pax_adic(ional)?|extra_pax|adic_adt)$/.test(cbTarNorm(k)) && cbTarNum(v) !== null)) return 'habitacion_noche';
  const serie = [...occ].sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const sube = serie.some((v, i) => i && v > serie[i - 1]), baja = serie.some((v, i) => i && v < serie[i - 1]);
  if (sube !== baja) return sube ? 'habitacion_noche' : 'persona_noche';
  if (serie.length && !sube && occ.has(1)) return 'habitacion_noche';
  if (serie.length && Object.keys(p).some(k => /chd|nino/.test(cbTarNorm(k)))) return 'persona_noche';
  return '';
}
function cbTarAnotarUnidades(filas) {
  for (const t of filas) { const u = tarUnidad(t).unidad; t._unidad = TAR_UNIDAD_TEXTO[u] ? u : cbTarUnidadInferida(t); }
  const votos = filas.reduce((m, t) => (t._unidad && m.set(t._unidad, (m.get(t._unidad) || 0) + 1), m), new Map());
  const mayoria = [...votos].sort((a, b) => b[1] - a[1])[0]?.[0] || 'persona_noche';
  for (const t of filas) if (!t._unidad) t._unidad = mayoria;
  return filas;
}
function cbTarVariantes(t, ocupaciones) {
  const nombres = { 1: 'Sencilla', 2: 'Doble', 3: 'Triple', 4: 'Cuádruple', 5: 'Quíntuple', 6: 'Séxtuple', 7: 'Séptuple', 8: 'Óctuple' };
  return Object.entries(t.precios || {}).filter(([k, v]) => (ocupaciones.has(k) || /^pax_[1-9]\d*$/.test(k)) && cbTarNum(v) !== null)
    .map(([clave, precio]) => ({ clave, precio: Number(precio), nombre: nombres[ocupaciones.get(clave)] || clave.replace(/^pax_(\d+)$/, '$1 personas') }));
}
function cbTarPrecioHabitacion(t, variante, ocupaciones) {
  const opciones = cbTarVariantes(t, ocupaciones);
  if (variante) return opciones.find(o => o.clave === variante)?.precio ?? null;
  return opciones.length && opciones.every(o => o.precio === opciones[0].precio) ? opciones[0].precio : null;
}
const cbTarCupo = clave => TAR_OCUPACION.get(clave) || Number((/^pax_(\d+)$/.exec(clave || '') || [])[1]) || 0;
function cbVarianteAuto(filas, adultos) {
  const vs = [...new Map(filas.flatMap(t => cbTarVariantes(t, TAR_OCUPACION)).map(o => [o.clave, cbTarCupo(o.clave)])).entries()].filter(([, n]) => n > 0).sort((a, b) => a[1] - b[1]);
  return (vs.find(([, n]) => n === adultos) || (vs.length && adultos > vs.at(-1)[1] ? vs.at(-1) : null))?.[0] || '';
}
// Reparto de la ocupación entre habitaciones (2026-11-11, dueño): lo más parejo posible, las primeras
// con un adulto más (5 en 2 = 3 + 2). Cada niño va a la habitación con menos personas (5 + 1 niño en 2 =
// 3 y 2 + 1, pedido del dueño 2026-11-11). Cada grupo de habitaciones con la misma cantidad de adultos
// se cobra por su ocupación (triple + doble); los niños no cambian el grupo.
function cbReparto(it) {
  const h = Math.max(1, cbHabitaciones(it)), a = Math.max(0, Number(it.adultos) || 0), n = Math.max(0, Number(it.ninos) || 0);
  const r = Array.from({ length: h }, (_, i) => ({ adultos: Math.floor(a / h) + (i < a % h ? 1 : 0), ninos: 0 }));
  for (let k = 0; k < n; k++) r.reduce((m, x) => x.adultos + x.ninos < m.adultos + m.ninos ? x : m).ninos++;
  return r;
}
const cbRepartoGrupos = it => [...cbReparto(it).reduce((m, r) => m.set(r.adultos, (m.get(r.adultos) || 0) + 1), new Map())].map(([adultos, habs]) => ({ adultos, habs }));
const cbRepartoTexto = it => cbHabitaciones(it) > 1 ? cbReparto(it).map((r, i) => `Hab. ${i + 1}: ${r.adultos} adulto${r.adultos === 1 ? '' : 's'}${r.ninos ? ` + ${r.ninos} niño${r.ninos === 1 ? '' : 's'}` : ''}`).join(' · ') : '';
function cbHotelUnidad(it, filas) {
  const candidatas = cbTarDelPlan(filas, it.plan).filter(t => !it.hab || cbTarNorm(t.habitacion) === cbTarNorm(it.hab));
  const noches = cbTarNoches(it.ida, it.vuelta);
  const aplican = candidatas.filter(t => !noches.length || noches.some(n => cbTarAmplitud(t, n) !== null));
  // Varias unidades entre temporadas de la misma habitación: manda la mayoritaria, sin preguntar.
  const votos = aplican.map(cbTarBase).filter(Boolean).reduce((m, u) => m.set(u, (m.get(u) || 0) + 1), new Map());
  const base = [...votos].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  it._unidadOrigen = base ? 'tarifario' : '';
  it._unidadPendiente = !it.unidad_manual && !base;
  if (!it.unidad_manual && base && it.unidad !== base) {
    it.unidad = base; it.tarifa = ''; it.tramos = []; it.tarifa_manual = false; delete it.tarifa_variante;
  }
  // Más adultos de los que admite la habitación (5 en una STANDART de Margarita Village, que llega a
  // cuádruple): sube «Habitaciones» a lo justo, ceil(adultos / máximo), y la baja de nuevo hasta lo que
  // había puesto el asesor si después quita adultos (pedido del dueño 2026-11-11). Con PAX ADIC en el
  // tarifario la habitación sí admite más adultos y no se toca.
  const maxHab = it.hab ? Math.max(0, ...aplican.flatMap(t => cbTarVariantes(t, TAR_OCUPACION).map(o => cbTarCupo(o.clave)))) : 0;
  it._maxHab = maxHab;
  if (cbPorNoche(it) && maxHab && !(cbPorHabitacion(it) && aplican.some(t => cbTarNum(t.precios?.pax_adic) !== null))) {
    const adultos = Number(it.adultos) || 0, actual = cbHabitaciones(it), justas = Math.ceil(adultos / maxHab);
    if (adultos > maxHab * actual) { if (!it.habitaciones_auto) it.habitaciones_antes = actual || 1; it.habitaciones = justas; it.habitaciones_auto = true; }
    else if (it.habitaciones_auto) {
      it.habitaciones = Math.max(Number(it.habitaciones_antes) || 1, justas);
      if (it.habitaciones === (Number(it.habitaciones_antes) || 1)) { it.habitaciones_auto = false; delete it.habitaciones_antes; }
    }
  }
  // Por habitación, la variante sale sola de los adultos por habitación (2 → doble); si nadie la
  // eligió a mano se vuelve a calcular al cambiar la ocupación. Más adultos que la mayor = la mayor + PAX ADIC.
  if (cbPorHabitacion(it) && it.hab && (!it.tarifa_variante || it.variante_auto)) {
    const v = cbVarianteAuto(aplican, cbRepartoGrupos(it)[0]?.adultos || 1);
    if (v) { it.tarifa_variante = v; it.variante_auto = true; } else if (it.variante_auto) { it.tarifa_variante = ''; }
  }
  // Paquete cerrado: la salida fija el regreso.
  const nPaquete = it.unidad === 'persona' ? Math.max(0, ...candidatas.map(cbTarPaqueteNoches)) : 0;
  if (nPaquete && Number.isFinite(cbTarFecha(it.ida))) it.vuelta = cbTarIso(cbTarFecha(it.ida) + nPaquete * 864e5);
}
function cbTarPrecioNino(t, cantidad) {
  const opciones = Object.entries(t.precios || {}).flatMap(([k, v]) => {
    const m = /^(?:(\d+)(?:er|do|to)_)?(?:chd|ninos?)(?:_\d{1,2}(?:_\d{1,2})?(?:_anos)?)?$/.exec(cbTarNorm(k));
    const precio = /^(gratis|incluido|free)$/.test(cbTarNorm(v)) ? 0 : cbTarNum(v);
    return m && precio !== null ? [{ clave: k, ordinal: Number(m[1]) || 0, precio }] : [];
  });
  const aplican = opciones.filter(o => !o.ordinal || o.ordinal <= cantidad);
  const ordinales = opciones.filter(o => o.ordinal);
  if (!aplican.length || (ordinales.length && cantidad > Math.max(...ordinales.map(o => o.ordinal)))
    || aplican.some(o => o.precio !== aplican[0].precio)) return { precio: null, etiquetas: [] };
  return { precio: aplican[0].precio, etiquetas: aplican.map(o => o.clave.replace(/(\d)_(\d)/g, '$1-$2').replace(/_/g, ' ').toUpperCase()) };
}
const cbTarNinoTramo = (it, t) => cbTarNum(it.tarifa_nino_auto === false ? it.tarifa_nino : (t.tarifa_nino ?? it.tarifa_nino));
function cbTarPascua(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30;
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - c % 4) % 7, n = h + l - 7 * Math.floor((a + 11 * h + 22 * l) / 451) + 114;
  return Date.UTC(y, Math.floor(n / 31) - 1, n % 31 + 1);
}
function cbTarFestivos(iso) {
  const md = iso.slice(5), dias = Math.round((cbTarFecha(iso) - cbTarPascua(+iso.slice(0, 4))) / 864e5);
  return [md >= '12-21' && md <= '12-27' && 'navidad', (md >= '12-28' || md <= '01-06') && 'fin de ano', dias >= -7 && dias <= 0 && 'semana santa', dias >= -51 && dias <= -46 && 'carnaval'].filter(Boolean);
}
const cbTarMarcas = s => [...new Set(cbTarNorm(s).match(/navidad|fin de ano|semana santa|carnaval|super ?alta|\b(?:alta|media|baja|verano)\b/g) || [])].map(m => m.replace('superalta', 'super alta'));
const cbTarMarcaGeneral = m => !/navidad|fin de ano|semana santa|carnaval/.test(m);
// minimo_noches del bloque sale de la nota al pie del PDF: cada clave nombra una temporada o una habitación, nunca la tabla entera.
function cbTarMinimoBloque(t, noches) {
  const bloque = cbTarBloque(t).minimo_noches, r = { exigidos: [], dudosos: [], ambiguo: false };
  if (typeof bloque === 'number') { r.exigidos.push(bloque); return r; }
  const hab = cbTarNorm(t.habitacion), delTitulo = cbTarMarcas(t.titulo), festivos = noches.flatMap(cbTarFestivos);
  for (const [clave, valor] of Object.entries(bloque && typeof bloque === 'object' ? bloque : {})) {
    const v = Number(valor), k = cbTarNorm(clave).split(/\bconsultar\b/)[0];
    if (!(v > 0)) continue;
    const rangos = [...k.matchAll(/(\d{2})\/(\d{2})\/(\d{4}) al (\d{2})\/(\d{2})\/(\d{4})/g)], marcas = cbTarMarcas(k);
    const aplica = cbTarNorm(clave) === hab || (rangos.length ? noches.some(n => rangos.some(m => n >= `${m[3]}-${m[2]}-${m[1]}` && n <= `${m[6]}-${m[5]}-${m[4]}`)) : marcas.some(m => festivos.includes(m) || delTitulo.includes(m)));
    if (aplica) { r.exigidos.push(v); r.ambiguo ||= /\d+ noches?\b/.test(k); }
    else if (!rangos.length && (!marcas.length || (marcas.some(cbTarMarcaGeneral) && !delTitulo.some(cbTarMarcaGeneral)))) r.dudosos.push([clave, v]);
  }
  return r;
}
// «No hay tarifa» a secas no le dice al asesor qué falta ni cómo seguir (Margarita Village,
// 28/12 al 01/01: la fila de fin de año estaba retirada y el mensaje no lo decía). Nombra las
// noches sin precio, por qué la fila que existe no sirve y qué otra habitación sí las cubre.
function cbTarSinTarifaTexto(it, filas, candidatas, noches, hoy) {
  const dm = n => `${n.slice(8)}/${n.slice(5, 7)}`, cubre = (ts, n) => ts.some(t => cbTarAmplitud(t, n) !== null);
  const faltan = noches.filter(n => !cubre(candidatas, n));
  const rangos = faltan.reduce((r, n) => { const u = r.at(-1); if (u && cbTarFecha(n) - cbTarFecha(u[1]) === 864e5) u[1] = n; else r.push([n, n]); return r; }, [])
    .map(([a, b]) => a === b ? dm(a) : `${dm(a)} al ${dm(b)}`).join(', ');
  const hab = `${it.hab}${it.plan ? ` · ${it.plan}` : ''}`;
  const trabadas = cbTarDelPlan(filas, it.plan).filter(t => cbTarNorm(t.habitacion) === cbTarNorm(it.hab) && !cbTarUtil(t, hoy) && faltan.some(n => cbTarAmplitud(t, n) !== null));
  const motivo = trabadas.map(t => t.necesita_revision ? `«${t.titulo || 'tarifa'}» está marcada para revisión en el Tarifario`
    : (t.venta_hasta || t.fecha_venta_fin) < hoy ? `la venta de «${t.titulo || 'tarifa'}» cerró el ${dm(t.venta_hasta || t.fecha_venta_fin)}`
    : t.venta_desde > hoy ? `«${t.titulo || 'tarifa'}» se vende recién desde el ${dm(t.venta_desde)}` : '').filter(Boolean);
  const otras = [...new Set(cbTarDelPlan(filas.filter(t => cbTarUtil(t, hoy)), it.plan).filter(t => cbTarNorm(t.habitacion) !== cbTarNorm(it.hab)).map(t => t.habitacion))]
    .filter(h => faltan.every(n => cubre(cbTarDelPlan(filas, it.plan).filter(t => cbTarUtil(t, hoy) && t.habitacion === h), n)));
  return [`Sin tarifa de ${hab} para ${faltan.length === 1 ? 'la noche del' : 'las noches del'} ${rangos}.`,
    motivo.length ? `Motivo: ${motivo.join('; ')}.` : 'El tarifario cargado no cubre esas fechas.',
    otras.length ? `Sí hay precio para: ${otras.join(', ')}.` : '',
    'Cómo seguir: carga o reactiva esa temporada en el Tarifario, o escribe la tarifa manual.'].filter(Boolean).join(' ');
}
// «Ocupación sin precio único» no explicaba nada (5 adultos en 1 STANDART de Margarita Village,
// que se vende hasta cuádruple). Dice el máximo por habitación y cuántas habitaciones poner.
function cbTarOcupacionTexto(it, precisas, precios, noche, adultosHab, ocupaciones) {
  const dm = n => `${n.slice(8)}/${n.slice(5, 7)}`, nombres = { 1: 'sencilla', 2: 'doble', 3: 'triple', 4: 'cuádruple', 5: 'quíntuple', 6: 'séxtuple' };
  const max = Math.max(0, ...precisas.flatMap(x => cbTarVariantes(x.t, ocupaciones).map(o => ocupaciones.get(o.clave) || Number(o.clave.replace(/^pax_/, '')) || 0)));
  if (precios.some(p => p === null) && max && adultosHab > max) {
    const habs = Math.ceil(Number(it.adultos) / max);
    return `${it.hab} se vende hasta ${max} adultos por habitación (${nombres[max] || max}) y aquí hay ${adultosHab}. Sube «Habitaciones» a ${habs} o escribe la tarifa manual.`;
  }
  if (precios.some(p => p === null)) return `El tarifario no trae precio de ${it.hab} para ${adultosHab} adulto${adultosHab === 1 ? '' : 's'} por habitación la noche del ${dm(noche)}. Cambia la ocupación o escribe la tarifa manual.`;
  return `Hay ${precisas.length} tarifas de ${it.hab} con precios distintos para la noche del ${dm(noche)} (${precisas.map(x => `«${x.t.titulo || x.t.id}»`).join(', ')}). Confirma cuál aplica y escribe la tarifa manual.`;
}
// El PDF parte una misma temporada por día de la semana («DOMINGO A JUEVES» / «VIERNES A SABADO»,
// Hesperia, H2otel, Malibu) o por largo de estadía («(1) NOCHE» / «Mínimo (2) NOCHES», Trucha Azul):
// salían como tarifas duplicadas y el asesor tenía que escribir el precio a mano.
const CB_TAR_DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const cbTarTextoFila = t => cbTarNorm([...(t.condiciones || []), t.vigencia_texto, t.habitacion].filter(Boolean).join(' / '));
function cbTarDiasDe(t) {
  const d = '(domingo|lunes|martes|miercoles|jueves|viernes|sabado)s?', m = cbTarTextoFila(t).match(new RegExp(`\\b${d}\\s+(?:a|al|hasta)\\s+${d}\\b`));
  if (!m) return null;
  const a = CB_TAR_DIAS.indexOf(m[1]), b = CB_TAR_DIAS.indexOf(m[2]);
  return { inicio: a, dias: Array.from({ length: (b - a + 7) % 7 + 1 }, (_, k) => (a + k) % 7) };
}
function cbTarEstadiaDe(t) {
  const txt = cbTarTextoFila(t), min = txt.match(/\bminimo\s*\(?(\d+)\)?\s*noches?\b/);
  if (min) return { min: +min[1] };
  const exacta = txt.match(/(?:^|\/)\s*\(?(\d+)\)?\s*noches?\b/);
  return exacta ? { exacta: +exacta[1] } : null;
}
function cbTarDesempatar(precisas, noche, totalNoches) {
  if (precisas.length < 2) return precisas;
  const angostar = (xs, ok) => { const r = xs.filter(ok); return r.length ? r : xs; };
  const dow = new Date(cbTarFecha(noche)).getUTCDay();
  let r = angostar(precisas, x => { const d = cbTarDiasDe(x.t); return !d || d.dias.includes(dow); });
  // «JUEVES A DOMINGO» + «DOMINGO A MIERCOLES»: la noche del domingo es del rango que empieza ese día.
  if (r.filter(x => cbTarDiasDe(x.t)).length > 1) r = angostar(r, x => cbTarDiasDe(x.t)?.inicio === dow);
  r = angostar(r, x => { const e = cbTarEstadiaDe(x.t); return !e || (e.min ? totalNoches >= e.min : totalNoches === e.exacta); });
  return r;
}
function cbTarSugerir(it, filas, hoy, ocupaciones) {
  const noches = cbTarNoches(it.ida, it.vuelta), fallo = texto => ({ ok: false, texto });
  if (!noches.length) return fallo(it.ida && it.vuelta ? 'Las fechas deben sumar de 1 a 366 noches.' : 'Elige el check-in y las noches: la tarifa sale sola.');
  if (!cbPorNoche(it) && !(it.unidad === 'persona' && filas.some(cbTarPaqueteNoches))) return fallo('La estadía completa se cotiza manualmente.');
  if (it._unidadPendiente) return fallo('El tarifario no declara una unidad única. Confirma «Tarifa por» antes de cargar el precio.');
  if (!it.hab) return fallo('Elige una habitación del tarifario o escribe una tarifa manual.');
  const porHab = cbPorHabitacion(it), habitaciones = cbHabitaciones(it), grupos = cbRepartoGrupos(it);
  if (!Number.isInteger(habitaciones) || habitaciones < 1) return fallo('Indica cuántas habitaciones lleva el servicio.');
  if (Number(it.adultos) < habitaciones) return fallo(`${cbHabitacionesTexto(it)} para ${it.adultos} adulto${Number(it.adultos) === 1 ? '' : 's'}: cada habitación necesita al menos un adulto. Baja «Habitaciones» o escribe la tarifa manual.`);
  const utilizables = filas.filter(t => cbTarUtil(t, hoy));
  const candidatas = cbTarDelPlan(utilizables, it.plan).filter(t => cbTarNorm(t.habitacion) === cbTarNorm(it.hab));
  if (!cbPorNoche(it)) return cbTarPaquete(it, candidatas, noches, ocupaciones);
  const tramos = [], usadas = [], avisos = new Set();
  // Precio de una noche para toda la ocupación. También se usa con la fecha del check-out para el late check-out.
  const precioNoche = (noche, avisos) => {
    const cubren = candidatas.map(t => ({ t, amplitud: cbTarAmplitud(t, noche) })).filter(x => x.amplitud !== null);
    if (!cubren.length) return { sin: true };
    const menor = Math.min(...cubren.map(x => x.amplitud));
    const precisas = cbTarDesempatar(cubren.filter(x => x.amplitud === menor), noche, noches.length);
    if (precisas.some(x => cbTarBase(x.t) && cbTarBase(x.t) !== it.unidad)) return { texto: 'La unidad elegida no corresponde a esta tarifa. Ingresa y confirma un precio manual.' };
    // Por habitación: con reparto desigual y variante automática, cada grupo lleva su variante (triple + doble).
    const variantes = porHab ? grupos.map(g => grupos.length > 1 && (it.variante_auto || !it.tarifa_variante) ? cbVarianteAuto(precisas.map(x => x.t), g.adultos) : it.tarifa_variante) : [];
    const ps = grupos.map((g, k) => precisas.map(x => porHab ? cbTarPrecioHabitacion(x.t, variantes[k], ocupaciones) : cbTarPrecioAdulto(x.t, g.adultos, ocupaciones)));
    const malo = ps.findIndex(p => p.some(v => v === null) || p.some(v => v !== p[0]));
    if (malo >= 0) {
      if (!porHab) return { texto: cbTarOcupacionTexto(it, precisas, ps[malo], noche, grupos[malo].adultos, ocupaciones) };
      return { texto: grupos.length > 1 && variantes.some(v => v !== variantes[0]) ? `No hay precio de ${it.hab} para ${grupos[malo].adultos} adulto${grupos[malo].adultos === 1 ? '' : 's'} por habitación (${cbRepartoTexto(it)}). Elige la variante a mano, cambia el reparto o escribe la tarifa manual.` : 'Elige la variante de habitación (sencilla, doble…) para cargar el precio.' };
    }
    const tarifa = ps[0][0];
    const repartidos = (porHab ? variantes.some(v => v !== variantes[0]) : ps.some(p => p[0] !== tarifa)) ? grupos.map((g, k) => ({ ...g, ...(porHab ? { variante: variantes[k] } : {}), tarifa: ps[k][0] })) : null;
    precisas.sort((a, b) => (a.t.orden_pdf ?? 1e9) - (b.t.orden_pdf ?? 1e9) || a.t.id - b.t.id);
    const t = precisas[0].t;
    let tarifaNino = null, paxAdic = 0, tarifaPaxAdic = null;
    if (Number(it.ninos) > 0) {
      const infantiles = precisas.map(x => cbTarPrecioNino(x.t, Number(it.ninos)));
      if (infantiles.every(p => p.precio !== null && p.precio === infantiles[0].precio)) {
        tarifaNino = infantiles[0].precio;
        infantiles.flatMap(p => p.etiquetas).forEach(e => avisos.add(`Tarifa infantil: ${e}${porHab ? ', por niño por noche, aparte de la habitación' : ''}. Confirma las edades indicadas en la ficha.`));
      } else avisos.add(porHab ? 'Niños sin precio en el tarifario para esta habitación: confirma con el hotel si pagan aparte.' : 'Tarifa de niños sin precio único para estas fechas: confirma la edad, la cantidad y el precio en la ficha.');
    }
    // Por habitación, los adultos que no caben en la variante pagan el PAX ADIC del PDF.
    if (porHab) {
      paxAdic = grupos.reduce((s, g, k) => { const cupo = cbTarCupo(variantes[k]); return s + (cupo ? Math.max(0, g.adultos - cupo) * g.habs : 0); }, 0);
      if (paxAdic) {
        const adic = precisas.map(x => cbTarNum(x.t.precios?.pax_adic));
        if (adic.some(p => p === null || p !== adic[0])) return { texto: `${paxAdic} adulto${paxAdic === 1 ? '' : 's'} más de lo que admite${habitaciones === 1 ? ' la habitación' : 'n las habitaciones'}: elige otra variante, más habitaciones o confirma el precio manual.` };
        tarifaPaxAdic = adic[0];
      }
    }
    return { t, precisas, precio: { tarifa, tarifa_nino: tarifaNino, ...(repartidos ? { grupos: repartidos } : {}), ...(paxAdic ? { pax_adic: paxAdic, tarifa_pax_adic: tarifaPaxAdic } : {}) } };
  };
  for (const noche of noches) {
    const r = precioNoche(noche, avisos);
    if (r.sin) return fallo(cbTarSinTarifaTexto(it, filas, candidatas, noches, hoy));
    if (r.texto) return fallo(r.texto);
    usadas.push(...r.precisas.map(x => x.t));
    const ultimo = tramos.at(-1), siguiente = cbTarIso(cbTarFecha(noche) + 864e5);
    if (ultimo?.tarifa_id === r.t.id) { ultimo.hasta = siguiente; ultimo.noches++; }
    else tramos.push({ desde: noche, hasta: siguiente, noches: 1, ...r.precio, tarifa_id: r.t.id, fuente_archivo: r.t.fuente_archivo || null });
  }
  // Late check-out (2026-11-11, dueño): 50% de la tarifa vigente el día de salida. Si ninguna la cubre,
  // queda null y se cobra sobre la última noche (cbHotelExtras lo dice en el texto).
  const rs = precioNoche(it.vuelta, new Set());
  const salida = rs.precio ? { desde: it.vuelta, hasta: cbTarIso(cbTarFecha(it.vuelta) + 864e5), noches: 1, ...rs.precio, tarifa_id: rs.t.id, fuente_archivo: rs.t.fuente_archivo || null } : null;
  if (it.habitaciones_auto && it._maxHab) avisos.add(`${it.hab} admite hasta ${it._maxHab} adultos por habitación: «Habitaciones» subió sola a ${habitaciones}.`);
  for (const t of usadas) {
    const b = cbTarBloque(t), m = Number(t.minimo_noches) ? { exigidos: [Number(t.minimo_noches)], dudosos: [], ambiguo: false } : cbTarMinimoBloque(t, noches), min = Math.max(0, ...m.exigidos);
    if (min > noches.length && (m.ambiguo || new Set(m.exigidos).size > 1)) return fallo('El mínimo de noches requiere confirmación manual para esta temporada.');
    if (min > noches.length) return fallo(`El hotel exige mínimo ${min} noches. Confirma una excepción y tarifa manual.`);
    for (const [clave, v] of m.dudosos) if (v > noches.length) avisos.add(`El tarifario pide mínimo ${v} noches en «${clave.slice(0, 80)}»: confirma si aplica a estas fechas.`);
    for (const c of t.condiciones || []) if (typeof c === 'string') avisos.add(c);
    for (const s of b.suplementos || []) if (s.obligatorio) avisos.add('Suplemento obligatorio pendiente: ' + (s.texto || s.temporada || 'confirmar en la ficha'));
    if (b.impuestos?.igtf_pct) avisos.add(`IGTF ${b.impuestos.igtf_pct}% pendiente según forma de pago.`);
  }
  if (/on request/i.test(it.hab)) avisos.add('Habitación sujeta a confirmación del hotel.');
  if (!it.plan) avisos.add('Plan sin especificar en el tarifario: completa o confirma antes de entregar.');
  else if (!utilizables.some(t => cbTarPlan(t))) avisos.add('El tarifario no especifica el plan: confirma que el plan ingresado corresponda a esta tarifa.');
  return { ok: true, tramos, salida, avisos: [...avisos] };
}
// Un solo tramo con todas las noches del paquete; `por_pareja` es el total de 2 adultos en la misma habitación.
function cbTarPaquete(it, candidatas, noches, ocupaciones) {
  const fallo = texto => ({ ok: false, texto }), adultosHab = Number(it.adultos) / cbHabitaciones(it);
  const t = candidatas.filter(cbTarPaqueteNoches).map(t => ({ t, amplitud: cbTarAmplitud(t, noches[0]) })).filter(x => x.amplitud !== null)
    .sort((a, b) => a.amplitud - b.amplitud || (a.t.orden_pdf ?? 1e9) - (b.t.orden_pdf ?? 1e9) || a.t.id - b.t.id)[0]?.t;
  if (!t) return fallo('No hay tarifa del paquete para esa fecha de salida. Ingresa el precio manualmente.');
  const n = cbTarPaqueteNoches(t);
  if (noches.length !== n) return fallo(`El paquete es de ${n + 1} días / ${cbNochesTexto(n)}: ajusta el check-out.`);
  const pareja = adultosHab === 2 ? cbTarNum(t.precios.por_pareja) : null;
  const tarifa = cbTarPrecioAdulto(t, adultosHab, ocupaciones) ?? (pareja !== null ? pareja / 2 : cbTarNum(t.precios[`${n}_noches`]));
  const avisos = new Set([`Paquete completo de ${n + 1} días / ${cbNochesTexto(n)}: precio por persona${pareja !== null ? ' en pareja' : ''}, no por noche.`]);
  let tarifaNino = null;
  if (Number(it.ninos) > 0) { tarifaNino = cbTarPrecioNino(t, Number(it.ninos)).precio; if (tarifaNino === null) avisos.add('Niños sin precio en el paquete: confirma su tarifa en la ficha.'); }
  for (const c of t.condiciones || []) if (typeof c === 'string') avisos.add(c);
  return { ok: true, tramos: [{ desde: noches[0], hasta: cbTarIso(cbTarFecha(noches.at(-1)) + 864e5), noches: n, tarifa, tarifa_nino: tarifaNino, paquete: true, incluye: t.incluye_tags || [], tarifa_id: t.id, fuente_archivo: t.fuente_archivo || null }], avisos: [...avisos] };
}
// Una noche de un tramo para toda la ocupación, en centavos. Con `grupos` (reparto desigual con
// precios distintos) cada grupo de habitaciones paga su ocupación.
function cbTarCostoNoche(it, t) {
  const a = Number(it.adultos) || 0, n = Number(it.ninos) || 0, gs = Array.isArray(t.grupos) && t.grupos.length ? t.grupos : null;
  if (cbPorHabitacion(it)) return (gs ? gs.reduce((s, g) => s + cbTarCent(g.tarifa) * g.habs, 0) : cbTarCent(t.tarifa) * cbHabitaciones(it)) + cbTarCent(t.tarifa_pax_adic) * (Number(t.pax_adic) || 0) + cbTarCent(cbTarNinoTramo(it, t)) * n;
  return Math.round(((gs ? gs.reduce((s, g) => s + g.adultos * g.habs * Number(g.tarifa || 0), 0) : a * Number(t.tarifa || 0)) + n * (cbTarNinoTramo(it, t) || 0)) * 100);
}
function cbTarImporte(it) {
  return ((it.tramos || []).reduce((s, t) => s + cbTarCostoNoche(it, t) * (t.paquete ? 1 : t.noches), 0) + cbHotelExtras(it).reduce((s, x) => s + x.centavos, 0)) / 100;
}
// Early check-in y late check-out (2026-11-11, dueño): casillas separadas en el hotel. Early = 50% de
// la noche del check-in; late = 50% de la tarifa del día de salida (sin tarifa ese día, la de la
// última noche, avisado). Sobre toda la ocupación del servicio, igual que una noche.
function cbHotelExtras(it) {
  if (it.tipo !== 'hotel' || !cbPorNoche(it) || !(it.early_checkin || it.late_checkout) || it.tramos?.[0]?.paquete) return [];
  const conTramos = !!it.tramos?.length, p = cbPax(it), t = Number(it.tarifa) || 0, nino = Number(it.tarifa_nino) || 0;
  if (!conTramos && !(t > 0)) return [];
  const manual = cbPorHabitacion(it) ? Math.round((cbHabitaciones(it) * t + p.n * nino) * 100) : Math.round((p.a * t + p.n * nino + p.i * (it.infantes_gratis ? 0 : Number(it.tarifa_infante) || 0)) * 100);
  const costo = tr => conTramos ? cbTarCostoNoche(it, tr) : manual, salida = conTramos && it.tramo_salida?.desde === it.vuelta ? it.tramo_salida : null;
  const x = [];
  if (it.early_checkin) x.push({ clave: 'early', nombre: 'Early check-in', fecha: it.ida, centavos: Math.round(costo(it.tramos?.[0]) / 2), texto: `50% de la noche del ${cbFechaCorta(it.ida)}` });
  if (it.late_checkout) x.push({ clave: 'late', nombre: 'Late check-out', fecha: it.vuelta, centavos: Math.round(costo(salida || it.tramos?.at(-1)) / 2), aprox: conTramos && !salida,
    texto: conTramos && !salida ? `50% de la tarifa de la última noche: el tarifario no tiene precio para el ${cbFechaCorta(it.vuelta)}` : `50% de la tarifa del ${cbFechaCorta(it.vuelta)}` });
  return x.map(e => ({ ...e, monto: e.centavos / 100 }));
}
function cbTarTramosValidos(it) {
  if (!it.tramos?.length) return true;
  const esperadas = cbTarNoches(it.ida, it.vuelta), reales = [];
  for (const t of it.tramos) {
    const ns = cbTarNoches(t.desde, t.hasta);
    if (ns.length !== Number(t.noches) || cbTarNum(t.tarifa) === null) return false;
    reales.push(...ns);
  }
  return !!esperadas.length && esperadas.length === reales.length && esperadas.every((n, i) => reales[i] === n);
}
// END CB_TARIFAS
const CB_CANT = 'type="number" min="1" step="1"', CB_TARIFA = ['tarifa', 'Tarifa c/u (USD)', 'type="number" min="0" step="0.01"'];
const CB_TIPOS = {
  boleto: { nombre: 'Boleto aéreo', campos: [['ruta', 'Ruta', 'placeholder="CCS-LRV-CCS"'], ['aerolinea', 'Aerolínea', 'placeholder="Sasca Airlines"'], ['ida', 'Fecha de ida', 'type="date"'], ['ida_hora', 'Horario ida', 'placeholder="07:45-08:15 AM"'], ['vuelta', 'Fecha de vuelta', 'type="date"'], ['vuelta_hora', 'Horario vuelta', 'placeholder="17:15-17:45 PM"']], pax: true },
  hotel: { nombre: 'Hotel', campos: [['nombre', 'Hotel', 'placeholder="Sunsol Isla Caribe"'], ['plan', 'Plan', 'placeholder="Todo incluido"'], ['ida', 'Check-in', 'type="date"'], ['vuelta', 'Check-out', 'type="date"'], ['hab', 'Habitación', 'placeholder="Doble estándar"', ' cb-dos']], pax: true },
  // Paquete y full day (2026-10-15, cotización para asesores de ventas).
  paquete: { nombre: 'Paquete', campos: [['nombre', 'Paquete', 'placeholder="Margarita 4D/3N"'], ['plan', 'Plan', 'placeholder="Todo incluido"'], ['ida', 'Entrada', 'type="date"'], ['vuelta', 'Salida', 'type="date"']], pax: true },
  fullday: { nombre: 'Full day / Excursión', campos: [['nombre', 'Full day o excursión', 'placeholder="Full day Cayo Sombrero"'], ['ida', 'Fecha', 'type="date"']], pax: true },
  tour: { nombre: 'Tour', campos: [['nombre', 'Tour', 'placeholder="Tour Salto Ángel"'], ['ida', 'Fecha', 'type="date"']], pax: true },
  traslado: { nombre: 'Traslado', campos: [['ruta', 'Trayecto', 'placeholder="Aeropuerto PMV - Hotel"'], ['ida', 'Fecha', 'type="date"'], ['ida_hora', 'Hora', 'placeholder="10:30 AM"'], ['vuelta', 'Fecha de regreso (opcional)', 'type="date"'], ['vuelta_hora', 'Hora de regreso', 'placeholder="04:00 PM"']], pax: true },
  otro: { nombre: 'Otro servicio', campos: [['nombre', 'Descripción', 'placeholder="Seguro de viaje"'], ['ida', 'Fecha (opcional)', 'type="date"'], ['cant', 'Cantidad', CB_CANT], CB_TARIFA] },
};
const cbNoches = (a, b) => { const n = a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 864e5) : 0; return n > 0 ? String(n) : ''; };
  return { TAR_OCUPACION, cbHoy, cbTarNorm, cbTarPlan, cbTarBloque, cbTarUtil, cbMarcarPreventas, cbTarAnotarUnidades, cbHotelUnidad, cbTarSugerir, cbTarPrecioNino, cbTotalItems, cbHabitaciones };
}
