"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { useCarritoStore } from "@/lib/carrito/store";
import { armarCarrito } from "@/lib/leads/buildCarrito";
import { asesorPorNombre, elegirAsesor } from "@/lib/asesores";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { enviarASheetMonkey } from "@/lib/leads/sheetMonkey";
import { detectarProcedencia, esInstagramInApp } from "@/lib/utils/procedencia";
import { SolicitudLista } from "@/components/leads/SolicitudLista";
import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Campo, Entrada } from "@/components/ui/Campo";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Icono } from "@/components/ui/Icono";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";

const sinSuscripcion = () => () => {};
const ETIQUETA = "font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft";

export default function CarritoPage() {
  const { items, quitar, limpiar } = useCarritoStore();
  // El carrito vive en localStorage: el servidor lo ve vacío. Hasta montar se
  // muestra un esqueleto en vez de "Está vacío" por un instante.
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const [waHref, setWaHref] = useState<string | null>(null);
  const [enviados, setEnviados] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const resultado = armarCarrito(items, nombre, telefono, nota);

      enviarASheetMonkey({
        destino: resultado.destino,
        servicio: resultado.servicio,
        pagina: "Carrito",
        nombre,
        procedencia: detectarProcedencia(),
        telefono,
        asesor: elegirAsesor().telefono,
      });
      const leadCRM = await crearLeadCRM({
        nombre,
        telefono,
        destino: resultado.destino,
        personas: resultado.personas,
        consulta: resultado.consulta,
      }).catch(() => null);
      const asesor = asesorPorNombre(leadCRM?.asesor) ?? elegirAsesor();

      const mensaje = esInstagramInApp() ? resultado.mensajeTexto : resultado.mensajeEmoji;
      setEnviados(items.length);
      setWaHref(`https://wa.me/${asesor.telefono}?text=${encodeURIComponent(mensaje)}`);
      limpiar();
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  if (waHref) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 md:py-16">
        <SolicitudLista nivel="h1" waHref={waHref} detalle={`${enviados} ${enviados === 1 ? "elemento" : "elementos"}`}>
          La armamos con todo lo del carrito. Envíela por WhatsApp y un asesor le responde con los detalles.
        </SolicitudLista>
        <Link
          href="/catalogo/promociones"
          className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-acento underline-offset-4 hover:underline"
        >
          Seguir viendo promociones
          <Icono nombre="flecha-der" tamano={18} />
        </Link>
      </main>
    );
  }

  if (!montado) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-6 md:py-10" aria-busy="true">
        <Esqueleto className="mb-8 h-10 w-48" />
        <div className="flex flex-col gap-3">
          <Esqueleto className="h-24" />
          <Esqueleto className="h-24" />
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md px-5 py-12 md:py-20">
        <h1 className="font-display text-4xl font-bold leading-none text-ink">Su carrito está vacío</h1>
        <p className="mt-4 text-ink-soft">
          Agregue hoteles, tours o promociones desde el catálogo y pida la cotización de todo junto.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Boton href="/catalogo/promociones" iconoFin={<Icono nombre="flecha-der" tamano={18} />}>
            Ver promociones
          </Boton>
          <Boton href="/cotizar" variante="secundario">
            Cotizar a medida
          </Boton>
        </div>
      </main>
    );
  }

  const cantidad = items.length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 pb-32 md:py-10 lg:pb-12">
      <h1 className="font-display text-4xl font-bold leading-none text-ink md:text-5xl">Su carrito</h1>
      <p className={"mt-3 " + ETIQUETA}>
        {cantidad} {cantidad === 1 ? "elemento" : "elementos"} · Cotización con un asesor
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <ul className="rounded-card border border-linea bg-card">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <m.li
                key={item.key}
                layout
                exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                className="flex items-center gap-4 border-b border-dashed border-linea-fuerte p-4 last:border-b-0"
              >
                <Link
                  href={item.href}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-media bg-sand-2"
                >
                  {item.fotoUrl ? <Image src={item.fotoUrl} alt="" fill sizes="80px" className="object-cover" /> : null}
                </Link>
                <div className="min-w-0 flex-1">
                  {item.destino ? <p className={"truncate " + ETIQUETA}>{item.destino}</p> : null}
                  <Link
                    href={item.href}
                    className="mt-1 line-clamp-2 font-display text-lg font-bold leading-tight text-ink hover:text-acento"
                  >
                    {item.nombre}
                  </Link>
                  <p className="mt-1 font-mono text-sm font-bold tabular-nums text-ink">
                    <PrecioMostrado texto={item.precioLabel} />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => quitar(item.key)}
                  aria-label={`Quitar ${item.nombre} del carrito`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-sand-2 hover:text-peligro"
                >
                  <Icono nombre="basura" />
                </button>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>

        <form onSubmit={enviar} className="flex flex-col gap-5 rounded-card border border-linea bg-card p-6 lg:sticky lg:top-[calc(var(--offset-sticky,0px)+1.5rem)]">
          <div>
            <h2 className="font-display text-2xl font-bold leading-tight text-ink">Sus datos</h2>
            <p className="mt-1 text-sm text-ink-soft">Un asesor revisa lo que eligió y le responde por WhatsApp.</p>
          </div>
          <Campo etiqueta="Su nombre" requerido>
            {(a11y) => <Entrada {...a11y} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />}
          </Campo>
          <Campo etiqueta="Su WhatsApp" ayuda="Opcional.">
            {(a11y) => (
              <Entrada
                {...a11y}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            )}
          </Campo>
          <Campo etiqueta="Notas" ayuda="Opcional: fechas, cantidad de personas, dudas.">
            {(a11y) => <AreaTexto {...a11y} rows={3} value={nota} onChange={(e) => setNota(e.target.value)} />}
          </Campo>
          <div className="hidden lg:block">
            <Boton type="submit" tamano="lg" ancho cargando={enviando}>
              Enviar solicitud
            </Boton>
          </div>

          <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 border-t border-linea bg-card px-5 py-3 lg:hidden">
            <Boton type="submit" tamano="lg" ancho cargando={enviando}>
              Enviar solicitud
            </Boton>
          </div>
        </form>
      </div>
    </main>
  );
}
