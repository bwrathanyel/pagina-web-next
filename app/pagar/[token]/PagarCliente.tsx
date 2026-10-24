"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BotonWhatsapp, Confirmada, EstadoSimple, Verificando } from "@/components/pago/EstadosPago";
import { PagoPendiente } from "@/components/pago/PagoPendiente";
import { Boton } from "@/components/ui/Boton";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { registrarEvento } from "@/lib/analitica/eventos";
import { olvidarReservaAbierta } from "@/lib/checkout/reservaAbierta";
import { ERRORES_TRANSITORIOS, consultarEstado, type RespuestaEstado } from "@/lib/pago/pagar";

const REFRESCO_MS = 60_000;
const REFRESCO_HASTA_MS = 30 * 60_000;

/** Estados de una sola tarjeta (y los links de asesor): columna angosta aunque la página sea ancha. */
const Angosto = ({ children }: { children: ReactNode }) => <div className="mx-auto w-full max-w-lg">{children}</div>;

export function PagarCliente({ token }: { token: string }) {
  const [estado, setEstado] = useState<RespuestaEstado | null>(null);
  const vivo = useRef(true);
  const abierto = useRef(false);

  /** `silencioso`: refresco de fondo; no vuelve al esqueleto y, si la red falla, deja lo que ya se ve. */
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setEstado(null);
    const r = await consultarEstado(token);
    if (!vivo.current) return;
    if (silencioso && !r.ok && ERRORES_TRANSITORIOS.includes(r.error)) return;
    setEstado(r);
    if (r.ok && !abierto.current) {
      abierto.current = true;
      registrarEvento("abrir_pago", { meta: { estado: r.estado } });
    }
  }, [token]);

  useEffect(() => {
    vivo.current = true;
    void cargar();
    return () => { vivo.current = false; };
  }, [cargar]);

  const fase = estado?.ok ? estado.estado : null;

  // Cuando el pago deja de estar pendiente, /reservar ya no ofrece «Continuar al pago».
  useEffect(() => {
    if (fase && fase !== "emitido") olvidarReservaAbierta(token);
  }, [fase, token]);

  // Verificando: se consulta sola cada minuto con la pestaña a la vista y al volver a ella, hasta 30 min.
  useEffect(() => {
    if (fase !== "pendiente_verificacion") return;
    const inicio = Date.now();
    const tocar = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - inicio > REFRESCO_HASTA_MS) { window.clearInterval(t); return; }
      void cargar(true);
    };
    const t = window.setInterval(tocar, REFRESCO_MS);
    document.addEventListener("visibilitychange", tocar);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", tocar);
    };
  }, [fase, cargar]);

  // Aviso enviado: se muestra «verificando» al instante y se confirma con el servidor por detrás.
  const alDeclarar = useCallback(() => {
    setEstado((prev) =>
      prev?.ok
        ? {
            ...prev,
            estado: "pendiente_verificacion",
            reserva: prev.reserva ? { ...prev.reserva, declarado_en: prev.reserva.declarado_en ?? new Date().toISOString() } : prev.reserva,
          }
        : prev,
    );
    void cargar(true);
  }, [cargar]);
  const alVencer = useCallback(() => void cargar(true), [cargar]);

  if (!estado) {
    return (
      <div aria-busy="true" className="mx-auto flex w-full max-w-lg flex-col gap-4 lg:max-w-none">
        <span className="sr-only">Cargando el pago…</span>
        <Esqueleto className="h-9 w-2/3" />
        <Esqueleto className="h-8 w-48 rounded-pill" />
        <Esqueleto className="h-72 rounded-card lg:w-2/3" />
        <Esqueleto className="h-12 lg:w-2/3" />
      </div>
    );
  }

  if (!estado.ok) {
    if (ERRORES_TRANSITORIOS.includes(estado.error)) {
      return (
        <Angosto>
          <EstadoSimple
            titulo="No pudimos cargar su pago"
            texto="Revise su conexión e inténtelo de nuevo."
            accion={<Boton type="button" variante="secundario" tamano="lg" ancho onClick={() => void cargar()}>Reintentar</Boton>}
          />
        </Angosto>
      );
    }
    return (
      <Angosto>
        <EstadoSimple tono="malo" titulo="Link no válido" texto="Este link de pago no existe o ya no está disponible. Pídale a su asesor uno nuevo." />
      </Angosto>
    );
  }

  // Compra directa en la web: no hay asesor de por medio, así que los mensajes hablan de la reserva y,
  // cuando algo no sale, el siguiente paso es WhatsApp con el código de la reserva a la mano.
  const web = estado.origen === "web" ? estado.reserva ?? null : null;

  switch (estado.estado) {
    case "emitido":
      // El hotel cerró cupo (stop sale del CRM) después de crear la reserva: no se muestra cómo pagar.
      if (web?.disponibilidad === "sin_cupo") {
        return (
          <Angosto>
            <EstadoSimple
              tono="malo"
              titulo="El hotel ya no tiene cupo en esas fechas"
              texto={
                <>
                  Para la reserva <span className="font-mono font-bold text-ink">{web.codigo}</span> el hotel cerró la
                  disponibilidad. No haga el pago: escríbanos y le ofrecemos otras fechas u otro hotel.
                </>
              }
              accion={<BotonWhatsapp codigo={web.codigo} motivo="El hotel ya no tiene cupo en mis fechas." />}
            />
          </Angosto>
        );
      }
      return <PagoPendiente pago={estado} token={token} onDeclarado={alDeclarar} onVencer={alVencer} />;
    case "pendiente_verificacion":
      return web ? (
        <Angosto><Verificando reserva={web} /></Angosto>
      ) : (
        <Angosto>
          <EstadoSimple
            tono="ok"
            titulo="Recibimos su aviso de pago"
            texto="Estamos verificando el pago. Apenas quede confirmado, su asesor le avisa. No necesita hacer nada más."
          />
        </Angosto>
      );
    case "verificado":
      return web ? (
        <Angosto><Confirmada reserva={web} /></Angosto>
      ) : (
        <Angosto><EstadoSimple tono="ok" titulo="Pago confirmado" texto="Este pago ya fue verificado. Gracias." /></Angosto>
      );
    case "vencido":
      return (
        <Angosto>
          {web ? (
            <EstadoSimple
              tono="malo"
              titulo="Se acabó el tiempo para pagar"
              texto={
                <>
                  Liberamos el cupo de la reserva <span className="font-mono font-bold text-ink">{web.codigo}</span>. Si ya pagó,
                  escríbanos con su comprobante y su código: revisamos si el cupo sigue disponible.
                </>
              }
              accion={<BotonWhatsapp codigo={web.codigo} motivo="El tiempo para pagar venció." />}
            />
          ) : (
            <EstadoSimple tono="malo" titulo="El link venció" texto="Este link de pago expiró. Pídale a su asesor un link nuevo para completar el pago." />
          )}
        </Angosto>
      );
    case "rechazado":
      return (
        <Angosto>
          {web ? (
            <EstadoSimple
              tono="malo"
              titulo="No pudimos validar su pago"
              texto={
                <>
                  Revisamos el pago y no coincide con la reserva <span className="font-mono font-bold text-ink">{web.codigo}</span>.
                  Escríbanos para resolverlo.
                </>
              }
              accion={<BotonWhatsapp codigo={web.codigo} motivo="Mi pago fue rechazado." />}
            />
          ) : (
            <EstadoSimple tono="malo" titulo="Pago rechazado" texto="No pudimos validar este pago. Comuníquese con su asesor para resolverlo." />
          )}
        </Angosto>
      );
    default:
      return (
        <Angosto>
          <EstadoSimple titulo="Pago reembolsado" texto="Este pago fue reembolsado. Si tiene dudas, escríbale a su asesor." />
        </Angosto>
      );
  }
}
