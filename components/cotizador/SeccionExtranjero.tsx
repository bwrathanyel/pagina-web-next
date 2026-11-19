"use client";

import type { ReactNode } from "react";
import { chip } from "@/components/cotizador/BarraViaje";
import { Campo, Entrada } from "@/components/ui/Campo";
import {
  EXT_EXTRAS,
  EXT_PRESUPUESTOS,
  EXT_SALIDA_OTRA,
  EXT_SALIDAS,
  EXT_SUGERENCIAS,
  EXT_TIPOS,
  limpiarDestinoOtro,
  type SolicitudExtranjero,
} from "@/lib/cotizador/estado";

const alternar = <T,>(lista: readonly T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

function Grupo({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-semibold text-ink">
        {titulo}
        {ayuda ? <span className="block text-sm font-normal text-ink-soft">{ayuda}</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={activo} onClick={onClick} className={chip(activo)}>
      {children}
    </button>
  );
}

/** «Cuéntenos su viaje»: con destino «Viajar al extranjero» no hay ofertas publicadas, así que el
 * cliente cuenta qué busca y el asesor arma la propuesta. Nada es obligatorio; todo llega al lead. */
export function SeccionExtranjero({
  valor,
  onCambio,
  idBase,
}: {
  valor: SolicitudExtranjero;
  onCambio: (v: SolicitudExtranjero) => void;
  idBase: string;
}) {
  const poner = (parcial: Partial<SolicitudExtranjero>) => onCambio({ ...valor, ...parcial });
  return (
    <section aria-labelledby={`${idBase}-titulo`} className="flex flex-col gap-6 rounded-card border border-linea bg-card p-4 md:p-6">
      <div>
        <h2 id={`${idBase}-titulo`} className="font-display text-2xl font-bold leading-tight text-ink">
          Cuéntenos su viaje
        </h2>
        <p className="mt-1 text-ink-soft">
          Aún no publicamos ofertas fuera de Venezuela: con estos datos un asesor le arma opciones con precio para sus
          fechas. Todo es opcional.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Campo etiqueta="¿A dónde quiere ir?">
          {(a11y) => (
            <Entrada
              {...a11y}
              autoComplete="off"
              placeholder="País o ciudad"
              maxLength={60}
              value={valor.pais}
              onChange={(ev) => {
                const pais = limpiarDestinoOtro(ev.target.value);
                poner({ pais, ideas: pais ? false : valor.ideas });
              }}
            />
          )}
        </Campo>
        <div role="group" aria-label="Destinos sugeridos" className="flex flex-wrap gap-2">
          {EXT_SUGERENCIAS.map((s) => (
            <Chip key={s} activo={valor.pais.trim() === s} onClick={() => poner({ pais: valor.pais.trim() === s ? "" : s, ideas: false })}>
              {s}
            </Chip>
          ))}
          <Chip activo={valor.ideas} onClick={() => poner({ ideas: !valor.ideas, pais: "" })}>
            Aún no sé, quiero ideas
          </Chip>
        </div>
      </div>

      <Grupo titulo="Tipo de viaje" ayuda="Puede marcar varios.">
        {EXT_TIPOS.map((t) => (
          <Chip key={t.valor} activo={valor.tipos.includes(t.valor)} onClick={() => poner({ tipos: alternar(valor.tipos, t.valor) })}>
            {t.etiqueta}
          </Chip>
        ))}
      </Grupo>

      <Grupo titulo="Presupuesto por persona">
        {EXT_PRESUPUESTOS.map((p) => (
          <Chip
            key={p.valor}
            activo={valor.presupuesto === p.valor}
            onClick={() => poner({ presupuesto: valor.presupuesto === p.valor ? "" : p.valor })}
          >
            <span className="font-mono text-sm">{p.etiqueta}</span>
          </Chip>
        ))}
      </Grupo>

      <div className="flex flex-col gap-3">
        <Grupo titulo="¿Desde qué ciudad sale?">
          {EXT_SALIDAS.map((s) => (
            <Chip
              key={s.valor}
              activo={valor.salida === s.valor}
              onClick={() => poner({ salida: valor.salida === s.valor ? "" : s.valor, salidaOtra: s.valor === EXT_SALIDA_OTRA ? valor.salidaOtra : "" })}
            >
              {s.etiqueta}
            </Chip>
          ))}
        </Grupo>
        {valor.salida === EXT_SALIDA_OTRA ? (
          <Campo etiqueta="¿Cuál ciudad?">
            {(a11y) => (
              <Entrada
                {...a11y}
                autoComplete="address-level2"
                maxLength={60}
                value={valor.salidaOtra}
                onChange={(ev) => poner({ salidaOtra: limpiarDestinoOtro(ev.target.value) })}
              />
            )}
          </Campo>
        ) : null}
      </div>

      <Grupo titulo="También necesito">
        {EXT_EXTRAS.map((x) => (
          <Chip key={x.valor} activo={valor.extras.includes(x.valor)} onClick={() => poner({ extras: alternar(valor.extras, x.valor) })}>
            {x.etiqueta}
          </Chip>
        ))}
      </Grupo>
    </section>
  );
}
