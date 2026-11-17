"use client";

import { useCallback, useId, type RefObject } from "react";
import { TurnstileWidget } from "@/components/pago/TurnstileWidget";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { Icono } from "@/components/ui/Icono";
import type { RielPago } from "@/lib/pago/pagar";
import type { AvisoPagoEstado } from "./useAvisoPago";

const ETIQUETA_REFERENCIA: Partial<Record<RielPago, string>> = {
  zelle: "Número de confirmación",
  binance: "TxID o número de orden",
};

function peso(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Vista previa del comprobante elegido: miniatura si es imagen, ficha si es PDF. */
function Miniatura({ archivo }: { archivo: File }) {
  // Ref con limpieza (React 19): la URL blob vive lo que vive el <img> de este archivo.
  const conImagen = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;
      const u = URL.createObjectURL(archivo);
      img.src = u;
      return () => URL.revokeObjectURL(u);
    },
    [archivo],
  );
  if (!archivo.type.startsWith("image/")) {
    return (
      <span aria-hidden="true" className="flex h-16 w-14 shrink-0 items-center justify-center rounded-control bg-sand-2 font-mono text-xs font-bold text-ink-soft">
        PDF
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="block h-16 w-14 shrink-0 overflow-hidden rounded-control bg-sand-2 ring-1 ring-linea">
      {/* eslint-disable-next-line @next/next/no-img-element -- blob: local, next/image no aplica */}
      <img ref={conImagen} alt="" className="size-full object-cover object-top" />
    </span>
  );
}

/** Zona del comprobante: sin archivo, un botón grande para subirlo; con archivo, la vista previa con Cambiar y Quitar. */
function ZonaComprobante({ aviso }: { aviso: AvisoPagoEstado }) {
  const id = useId();
  const ayudaId = `${id}-ayuda`;
  const { archivo, procesando, achicado } = aviso;
  const input = (
    <input
      id={id}
      type="file"
      accept=".pdf,.jpg,.jpeg,.png,.webp"
      aria-describedby={ayudaId}
      className="sr-only"
      onChange={(e) => {
        const f = e.target.files?.[0] ?? null;
        e.target.value = ""; // elegir el mismo archivo otra vez también dispara onChange
        void aviso.elegirArchivo(f);
      }}
    />
  );
  const anillo = "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-acento";

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-semibold text-ink">Captura del pago</p>
      {archivo && !procesando ? (
        <div className="flex items-center gap-3 rounded-control border border-linea bg-sand-2/40 p-2.5">
          <Miniatura archivo={archivo} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{archivo.name}</p>
            <p className="text-xs text-ink-soft">
              {peso(archivo.size)}
              {achicado ? " · reducida para enviarla más rápido" : ""}
            </p>
          </div>
          <label htmlFor={id} className={`inline-flex min-h-11 cursor-pointer items-center rounded-control px-3 text-sm font-semibold text-ink hover:bg-sand-2 ${anillo}`}>
            Cambiar
            {input}
          </label>
          <button
            type="button"
            onClick={aviso.quitarArchivo}
            aria-label="Quitar la captura"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-soft hover:bg-sand-2 hover:text-ink"
          >
            <Icono nombre="cerrar" tamano={18} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          aria-busy={procesando || undefined}
          className={
            "flex min-h-16 cursor-pointer items-center gap-3 rounded-control border border-dashed border-linea-fuerte bg-card px-4 py-3 " +
            "transition-colors duration-150 ease-salida hover:border-ink/35 hover:bg-sand-2/40 " + anillo
          }
        >
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-sand-2 text-ink">
            <Icono nombre={procesando ? "destello" : "clip"} tamano={18} className={procesando ? "animate-pulse motion-reduce:animate-none" : ""} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{procesando ? "Preparando la captura…" : "Subir captura o PDF"}</span>
            <span className="block text-xs text-ink-soft">Desde la galería o los archivos del teléfono</span>
          </span>
          {input}
        </label>
      )}
      <p id={ayudaId} className="text-sm text-ink-soft">
        Recomendada: acelera la verificación. Las fotos se reducen solas; el PDF, hasta 5 MB.
      </p>
    </div>
  );
}

/** «¿Ya pagó? Avísenos»: referencia, captura y Turnstile. */
export function AvisoPago({
  aviso, riel, formRef,
}: {
  aviso: AvisoPagoEstado;
  riel: RielPago;
  formRef: RefObject<HTMLFormElement | null>;
}) {
  return (
    <form
      ref={formRef}
      id="avisar"
      onSubmit={aviso.alEnviar}
      noValidate
      className="flex scroll-mt-20 flex-col gap-4 rounded-card border border-linea bg-card p-5"
    >
      <h2 className="font-display text-2xl font-bold leading-tight text-ink">¿Ya pagó? Avísenos</h2>
      {aviso.restaurado ? <p className="-mt-2 text-sm text-ink-soft">Recuperamos lo que había cargado.</p> : null}
      <Campo etiqueta={ETIQUETA_REFERENCIA[riel] ?? "Número de referencia"} requerido error={aviso.errorReferencia}>
        {(a11y) => (
          <Entrada
            {...a11y}
            ref={aviso.refInput}
            value={aviso.referencia}
            onChange={(e) => aviso.setReferencia(e.target.value)}
            placeholder="Ej: 001234567890"
            // Pago Móvil da referencias numéricas; Zelle y el TxID de Binance llevan letras.
            inputMode={riel === "pago_movil" || riel === "c2p" ? "numeric" : "text"}
            autoCapitalize="characters"
            spellCheck={false}
            autoComplete="off"
            className="font-mono tabular-nums"
          />
        )}
      </Campo>

      <ZonaComprobante aviso={aviso} />

      <TurnstileWidget key={aviso.turnstileVuelta} onToken={aviso.recibirTurnstile} />

      {aviso.error ? <Aviso>{aviso.error}</Aviso> : null}

      <Boton type="submit" tamano="lg" ancho cargando={aviso.enviando || aviso.esperandoToken} disabled={aviso.procesando}>
        {aviso.esperandoToken ? "Verificando seguridad…" : aviso.enviando ? "Enviando…" : "Ya pagué"}
      </Boton>
      <p className="text-center text-sm text-ink-soft">
        Verificamos cada pago a mano. Nunca le pediremos claves ni datos de tarjeta.
      </p>
    </form>
  );
}
