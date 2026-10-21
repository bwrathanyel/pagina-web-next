import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { GrillaFiltrable, type EntradaGrilla } from "@/components/catalogo/GrillaFiltrable";
import { PaqueteCard } from "@/components/paquetes/PaqueteCard";
import { ordenarDestinos } from "@/lib/catalogo/destinos";
import type { RutaVuelo } from "@/lib/cotizador/vuelo";
import { esFijo } from "@/lib/paquetes/precio";
import type { Paquete } from "@/lib/paquetes/tipos";

const TITULO = "font-display text-2xl font-bold leading-tight text-ink md:text-3xl";
const DATO = "mt-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft";

/** Paquetes con boleto incluido: primero las salidas fijas (Navidad, Fin de
 * Año), por fecha; después los de todo el año, filtrables por destino. Llegan
 * ya filtrados (con ruta de vuelo y sin vencer). */
export function PaquetesListado({ paquetes, rutas }: { paquetes: Paquete[]; rutas: RutaVuelo[] }) {
  const especiales = paquetes
    .filter(esFijo)
    .sort((a, b) => a.fecha_entrada!.localeCompare(b.fecha_entrada!) || a.orden - b.orden);
  const todoElAno = paquetes.filter((p) => !esFijo(p));
  const entradas: EntradaGrilla[] = todoElAno.map((p, i) => ({
    id: p.id,
    destino: p.hotel.destino ?? "Otros",
    monto: null,
    tarjeta: <PaqueteCard paquete={p} rutas={rutas} prioridad={!especiales.length && i < 2} />,
  }));

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {especiales.length ? (
        <section aria-labelledby="paquetes-especiales">
          <div className="mb-6 border-b border-linea pb-4">
            <h2 id="paquetes-especiales" className={TITULO}>
              Fechas especiales
            </h2>
            <p className={DATO}>Salidas fijas · boleto y hotel en un solo precio</p>
          </div>
          <CatalogoGrid>
            {especiales.map((p, i) => (
              <div key={p.id} className="h-full">
                <PaqueteCard paquete={p} rutas={rutas} prioridad={i < 2} />
              </div>
            ))}
          </CatalogoGrid>
        </section>
      ) : null}

      {todoElAno.length ? (
        <section aria-labelledby="paquetes-todo-el-ano">
          <div className="mb-6 border-b border-linea pb-4">
            <h2 id="paquetes-todo-el-ano" className={TITULO}>
              Todo el año
            </h2>
            <p className={DATO}>Usted elige la fecha y las noches</p>
          </div>
          <GrillaFiltrable
            entradas={entradas}
            destinos={ordenarDestinos([...new Set(entradas.map((e) => e.destino))])}
            nombre={["paquete", "paquetes"]}
            ordenable={false}
            vacio="No hay paquetes en este destino ahora mismo. Escríbanos por WhatsApp y le armamos uno."
          />
        </section>
      ) : null}
    </div>
  );
}
