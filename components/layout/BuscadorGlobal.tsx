"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Entrada } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { coincide, DESTINOS_SUGERIDOS } from "@/lib/catalogo/busqueda";
import { usePaneles } from "@/lib/layout/paneles";

type Opcion = { id: string; texto: string; href: string; icono: NombreIcono };
type Grupo = { titulo: string; opciones: Opcion[] };

const enBuscar = (q: string) => `/buscar?q=${encodeURIComponent(q)}`;

/** Buscador global (⌘K / Ctrl K, o el botón de la lupa). Es un atajo: lleva a
 * secciones del sitio o a /buscar con la consulta ya escrita, donde vive el
 * filtrado del catálogo (BuscarClient). No trae el catálogo al cliente. */
export function BuscadorGlobal() {
  const abierto = usePaneles((s) => s.buscadorAbierto);
  const cerrar = usePaneles((s) => s.cerrarBuscador);
  const alternar = usePaneles((s) => s.alternarBuscador);
  const router = useRouter();
  const { content } = useSiteContent();
  const [query, setQuery] = useState("");
  const [indice, setIndice] = useState(0);
  const base = useId();

  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        alternar();
      }
    };
    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, [alternar]);

  const q = query.trim();

  const grupos = useMemo<Grupo[]>(() => {
    const accesos: Opcion[] = [
      ...content.navigation.items
        .filter((i) => i.visible)
        .map((i) => ({ id: `nav-${i.id}`, texto: i.label, href: i.href, icono: "flecha-der" as const })),
      { id: "cotizar", texto: content.navigation.quoteLabel, href: content.navigation.quoteHref, icono: "cotizar" },
      { id: "favoritos", texto: "Favoritos", href: "/cuenta/favoritos", icono: "corazon" },
      { id: "cuenta", texto: "Mi cuenta", href: "/cuenta", icono: "usuario" },
    ];
    if (q === "") {
      return [
        { titulo: "Ir a", opciones: accesos },
        {
          titulo: "Destinos populares",
          opciones: DESTINOS_SUGERIDOS.map((d) => ({ id: `destino-${d}`, texto: d, href: enBuscar(d), icono: "buscar" as const })),
        },
      ];
    }
    const coinciden = accesos.filter((a) => coincide(a.texto, q));
    return [
      { titulo: "Catálogo", opciones: [{ id: "buscar", texto: `Buscar “${q}”`, href: enBuscar(q), icono: "buscar" }] },
      ...(coinciden.length > 0 ? [{ titulo: "Ir a", opciones: coinciden }] : []),
    ];
  }, [content.navigation, q]);

  const opciones = useMemo(() => grupos.flatMap((g) => g.opciones), [grupos]);
  const activa = Math.min(indice, opciones.length - 1);
  const idOpcion = (o: Opcion) => `${base}-${o.id}`;

  useEffect(() => {
    if (!abierto) return;
    document.getElementById(`${base}-${opciones[activa]?.id}`)?.scrollIntoView({ block: "nearest" });
  }, [abierto, activa, base, opciones]);

  function ir(o: Opcion | undefined) {
    if (!o) return;
    cerrar();
    router.push(o.href);
  }

  function alTeclearEnLista(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((activa + 1) % opciones.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((activa - 1 + opciones.length) % opciones.length);
    }
  }

  return (
    <Hoja
      abierta={abierto}
      onCerrar={cerrar}
      titulo="Buscar"
      escritorio="centrado"
      anchoClassName="lg:max-w-xl"
      onSalida={() => {
        setQuery("");
        setIndice(0);
      }}
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          ir(opciones[activa]);
        }}
      >
        <div className="relative">
          <Icono nombre="buscar" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Entrada
            data-autofocus
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndice(0);
            }}
            onKeyDown={alTeclearEnLista}
            placeholder="Destino, hotel o paquete"
            aria-label="Buscar en el sitio"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${base}-lista`}
            aria-activedescendant={opciones[activa] ? idOpcion(opciones[activa]) : undefined}
            autoComplete="off"
            enterKeyHint="search"
            className="pl-12"
          />
        </div>

        <ul id={`${base}-lista`} role="listbox" aria-label="Sugerencias" className="mt-3">
          {grupos.map((g) => (
            <li key={g.titulo} role="presentation">
              <p className="px-3 pb-1 pt-3 text-sm font-semibold text-ink-soft">{g.titulo}</p>
              <ul role="group" aria-label={g.titulo}>
                {g.opciones.map((o) => {
                  const esActiva = opciones[activa]?.id === o.id;
                  return (
                    <li
                      key={o.id}
                      id={idOpcion(o)}
                      role="option"
                      aria-selected={esActiva}
                      onClick={() => ir(o)}
                      onPointerMove={() => setIndice(opciones.indexOf(o))}
                      className={
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-control px-3 font-semibold text-ink transition-colors duration-150 " +
                        (esActiva ? "bg-sand-2" : "")
                      }
                    >
                      <Icono nombre={o.icono} tamano={18} className="text-ink-soft" />
                      <span className="min-w-0 flex-1 truncate">{o.texto}</span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </form>
    </Hoja>
  );
}
