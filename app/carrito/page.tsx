"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCarritoStore } from "@/lib/carrito/store";
import { armarCarrito } from "@/lib/leads/buildCarrito";
import { elegirAsesor } from "@/lib/asesores";
import { enviarACRM } from "@/lib/leads/ingestWebLead";
import { enviarASheetMonkey } from "@/lib/leads/sheetMonkey";
import { detectarProcedencia, esInstagramInApp } from "@/lib/utils/procedencia";

export default function CarritoPage() {
  const { items, quitar, limpiar } = useCarritoStore();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const [waHref, setWaHref] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    const resultado = armarCarrito(items, nombre, telefono, nota);
    const asesor = elegirAsesor();

    enviarASheetMonkey({
      destino: resultado.destino,
      servicio: resultado.servicio,
      pagina: "Carrito",
      nombre,
      procedencia: detectarProcedencia(),
      telefono,
      asesor: asesor.telefono,
    });
    enviarACRM({
      nombre,
      telefono,
      destino: resultado.destino,
      personas: resultado.personas,
      consulta: resultado.consulta,
    });

    const mensaje = esInstagramInApp() ? resultado.mensajeTexto : resultado.mensajeEmoji;
    setWaHref(`https://wa.me/${asesor.telefono}?text=${encodeURIComponent(mensaje)}`);
    limpiar();
  }

  if (waHref) {
    return (
      <main className="mx-auto max-w-md px-5 py-12 text-center">
        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <p className="mb-2 font-display text-2xl font-semibold text-ink">¡Listo!</p>
          <p className="mb-5 text-ink-soft">
            Armamos tu solicitud con todo lo del carrito. Envíala por WhatsApp y un asesor te
            responde.
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-whatsapp px-6 font-semibold text-white"
          >
            Enviar a un asesor
          </a>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md px-5 py-12 text-center">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Tu carrito</h1>
        <p className="mb-6 text-ink-soft">Está vacío. Agregá hoteles, tours o promociones desde el catálogo.</p>
        <Link
          href="/catalogo/promociones"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold px-6 font-semibold text-btn-ink"
        >
          Ver promociones
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Tu carrito</h1>

      <ul className="mb-8 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center gap-3 rounded-xl border border-ink/10 bg-card p-3"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-sand-2">
              {item.fotoUrl ? (
                <Image src={item.fotoUrl} alt={item.nombre} fill sizes="64px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{item.nombre}</p>
              {item.destino ? <p className="truncate text-sm text-ink-soft">{item.destino}</p> : null}
              <p className="font-mono text-sm text-ink-soft">{item.precioLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => quitar(item.key)}
              aria-label={`Quitar ${item.nombre} del carrito`}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-soft"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-card p-6">
        <p className="text-sm text-ink-soft">
          Ya elegiste qué te interesa — solo faltan tus datos para que un asesor te contacte.
        </p>
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-sm font-semibold text-ink">
            Tu nombre <span className="text-coral">*</span>
          </label>
          <input
            id="nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink"
          />
        </div>
        <div>
          <label htmlFor="telefono" className="mb-1.5 block text-sm font-semibold text-ink">
            WhatsApp <span className="text-coral">*</span>
          </label>
          <input
            id="telefono"
            type="tel"
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink"
          />
        </div>
        <div>
          <label htmlFor="nota" className="mb-1.5 block text-sm font-semibold text-ink">
            Notas (opcional)
          </label>
          <textarea
            id="nota"
            rows={2}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="min-h-11 rounded-full bg-gradient-to-br from-coral to-gold px-4 font-semibold text-btn-ink disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </button>
      </form>
    </main>
  );
}
