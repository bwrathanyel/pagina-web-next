// Fase 5b: el hotel es una carpeta, también acá.
//
// Antes la página del producto mostraba UN precio (la primera tarifa que
// llegara) y abajo una lista suelta de "Promociones activas" que leía la tabla
// `promociones`. Desde la Fase 5 paso 4 los flyers son filas de `tarifas`, así
// que las dos listas eran la misma y cada flyer se veía dos veces. Ahora hay una
// sola: una tarjeta por fila del PDF o flyer, agrupadas por plan, con las
// condiciones del recuadro azul plegadas arriba.
//
// Componente de servidor: solo lee y pinta, sin estado.
import type { Producto, Tarifa, TarifarioBloque } from "@/types/supabase";
import { formatearPrecioCliente } from "@/lib/utils/formatoPrecio";
import {
  agruparPorPlan,
  bloquesDe,
  condicionesResumen,
  precioDobleHero,
  preciosLista,
  rangoFechas,
  suplementoTexto,
  tarifaDestacada,
  vendibleHoy,
  ventaHasta,
  ventanasDe,
} from "@/lib/tarifas";

function Dato({ clave, valor }: { clave: string; valor: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className="min-w-16 font-mono text-[0.68rem] uppercase tracking-wide text-ink-soft">{clave}</span>
      <span className="text-sm text-ink">{valor}</span>
    </div>
  );
}

function TarjetaPromocion({ tarifa, destacada }: { tarifa: Tarifa; destacada: boolean }) {
  const precios = preciosLista(tarifa);
  const hero = precios.length > 0 ? precioDobleHero(tarifa) : null;
  const preciosResto = hero ? precios.filter((p) => p.clave !== "dbl") : precios;
  const ventanas = ventanasDe(tarifa);
  const venta: [string | null, string | null] = [tarifa.venta_desde ?? null, ventaHasta(tarifa)];
  const condiciones = condicionesResumen(tarifa);
  const vendible = vendibleHoy(tarifa);
  // Sin `titulo` (todo lo que todavía no pasó por la carga maestra) la tarjeta
  // se llama por su habitación o su plan antes que por una etiqueta genérica.
  const titulo = tarifa.titulo || tarifa.habitacion || tarifa.plan || "Tarifa";

  return (
    <article
      className={
        "flex flex-col gap-3 rounded-[var(--radius-media)] border border-linea bg-card p-4 " +
        (destacada ? "border-coral/45 shadow-card " : "") +
        (vendible ? "" : "opacity-60")
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-display text-lg font-semibold leading-snug text-ink">{titulo}</h4>
        {destacada ? (
          <span className="rounded-[var(--radius-pill)] bg-gradient-to-br from-coral to-gold px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-btn-ink">
            Mejor precio hoy
          </span>
        ) : null}
        {vendible ? null : (
          <span className="rounded-[var(--radius-pill)] bg-sand-2 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-ink-soft">
            Ya no se vende
          </span>
        )}
      </div>

      {tarifa.habitacion && tarifa.habitacion !== titulo ? (
        <p className="-mt-2 text-sm text-ink-soft">{tarifa.habitacion}</p>
      ) : null}

      {hero ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="font-display text-2xl font-bold leading-none text-ink">{hero.monto}</span>
            <span className="mt-1 text-xs text-ink-soft">{hero.nota}</span>
          </div>
          {preciosResto.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 opacity-75">
              {preciosResto.map((p) => (
                <div key={p.clave} className="flex items-baseline justify-between gap-2 border-b border-linea pb-0.5">
                  <dt className="text-xs text-ink-soft">{p.etiqueta}</dt>
                  <dd className="font-mono text-xs font-bold text-ink">{p.monto}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : precios.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {precios.map((p) => (
            <div key={p.clave} className="flex items-baseline justify-between gap-2 border-b border-linea pb-1">
              <dt className="text-sm text-ink-soft">{p.etiqueta}</dt>
              <dd className="font-mono text-sm font-bold text-ink">{p.monto}</dd>
            </div>
          ))}
        </dl>
      ) : tarifa.precio_texto ? (
        <p className="whitespace-pre-line font-mono text-sm text-seafoam-text">
          {formatearPrecioCliente(tarifa.precio_texto)}
        </p>
      ) : null}

      {venta[0] || venta[1] || ventanas.length > 0 || tarifa.vigencia_texto ? (
        <div className="flex flex-col gap-1">
          {venta[0] || venta[1] ? <Dato clave="Venta" valor={rangoFechas(venta)} /> : null}
          {ventanas.map((ventana, i) => (
            <Dato key={`${ventana[0]}-${ventana[1]}`} clave={i === 0 ? "Disfrute" : ""} valor={rangoFechas(ventana)} />
          ))}
          {!venta[0] && !venta[1] && ventanas.length === 0 && tarifa.vigencia_texto ? (
            <Dato clave="Vigencia" valor={tarifa.vigencia_texto} />
          ) : null}
        </div>
      ) : null}

      {condiciones.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {condiciones.map((c) => (
            <li
              key={c.texto}
              className={
                "relative pl-4 before:absolute before:left-0 before:content-['•'] " +
                (c.fuerte ? "font-semibold text-acento before:text-acento" : "text-ink-soft before:text-coral")
              }
            >
              {formatearPrecioCliente(c.texto)}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

/** Condiciones completas del recuadro azul, plegadas. Nada de lo que el parser
 * no supo clasificar se descarta: `otras` se lista tal cual. */
function CondicionesBloque({ bloque }: { bloque: TarifarioBloque }) {
  const filas: [string, string][] = [];
  if (bloque.base_precio) {
    filas.push(["Precios", bloque.base_precio === "habitacion" ? "Por habitación" : "Por persona"]);
  }
  if (bloque.check_in || bloque.check_out) {
    filas.push(["Check in / out", [bloque.check_in, bloque.check_out].filter(Boolean).join(" / ")]);
  }
  const minimos =
    bloque.minimo_noches && typeof bloque.minimo_noches === "object"
      ? Object.entries(bloque.minimo_noches)
          .map(([temporada, noches]) => `${temporada}: ${noches} noche${noches > 1 ? "s" : ""}`)
          .join(" · ")
      : "";
  if (minimos) filas.push(["Mínimo de noches", minimos]);
  const ocupacion = (bloque.ocupacion?.lineas ?? []).join(" · ");
  if (ocupacion) filas.push(["Ocupación máxima", ocupacion]);
  const ninos = bloque.ninos
    ? [
        bloque.ninos.politica,
        bloque.ninos.gratis_hasta != null ? `Gratis hasta ${bloque.ninos.gratis_hasta} años` : null,
        bloque.ninos.chd_desde != null || bloque.ninos.chd_hasta != null
          ? `Niños ${bloque.ninos.chd_desde ?? "?"}-${bloque.ninos.chd_hasta ?? "?"} años`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  if (ninos) filas.push(["Niños", ninos]);
  const impuestos = bloque.impuestos
    ? [
        bloque.impuestos.iva_incluido === true
          ? "IVA incluido"
          : bloque.impuestos.iva_incluido === false
            ? "IVA no incluido"
            : null,
        bloque.impuestos.igtf_pct != null ? `Adicionar ${bloque.impuestos.igtf_pct}% IGTF` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  if (impuestos) filas.push(["Impuestos", impuestos]);
  if ((bloque.incluye ?? []).length) filas.push(["Incluye", (bloque.incluye ?? []).join(" · ")]);
  const suplementos = Array.isArray(bloque.suplementos) ? bloque.suplementos : [];
  if (!filas.length && !suplementos.length && !(bloque.otras ?? []).length) return null;

  return (
    <details className="rounded-[var(--radius-media)] border border-linea bg-seafoam-bg/60 px-4 py-3">
      <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-wide text-seafoam-text">
        Condiciones{bloque.plan ? ` — ${bloque.plan}` : ""}
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        {suplementos.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {suplementos.map((s, i) => (
              <li key={i} className={s.obligatorio ? "font-semibold text-acento" : "text-ink"}>
                {(s.obligatorio ? "Obligatorio — " : "") + suplementoTexto(s, null)}
              </li>
            ))}
          </ul>
        ) : null}
        {filas.map(([clave, valor]) => (
          <Dato key={clave} clave={clave} valor={valor} />
        ))}
        {(bloque.otras ?? []).length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-ink-soft">
            {(bloque.otras ?? []).map((otra) => (
              <li key={otra}>{otra}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}

export function CarpetaTarifas({ producto }: { producto: Producto }) {
  const tarifas = producto.tarifas ?? [];
  if (!tarifas.length) return null;
  const destacadaId = tarifaDestacada(producto)?.id ?? null;
  const grupos = agruparPorPlan(tarifas, destacadaId);
  const bloques = bloquesDe(producto);

  return (
    <section className="mt-8 md:mt-12">
      <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
        {tarifas.length === 1 ? "1 promoción disponible" : `${tarifas.length} promociones disponibles`}
      </h2>

      {bloques.length > 0 ? (
        <div className="mb-5 flex flex-col gap-2">
          {bloques.map((bloque) => (
            <CondicionesBloque key={bloque.id} bloque={bloque} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        {grupos.map((grupo) => (
          <div key={grupo.plan}>
            {grupos.length > 1 || grupo.plan !== "Sin plan indicado" ? (
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wide text-ink-soft">{grupo.plan}</h3>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grupo.tarifas.map((tarifa) => (
                <TarjetaPromocion key={tarifa.id} tarifa={tarifa} destacada={tarifa.id === destacadaId} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
