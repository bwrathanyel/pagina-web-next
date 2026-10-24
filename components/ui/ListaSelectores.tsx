"use client";

import { Fragment, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CLASE_CONTROL } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";

// Lista propia para TODOS los <select> del sitio: la del sistema (blanca con
// resaltado azul en Windows) no se puede estilar. El <select> sigue siendo el
// dueño del valor, del `name` del formulario y del onChange de React; solo se
// intercepta la apertura y al elegir se dispara un `change` nativo. En el
// teléfono sale como Hoja; en lg+ como lista bajo el campo. Un <select
// data-nativo> conserva la lista del sistema. Se monta una vez en MotionProvider.

type Opcion = { i: number; texto: string; grupo?: string; deshabilitada: boolean };
type Posicion = { left: number; top?: number; bottom?: number; ancho: number; alto: number; arriba: boolean };
type Estado = { sel: HTMLSelectElement; opciones: Opcion[]; elegida: number; titulo: string; pos: Posicion | null };

const MQ_ESCRITORIO = "(min-width: 64rem)";
const MAS_DE_N_BUSCA = 12;
const sinSuscripcion = () => () => {};
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function esRealzable(t: EventTarget | null): t is HTMLSelectElement {
  return t instanceof HTMLSelectElement && !t.multiple && t.size <= 1 && !t.disabled && !t.hasAttribute("data-nativo");
}

function leerOpciones(sel: HTMLSelectElement): Opcion[] {
  return Array.from(sel.options)
    .filter((o) => !o.hidden)
    .map((o) => {
      const grupo = o.parentElement instanceof HTMLOptGroupElement ? o.parentElement : null;
      return { i: o.index, texto: o.text, grupo: grupo?.label, deshabilitada: o.disabled || !!grupo?.disabled };
    });
}

// El <label> envuelve a veces al <select>: su textContent traería también el
// texto de todas las opciones, por eso se toman solo los nodos hermanos.
function tituloDe(sel: HTMLSelectElement) {
  const label = sel.labels?.[0];
  const deLabel = label
    ? Array.from(label.childNodes).filter((n) => !n.contains(sel)).map((n) => n.textContent ?? "").join(" ")
    : "";
  const porId = (sel.getAttribute("aria-labelledby") ?? "")
    .split(/\s+/)
    .map((id) => (id ? document.getElementById(id)?.textContent ?? "" : ""))
    .join(" ");
  const texto = deLabel || porId || sel.getAttribute("aria-label") || "";
  return texto.replace(/\s+/g, " ").replace(/[:*]\s*$/, "").trim() || "Elija una opción";
}

function posicionDe(sel: HTMLSelectElement): Posicion {
  const r = sel.getBoundingClientRect();
  const abajo = window.innerHeight - r.bottom - 16;
  const arriba = r.top - 16;
  const subir = abajo < 240 && arriba > abajo;
  return {
    left: Math.max(8, r.left),
    top: subir ? undefined : r.bottom + 6,
    bottom: subir ? window.innerHeight - r.top + 6 : undefined,
    ancho: r.width,
    alto: Math.min(320, subir ? arriba : abajo),
    arriba: subir,
  };
}

// Igual que la lista nativa: input + change, que React traduce a su onChange.
function fijarOpcion(sel: HTMLSelectElement, i: number) {
  if (sel.selectedIndex === i) return;
  sel.selectedIndex = i;
  sel.dispatchEvent(new Event("input", { bubbles: true }));
  sel.dispatchEvent(new Event("change", { bubbles: true }));
}

// scrollIntoView movería también la página, y eso cierra la lista: se desplaza
// solo la caja con scroll que la contiene (la propia o la de la Hoja).
function aLaVista(el: Element | null | undefined, centrar: boolean) {
  const caja = el?.closest<HTMLElement>(".overflow-y-auto");
  if (!el || !caja) return;
  const r = el.getBoundingClientRect();
  const c = caja.getBoundingClientRect();
  if (centrar) caja.scrollTop += r.top - c.top - (c.height - r.height) / 2;
  else if (r.top < c.top) caja.scrollTop += r.top - c.top;
  else if (r.bottom > c.bottom) caja.scrollTop += r.bottom - c.bottom;
}

export function ListaSelectores() {
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [abierta, setAbierta] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [activa, setActiva] = useState(-1);
  const popRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const toque = useRef<{ sel: HTMLSelectElement; x: number; y: number } | null>(null);
  const letras = useRef({ texto: "", t: 0 });

  const hoja = !!estado && !estado.pos;
  const buscable = !!estado && estado.opciones.length > MAS_DE_N_BUSCA;
  const visibles = estado
    ? estado.opciones.filter((o) => !filtro.trim() || normalizar(o.texto).includes(normalizar(filtro.trim())))
    : [];
  const navegables = visibles.filter((o) => !o.deshabilitada);

  function abrir(sel: HTMLSelectElement) {
    const escritorio = window.matchMedia(MQ_ESCRITORIO).matches;
    setEstado({ sel, opciones: leerOpciones(sel), elegida: sel.selectedIndex, titulo: tituloDe(sel), pos: escritorio ? posicionDe(sel) : null });
    setFiltro("");
    setActiva(sel.selectedIndex);
    setAbierta(true);
    if (escritorio) sel.focus({ preventScroll: true });
  }

  // En la hoja el estado sigue vivo hasta que termina la animación de salida.
  function cerrar(devolverFoco = false) {
    if (!estado) return;
    setAbierta(false);
    if (estado.pos) {
      setEstado(null);
      if (devolverFoco) estado.sel.focus({ preventScroll: true });
    }
  }

  function elegir(i: number) {
    if (!estado) return;
    const { sel } = estado;
    // En el teléfono no se re-enfoca: en iOS enfocar el <select> abre la rueda nativa.
    cerrar(!!estado.pos);
    fijarOpcion(sel, i);
  }

  const alMouseDown = useEffectEvent((e: MouseEvent) => {
    if (e.button !== 0 || !esRealzable(e.target)) return;
    e.preventDefault();
    if (abierta && estado?.sel === e.target) {
      if (estado.pos) cerrar();
      return;
    }
    abrir(e.target);
  });

  // En pantalla táctil la lista nativa sale con el tap: se cancela en touchend,
  // solo si fue un tap y no el comienzo de un scroll.
  const alTocar = useEffectEvent((e: TouchEvent) => {
    const t = e.touches[0];
    toque.current = esRealzable(e.target) && t ? { sel: e.target, x: t.clientX, y: t.clientY } : null;
  });
  const alSoltar = useEffectEvent((e: TouchEvent) => {
    const q = toque.current;
    toque.current = null;
    const p = e.changedTouches[0];
    if (!q || e.target !== q.sel || !p || Math.abs(p.clientX - q.x) > 10 || Math.abs(p.clientY - q.y) > 10) return;
    e.preventDefault();
    if (!(abierta && estado?.sel === q.sel)) abrir(q.sel);
  });

  const alPresionarFuera = useEffectEvent((e: PointerEvent) => {
    if (!abierta || !estado?.pos || e.target === estado.sel) return;
    if (e.target instanceof Node && popRef.current?.contains(e.target)) return;
    cerrar();
  });

  const alTeclado = useEffectEvent((e: KeyboardEvent) => {
    if (!abierta || !estado) {
      const abre = e.key === " " || e.key === "F4" || (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp"));
      if (abre && esRealzable(e.target)) {
        e.preventDefault();
        abrir(e.target);
      }
      return;
    }
    if (!estado.pos) return;
    const k = navegables.findIndex((o) => o.i === activa);
    const mover = (j: number) => {
      e.preventDefault();
      const o = navegables[Math.max(0, Math.min(navegables.length - 1, j))];
      if (o) setActiva(o.i);
    };
    const enSelect = e.target === estado.sel;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      cerrar(true);
    } else if (e.key === "ArrowDown") mover(k + 1);
    else if (e.key === "ArrowUp") mover(k < 0 ? 0 : k - 1);
    else if (e.key === "Home" && enSelect) mover(0);
    else if (e.key === "End" && enSelect) mover(navegables.length - 1);
    else if (e.key === "Enter" || (e.key === " " && enSelect)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (k >= 0) elegir(activa);
    } else if (e.key === "Tab") cerrar();
    else if (e.key.length === 1 && enSelect && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Búsqueda por letra, como la lista nativa: teclear «ca» salta a «Caracas».
      e.preventDefault();
      const ahora = e.timeStamp;
      letras.current = { texto: (ahora - letras.current.t > 700 ? "" : letras.current.texto) + normalizar(e.key), t: ahora };
      const ini = letras.current.texto.length === 1 ? k + 1 : Math.max(k, 0);
      const orden = [...navegables.slice(ini), ...navegables.slice(0, ini)];
      const o = orden.find((x) => normalizar(x.texto.trim()).startsWith(letras.current.texto));
      if (o) setActiva(o.i);
    }
  });

  const alDesplazar = useEffectEvent((e: Event) => {
    if (!abierta || !estado?.pos) return;
    if (e.target instanceof Node && popRef.current?.contains(e.target)) return;
    cerrar();
  });

  useEffect(() => {
    const raton = (e: MouseEvent) => alMouseDown(e);
    const tocar = (e: TouchEvent) => alTocar(e);
    const soltar = (e: TouchEvent) => alSoltar(e);
    const fuera = (e: PointerEvent) => alPresionarFuera(e);
    const teclado = (e: KeyboardEvent) => alTeclado(e);
    const desplazar = (e: Event) => alDesplazar(e);
    document.addEventListener("mousedown", raton, true);
    document.addEventListener("touchstart", tocar, { capture: true, passive: true });
    document.addEventListener("touchend", soltar, { capture: true, passive: false });
    document.addEventListener("pointerdown", fuera, true);
    document.addEventListener("keydown", teclado, true);
    document.addEventListener("scroll", desplazar, true);
    window.addEventListener("resize", desplazar);
    return () => {
      document.removeEventListener("mousedown", raton, true);
      document.removeEventListener("touchstart", tocar, true);
      document.removeEventListener("touchend", soltar, true);
      document.removeEventListener("pointerdown", fuera, true);
      document.removeEventListener("keydown", teclado, true);
      document.removeEventListener("scroll", desplazar, true);
      window.removeEventListener("resize", desplazar);
    };
  }, []);

  // Que la lista no se salga por la derecha (su ancho se conoce recién pintada)
  // y que arranque con la opción elegida a la vista.
  useLayoutEffect(() => {
    const pop = popRef.current;
    if (pop) {
      const r = pop.getBoundingClientRect();
      if (r.right > window.innerWidth - 8) pop.style.left = `${Math.max(8, window.innerWidth - r.width - 8)}px`;
    }
    aLaVista(listaRef.current?.querySelector('[aria-selected="true"]'), true);
  }, [estado]);

  useEffect(() => {
    aLaVista(listaRef.current?.querySelector(`[data-i="${activa}"]`), false);
  }, [activa]);

  if (!montado || !estado) return null;

  const buscador = buscable ? (
    <input
      type="search"
      value={filtro}
      onChange={(e) => {
        setFiltro(e.target.value);
        const q = normalizar(e.target.value.trim());
        const primera = estado.opciones.find((o) => !o.deshabilitada && (!q || normalizar(o.texto).includes(q)));
        setActiva(primera?.i ?? -1);
      }}
      placeholder="Buscar…"
      aria-label="Buscar opción"
      autoComplete="off"
      autoFocus={!hoja}
      className={`${CLASE_CONTROL} mb-2 h-11 shrink-0`}
    />
  ) : null;

  const lista = (
    <div ref={listaRef} role="listbox" aria-label={estado.titulo} className="flex flex-col gap-0.5">
      {visibles.map((o, k) => {
        const elegida = o.i === estado.elegida;
        const enFoco = o.i === activa;
        const fondo = enFoco ? "bg-sand-2" : elegida ? "bg-acento-suave" : "";
        return (
          <Fragment key={o.i}>
            {o.grupo && o.grupo !== visibles[k - 1]?.grupo ? (
              <div className="px-3 pb-1 pt-3 font-mono text-xs uppercase tracking-wide text-ink-soft">{o.grupo}</div>
            ) : null}
            <button
              type="button"
              role="option"
              aria-selected={elegida}
              data-i={o.i}
              disabled={o.deshabilitada}
              onClick={() => elegir(o.i)}
              onMouseMove={() => {
                if (!enFoco && !o.deshabilitada) setActiva(o.i);
              }}
              className={`flex w-full items-center gap-3 rounded-control px-3 text-left text-base transition-colors duration-150 ease-salida disabled:cursor-default disabled:opacity-40 ${hoja ? "min-h-12" : "min-h-11"} ${elegida ? "font-semibold text-acento" : "text-ink"} ${fondo}`}
            >
              <span className="min-w-0 flex-1 truncate">{o.texto}</span>
              <Icono
                nombre="check"
                tamano={18}
                className={`shrink-0 transition-[opacity,scale] duration-150 ease-salida ${elegida ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
              />
            </button>
          </Fragment>
        );
      })}
      {visibles.length === 0 ? <p className="px-3 py-2.5 text-sm text-ink-soft">Sin coincidencias</p> : null}
    </div>
  );

  if (hoja) {
    return (
      <Hoja
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        onSalida={() => {
          if (!abierta) setEstado(null);
        }}
        titulo={estado.titulo}
      >
        {buscador}
        {lista}
      </Hoja>
    );
  }

  const pos = estado.pos!;
  return createPortal(
    <div
      ref={popRef}
      onMouseDown={(e) => {
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
      }}
      style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.ancho, maxHeight: pos.alto }}
      className={`fixed z-[70] flex max-w-sm flex-col rounded-card bg-card p-1.5 text-ink shadow-chrome transition-[opacity,translate] duration-150 ease-salida starting:opacity-0 ${pos.arriba ? "starting:translate-y-1" : "starting:-translate-y-1"}`}
    >
      {buscador}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{lista}</div>
    </div>,
    document.body,
  );
}
