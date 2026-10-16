import { Etiqueta } from "@/components/ui/Insignia";
import { montoConMoneda, vendibleHoy } from "@/lib/tarifas";
import {
  datosExcursion,
  esSuplementoRoques,
  filaTraslado,
  suplementoRoques,
  textoNoIncluye,
  type FilaTraslado,
} from "@/lib/servicios";
import type { Producto, Tarifa } from "@/types/supabase";

const MODALIDAD: Record<string, string> = {
  compartido: "Compartido",
  privado: "Privado por unidad",
  disposicion: "A disposición",
};

function Fila({ clave, valor }: { clave: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-linea py-2 last:border-b-0">
      <dt className="text-sm text-ink-soft">{clave}</dt>
      <dd className="text-right font-mono text-base font-bold tabular-nums text-ink">{valor}</dd>
    </div>
  );
}

function TarjetaExcursion({ tarifa, titulo }: { tarifa: Tarifa; titulo: string | null }) {
  const d = datosExcursion(tarifa);
  if (!d) return null;
  const infante = d.infante === null ? null : d.infante === 0 ? "Gratis" : montoConMoneda(d.infante, d.moneda);
  return (
    <article className={"flex flex-col gap-3 rounded-card border border-linea bg-card p-4 " + (vendibleHoy(tarifa) ? "" : "opacity-60")}>
      {titulo ? <h3 className="font-display text-lg font-bold leading-snug text-ink">{titulo}</h3> : null}
      <dl>
        {d.adulto !== null ? <Fila clave="Adulto" valor={montoConMoneda(d.adulto, d.moneda)} /> : null}
        {d.nino !== null ? <Fila clave={`Niño${d.edadNino ? ` (${d.edadNino})` : ""}`} valor={montoConMoneda(d.nino, d.moneda)} /> : null}
        {infante ? <Fila clave="Infante (0-3 años)" valor={infante} /> : null}
      </dl>
      <div className="flex flex-wrap gap-2">
        {d.etiqueta ? <Etiqueta>{d.etiqueta}</Etiqueta> : null}
        {d.incluyeTraslado ? <Etiqueta tono="acento">Incluye traslado</Etiqueta> : null}
        {d.minPax ? <Etiqueta>Mínimo {d.minPax} personas</Etiqueta> : null}
      </div>
      {d.noIncluye.length ? (
        <p className="text-sm text-ink-soft">No incluye: {d.noIncluye.map((n) => textoNoIncluye(n, d.moneda)).join("; ")}.</p>
      ) : null}
      {d.notas ? <p className="text-sm text-ink-soft">{d.notas}</p> : null}
    </article>
  );
}

function TablaTraslados({ filas, moneda }: { filas: FilaTraslado[]; moneda?: string | null }) {
  const modalidades = [...new Set(filas.map((f) => f.modalidad ?? "otro"))];
  return (
    <div className="flex flex-col gap-5">
      {modalidades.map((m) => {
        const delGrupo = filas.filter((f) => (f.modalidad ?? "otro") === m);
        const vehiculos = [...new Set(delGrupo.map((f) => f.vehiculo).filter(Boolean))].join(" / ");
        const tramo = delGrupo[0]?.tramo;
        const sentido = delGrupo.find((f) => f.sentido)?.sentido;
        return (
          <section key={m} className="rounded-card border border-linea bg-card p-4">
            <h3 className="font-display text-lg font-bold leading-snug text-ink">{MODALIDAD[m] ?? "Traslado"}</h3>
            <p className="mb-2 text-sm text-ink-soft">
              {[tramo, vehiculos, sentido === "OW" ? "Solo ida" : null].filter(Boolean).join(" · ")}
            </p>
            <dl>
              {delGrupo.map((f) => (
                <Fila
                  key={f.id}
                  clave={`${f.rango}${f.nino ? ` · niño ${f.nino}` : ""}`}
                  valor={`${montoConMoneda(f.monto!, moneda)} ${f.unidad}`}
                />
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function SuplementosRoques({ tarifas }: { tarifas: Tarifa[] }) {
  const lista = tarifas.flatMap((t) => {
    const s = suplementoRoques(t);
    return s ? [s] : [];
  });
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        Cada posada cobra por separado el traslado a los cayos. Se suma al paquete de la posada y se paga en su moneda.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {lista.map((s) => (
          <article key={s.posada ?? "posada"} className="rounded-card border border-linea bg-card p-4">
            <h3 className="font-display text-lg font-bold leading-snug text-ink">{s.posada}</h3>
            {s.items.length ? (
              <dl className="mt-2">
                {s.items.map((i) => (
                  <Fila
                    key={i.concepto}
                    clave={i.concepto}
                    valor={i.monto === null ? "Consultar" : `${montoConMoneda(i.monto, s.moneda)}${i.por ? ` ${i.por}` : ""}`}
                  />
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Consultar precio.</p>
            )}
            {s.notas ? <p className="mt-2 text-sm text-ink-soft">{s.notas}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

/** Tarifas de una excursión o un traslado (ficha del producto y lista de
 * /catalogo/traslados). Sin las promociones de hotel: aquí no hay ventanas ni planes. */
export function TarifasServicio({ producto, conTitulo = true }: { producto: Pick<Producto, "tipo" | "tarifas">; conTitulo?: boolean }) {
  const tarifas = producto.tarifas ?? [];
  if (!tarifas.length) return null;
  const titulo = conTitulo ? (
    <h2 className="mb-4 font-display text-2xl font-bold text-ink">{producto.tipo === "excursion" ? "Precios por persona" : "Tarifas"}</h2>
  ) : null;

  if (producto.tipo === "excursion") {
    const validas = tarifas.filter((t) => datosExcursion(t));
    return (
      <section id={conTitulo ? "tarifas" : undefined} className={conTitulo ? "mt-8 scroll-mt-24 md:mt-12" : "mt-3"}>
        {titulo}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {validas.map((t) => (
            <TarjetaExcursion key={t.id} tarifa={t} titulo={validas.length > 1 ? (t.titulo ?? null) : null} />
          ))}
        </div>
      </section>
    );
  }

  const roques = tarifas.some(esSuplementoRoques);
  const filas = tarifas.flatMap((t) => {
    const f = filaTraslado(t);
    return f ? [f] : [];
  });
  // PostgREST no ordena el embed: los ids de la carga siguen el orden del PDF
  // (1 pasajero, desde 2; 4/8/12 horas y la hora extra al final).
  filas.sort((a, b) => a.id - b.id);
  return (
    <section id={conTitulo ? "tarifas" : undefined} className={conTitulo ? "mt-8 scroll-mt-24 md:mt-12" : "mt-3"}>
      {titulo}
      {roques ? <SuplementosRoques tarifas={tarifas} /> : <TablaTraslados filas={filas} moneda={tarifas[0]?.moneda} />}
    </section>
  );
}
