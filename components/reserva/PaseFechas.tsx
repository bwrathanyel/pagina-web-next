"use client";

import { useId } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo, Selector } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { resumenViajeros } from "@/components/ui/SelectorViajeros";
import { MAX_BEBES, MAX_PAX } from "@/lib/checkout/calculo";
import { rangoFechas } from "@/lib/checkout/formato";
import { sumarDias } from "@/lib/cotizador/cotizacionRapida";

// «El pase» de /reservar: fechas y viajeros en una sola tarjeta compacta arriba. En el teléfono
// los viajeros se eligen en una Hoja (sin popover: el checkout no depende de anchor-positioning);
// en escritorio los contadores van en línea dentro del mismo pase.

export const ROTULO = "font-mono text-xs font-bold uppercase tracking-widest text-ink-soft";

const PASO =
  "flex h-11 w-11 items-center justify-center rounded-full border border-linea-fuerte text-ink " +
  "transition-colors duration-150 ease-salida enabled:hover:border-ink/40 enabled:hover:bg-sand-2 disabled:opacity-35";

/** Edad de cada niño de 2 a 11; null = todavía no la eligió (no hay valor por defecto: cambia el precio). */
export interface Pasajeros {
  adultos: number;
  edades: (number | null)[];
  bebes: number;
}

export const textoViajeros = (p: Pasajeros) => resumenViajeros({ adultos: p.adultos, ninos: p.edades.length, bebes: p.bebes });

const FILAS = [
  { clave: "adultos", etiqueta: "Adultos", detalle: "12 años o más", unidad: "adulto" },
  { clave: "ninos", etiqueta: "Niños", detalle: "De 2 a 11 años", unidad: "niño" },
  { clave: "bebes", etiqueta: "Bebés", detalle: "Menores de 2 años", unidad: "bebé" },
] as const;

export function ContadorViajeros({
  valor,
  onCambio,
  mostrarErrores,
  enLinea = false,
}: {
  valor: Pasajeros;
  onCambio: (p: Pasajeros) => void;
  mostrarErrores: boolean;
  /** Escritorio: los tres contadores en una fila. */
  enLinea?: boolean;
}) {
  const id = useId();
  const total = valor.adultos + valor.edades.length + valor.bebes;
  const lleno = total >= MAX_PAX;
  const n = { adultos: valor.adultos, ninos: valor.edades.length, bebes: valor.bebes };
  const min = { adultos: 1, ninos: 0, bebes: 0 };
  const max = { adultos: MAX_PAX, ninos: MAX_PAX, bebes: MAX_BEBES };

  function mover(clave: keyof typeof n, paso: 1 | -1) {
    if (clave === "adultos") onCambio({ ...valor, adultos: valor.adultos + paso });
    else if (clave === "bebes") onCambio({ ...valor, bebes: valor.bebes + paso });
    else onCambio({ ...valor, edades: paso > 0 ? [...valor.edades, null] : valor.edades.slice(0, -1) });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className={enLinea ? "grid grid-cols-3 gap-4" : "divide-y divide-linea"}>
        {FILAS.map((f) => {
          const idEtiqueta = `${id}-${f.clave}`;
          const actual = n[f.clave];
          return (
            <li
              key={f.clave}
              className={enLinea ? "flex flex-col gap-2" : "flex items-center justify-between gap-4 py-3 first:pt-0"}
            >
              <div id={idEtiqueta}>
                <p className="font-semibold text-ink">{f.etiqueta}</p>
                <p className="text-sm text-ink-soft">{f.detalle}</p>
              </div>
              <div role="group" aria-labelledby={idEtiqueta} className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => mover(f.clave, -1)}
                  disabled={actual <= min[f.clave]}
                  aria-label={`Quitar un ${f.unidad}`}
                  className={PASO}
                >
                  <Icono nombre="menos" tamano={18} />
                </button>
                <output aria-live="polite" className="w-7 text-center font-mono text-lg font-bold tabular-nums text-ink">
                  {actual}
                </output>
                <button
                  type="button"
                  onClick={() => mover(f.clave, 1)}
                  disabled={lleno || actual >= max[f.clave]}
                  aria-label={`Agregar un ${f.unidad}`}
                  className={PASO}
                >
                  <Icono nombre="suma" tamano={18} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {lleno ? <p className="text-sm text-ink-soft">Por compra directa se reservan hasta {MAX_PAX} viajeros.</p> : null}

      {valor.edades.length ? (
        <div data-campo="edades" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {valor.edades.map((edad, i) => (
            <Campo
              key={i}
              etiqueta={`Edad del niño ${i + 1}`}
              error={mostrarErrores && edad === null ? "Elija la edad." : null}
              requerido
            >
              {(a) => (
                <Selector
                  {...a}
                  value={edad ?? ""}
                  onChange={(e) => onCambio({ ...valor, edades: valor.edades.map((x, j) => (j === i ? Number(e.target.value) : x)) })}
                >
                  <option value="" disabled>
                    Elija la edad
                  </option>
                  {Array.from({ length: 10 }, (_, k) => k + 2).map((anos) => (
                    <option key={anos} value={anos}>
                      {anos} años
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PaseFechas({
  desde,
  hasta,
  hoy,
  noches,
  onFechas,
  pasajeros,
  onPasajeros,
  hojaAbierta,
  onHoja,
  errorFechas,
  mostrarErrores,
}: {
  desde: string;
  hasta: string;
  hoy: string;
  noches: number | null;
  onFechas: (desde: string, hasta: string) => void;
  pasajeros: Pasajeros;
  onPasajeros: (p: Pasajeros) => void;
  hojaAbierta: boolean;
  onHoja: (abierta: boolean) => void;
  errorFechas: string | null;
  mostrarErrores: boolean;
}) {
  const rango = desde && hasta ? { desde, hasta } : undefined;
  const faltanEdades = pasajeros.edades.some((e) => e === null);
  const idError = useId();

  return (
    <div className="flex flex-col gap-2">
      <div
        className={
          "rounded-card border bg-card " + (errorFechas && mostrarErrores ? "border-peligro" : "border-linea")
        }
      >
        <div data-campo="fechas" className="grid grid-cols-2 divide-x divide-linea">
          <div className="flex flex-col px-4 pt-3 pb-1">
            <span aria-hidden="true" className={ROTULO}>Entrada</span>
            <SelectorFecha
              id="r-desde"
              name="desde"
              etiqueta="Entrada"
              valor={desde}
              min={hoy}
              rango={rango}
              vacio="Elegir"
              onCambio={(v) => onFechas(v, hasta && hasta > v ? hasta : "")}
              className="min-h-11 w-full text-base font-bold text-ink"
            />
          </div>
          <div className="flex flex-col px-4 pt-3 pb-1">
            <span aria-hidden="true" className={ROTULO}>Salida</span>
            <SelectorFecha
              id="r-hasta"
              name="hasta"
              etiqueta="Salida"
              valor={hasta}
              min={desde ? sumarDias(desde, 1) : sumarDias(hoy, 1)}
              rango={rango}
              vacio="Elegir"
              onCambio={(v) => onFechas(desde, v)}
              className="min-h-11 w-full text-base font-bold text-ink"
            />
          </div>
        </div>

        {/* Teléfono: una fila que abre la Hoja. */}
        <button
          type="button"
          onClick={() => onHoja(true)}
          aria-haspopup="dialog"
          className="perforacion-h flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left lg:hidden"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span aria-hidden="true" className={ROTULO}>Viajeros</span>
            <span className="truncate font-bold text-ink">
              <span className="sr-only">Viajeros: </span>
              {textoViajeros(pasajeros)}
            </span>
            {faltanEdades ? (
              <span className={"text-sm " + (mostrarErrores ? "font-medium text-peligro" : "text-ink-soft")}>
                Falta la edad de {pasajeros.edades.filter((e) => e === null).length === 1 ? "un niño" : "los niños"}
              </span>
            ) : null}
          </span>
          <Icono nombre="chevron-der" tamano={18} className="text-ink-soft" />
        </button>

        {/* Escritorio: los contadores en línea, dentro del pase. */}
        <div className="perforacion-h hidden px-4 py-4 lg:block">
          <p aria-hidden="true" className={ROTULO + " mb-3"}>Viajeros</p>
          <ContadorViajeros valor={pasajeros} onCambio={onPasajeros} mostrarErrores={mostrarErrores} enLinea />
        </div>
      </div>

      {errorFechas && mostrarErrores ? (
        <p id={idError} role="alert" className="text-sm font-medium text-peligro">
          {errorFechas}
        </p>
      ) : desde && hasta && noches ? (
        <p className="font-mono text-sm text-ink-soft">
          {noches} {noches === 1 ? "noche" : "noches"} · {rangoFechas(desde, hasta)}
        </p>
      ) : null}

      <Hoja
        abierta={hojaAbierta}
        onCerrar={() => onHoja(false)}
        titulo="¿Quiénes viajan?"
        pie={
          <Boton type="button" ancho onClick={() => onHoja(false)}>
            Listo
          </Boton>
        }
      >
        <ContadorViajeros valor={pasajeros} onCambio={onPasajeros} mostrarErrores={mostrarErrores} />
      </Hoja>
    </div>
  );
}
