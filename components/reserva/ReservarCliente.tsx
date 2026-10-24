"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CLAVE_RESERVA_ABIERTA } from "@/lib/checkout/reservaAbierta";
import { Pasos } from "@/components/checkout/Pasos";
import { useCheckoutConfig } from "@/components/checkout/useCheckoutConfig";
import { useEsEscritorio } from "@/components/checkout/useEsEscritorio";
import { TurnstileWidget } from "@/components/pago/TurnstileWidget";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { TelefonoPais } from "@/components/ui/TelefonoPais";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { registrarEvento } from "@/lib/analitica/eventos";
import {
  calcularHospedaje, RIELES, validarContacto,
  type BloqueoFecha, type HotelParaCobrar, type ResultadoHospedaje, type Riel,
} from "@/lib/checkout/calculo";
import { ERROR_CAMPO, horaAmPm, mensajeReserva, plazoRestante, rangoFechas, usd } from "@/lib/checkout/formato";
import { bloqueosEnFechas, habitacionDeTarifa, type HabitacionWeb } from "@/lib/cotizador/hotel";
import { hoyCaracas } from "@/lib/cotizador/cotizacionRapida";
import { nochesDeEstadia, tarjetasPorHabitacion } from "@/lib/cotizador/estimado";
import { buscarPais, PAIS_POR_DEFECTO, telefonoInternacional } from "@/lib/paises";
import { whatsappHref } from "@/lib/whatsapp";
import type { Tarifa } from "@/types/supabase";
import { detalleRiel, OpcionesHabitacion, OpcionesRiel, type OpcionHabitacion } from "./Opciones";
import { PaseFechas, ROTULO, textoViajeros, type Pasajeros } from "./PaseFechas";
import { PoliticaPlegable } from "./PoliticaPlegable";
import { BarraTotalMovil, ResumenBoleto, type Totales } from "./ResumenBoleto";

// Pantalla de compra directa de hospedaje (Plan 1, rediseño F2). El total que se ve acá es
// informativo: el Worker (/api/checkout) lo recalcula desde la base y, si difiere, responde
// `precio_cambio` con el precio real. El pago va antes que los datos personales: el precio
// queda final antes de pedirle nada al cliente.

const NOMBRE_RIEL: Record<Riel, string> = { zelle: "Zelle", pago_movil: "Pago Móvil", binance: "Binance" };

/** Firma corta del carrito: la clave de idempotencia cambia si el cliente cambia algo, así un reintento
 * idéntico devuelve la misma reserva y un carrito distinto nunca reutiliza una reserva vieja. */
function firma(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

interface Formulario {
  desde: string;
  hasta: string;
  tarifaId: number | null;
  pasajeros: Pasajeros;
  riel: Riel | "";
  nombre: string;
  iso: string;
  telefono: string;
  email: string;
}

// Borrador por hotel en sessionStorage: «atrás» o recargar no borran lo escrito, y la base de la
// clave de idempotencia sobrevive (no se borra tras el éxito), así reenviar el mismo carrito
// devuelve la misma reserva en vez de crear otra.
const claveBorrador = (hotelId: number) => `lotus-reservar:${hotelId}`;
const CLAVE_ABIERTA = CLAVE_RESERVA_ABIERTA;

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);

function leerBorrador(hotelId: number): { form: Partial<Formulario>; base?: string } | null {
  try {
    const g = JSON.parse(sessionStorage.getItem(claveBorrador(hotelId)) ?? "null") as Record<string, unknown> | null;
    if (!g || typeof g !== "object") return null;
    const form: Partial<Formulario> = {};
    const fecha = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
    if (fecha(g.desde)) form.desde = fecha(g.desde);
    if (fecha(g.hasta) !== undefined || g.hasta === "") form.hasta = fecha(g.hasta) ?? "";
    if (typeof g.tarifaId === "number") form.tarifaId = g.tarifaId;
    const p = g.pasajeros as Pasajeros | undefined;
    if (p && Number.isInteger(p.adultos) && Number.isInteger(p.bebes) && Array.isArray(p.edades)) {
      form.pasajeros = { adultos: p.adultos, bebes: p.bebes, edades: p.edades.map((e) => (Number.isInteger(e) ? e : null)) };
    }
    if ((RIELES as readonly string[]).includes(String(g.riel))) form.riel = g.riel as Riel;
    form.nombre = texto(g.nombre, 80);
    form.iso = texto(g.iso, 4);
    form.telefono = texto(g.telefono, 30);
    form.email = texto(g.email, 120);
    for (const k of Object.keys(form) as (keyof Formulario)[]) if (form[k] === undefined) delete form[k];
    return { form, base: typeof g.base === "string" && /^[a-z0-9]{8,32}$/.test(g.base) ? g.base : undefined };
  } catch {
    return null;
  }
}

interface ReservaAbierta {
  token: string;
  codigo: string;
  expira_en: string;
  hotel: string;
}

function leerAbierta(): ReservaAbierta | null {
  try {
    const r = JSON.parse(localStorage.getItem(CLAVE_ABIERTA) ?? "null") as ReservaAbierta | null;
    if (!r || typeof r.token !== "string" || !(Date.parse(r.expira_en) > Date.now())) return null;
    return r;
  } catch {
    return null;
  }
}

// Validación por campo con la MISMA regla que el servidor (validarContacto): lo que pasa aquí no rebota allá.
const CONTACTO_OK = { nombre: "Ana Pérez", telefono: "+584141234567", email: "a@b.co", riel: "zelle" };
const invalido = (c: Partial<typeof CONTACTO_OK>) => validarContacto({ ...CONTACTO_OK, ...c }) !== null;

/** `habitacion` puede venir vacío en tarifas cargadas a mano: el nombre queda en el título, con el hotel delante. */
function nombreDeHabitacion(t: Tarifa, hotel: string): string {
  const propio = t.habitacion?.trim();
  if (propio) return propio;
  const titulo = (t.titulo ?? "").trim();
  const sinHotel = titulo.toLowerCase().startsWith(hotel.toLowerCase()) ? titulo.slice(hotel.length).replace(/^\s*[-–—:]\s*/, "") : titulo;
  return sinHotel.trim() || "Habitación";
}

type ClaveCampo ="fechas" | "edades" | "precio" | "riel" | "nombre" | "telefono" | "email" | "acepta";

export function ReservarCliente({
  hotel,
  destino,
  foto,
  habitaciones,
  fotosHotel,
  inicial,
  politica,
}: {
  hotel: HotelParaCobrar;
  destino: string | null;
  foto: string | null;
  habitaciones: HabitacionWeb[];
  fotosHotel: string[];
  inicial: { tarifaId: number | null; desde: string; hasta: string; pasajeros: Pasajeros | null };
  politica: string[];
}) {
  const router = useRouter();
  const hoy = hoyCaracas();
  const esEscritorio = useEsEscritorio();
  const { config, reintentar } = useCheckoutConfig();

  const [f, setF] = useState<Formulario>({
    desde: inicial.desde,
    hasta: inicial.hasta,
    tarifaId: inicial.tarifaId,
    pasajeros: inicial.pasajeros ?? { adultos: 2, edades: [], bebes: 0 },
    riel: "",
    nombre: "",
    iso: PAIS_POR_DEFECTO,
    telefono: "",
    email: "",
  });
  const poner = useCallback((p: Partial<Formulario>) => setF((prev) => ({ ...prev, ...p })), []);
  const [base, setBase] = useState(() => crypto.randomUUID().replace(/-/g, "").slice(0, 24));
  const [acepta, setAcepta] = useState(false);
  const [hojaViajeros, setHojaViajeros] = useState(false);
  const [abierta, setAbierta] = useState<ReservaAbierta | null>(null);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Cada token de Turnstile sirve una sola vez: tras un envío fallido se remonta el widget para pedir otro.
  const [turnstileVuelta, setTurnstileVuelta] = useState(0);
  const [esperaToken, setEsperaToken] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<{ tono: "error" | "info"; texto: string } | null>(null);
  const [ajuste, setAjuste] = useState<{ clave: string; precio: number } | null>(null);
  const [bloqueosCargados, setBloqueosCargados] = useState<{ clave: string; lista: BloqueoFecha[] }>({ clave: "", lista: [] });

  // Borrador: se lee una vez al montar (la URL manda en fechas, habitación y viajeros) y se guarda en cada cambio.
  const restaurado = useRef(false);
  // Por texto: un objeto nuevo en cada render volvería a correr el efecto y pisaría lo que el cliente cambió.
  const pasajerosUrl = inicial.pasajeros ? JSON.stringify(inicial.pasajeros) : "";
  useEffect(() => {
    const g = leerBorrador(hotel.id);
    if (g) {
      setF((prev) => ({
        ...prev,
        ...g.form,
        ...(inicial.desde ? { desde: inicial.desde, hasta: inicial.hasta } : {}),
        ...(inicial.tarifaId ? { tarifaId: inicial.tarifaId } : {}),
        ...(pasajerosUrl ? { pasajeros: JSON.parse(pasajerosUrl) as Pasajeros } : {}),
      }));
      if (g.base) setBase(g.base);
    }
    setAbierta(leerAbierta());
    restaurado.current = true;
  }, [hotel.id, inicial.desde, inicial.hasta, inicial.tarifaId, pasajerosUrl]);
  useEffect(() => {
    if (!restaurado.current) return;
    try {
      sessionStorage.setItem(claveBorrador(hotel.id), JSON.stringify({ ...f, base }));
    } catch {
      /* sin almacenamiento (modo privado): el formulario sigue funcionando */
    }
  }, [f, base, hotel.id]);

  const { desde, hasta, pasajeros, riel } = f;
  const hayFechas = Boolean(desde && hasta && hasta > desde);
  const edades = pasajeros.edades;
  const edadesListas = edades.every((e) => e !== null);

  const claveFechas = hayFechas ? `${desde}|${hasta}` : "";
  useEffect(() => {
    if (!claveFechas) return;
    let vivo = true;
    bloqueosEnFechas([hotel.id], desde, hasta)
      .then((m) => vivo && setBloqueosCargados({ clave: claveFechas, lista: m.get(hotel.id) ?? [] }))
      .catch(() => vivo && setBloqueosCargados({ clave: claveFechas, lista: [] })); // el Worker vuelve a validar la disponibilidad
    return () => { vivo = false; };
  }, [hotel.id, desde, hasta, claveFechas]);
  const bloqueos = useMemo(
    () => (bloqueosCargados.clave === claveFechas ? bloqueosCargados.lista : []),
    [bloqueosCargados, claveFechas],
  );

  // Una opción por habitación (con sus temporadas); la tarifa elegida es la que cubre la entrada.
  const tarjetas = useMemo(() => tarjetasPorHabitacion(hotel.tarifas, desde), [hotel.tarifas, desde]);
  const elegida = tarjetas.find((c) => c.filas.some((x) => x.id === f.tarifaId)) ?? tarjetas[0];
  const tarifaEfectiva = elegida?.tarifa.id ?? null;

  // Cada habitación muestra el total de SU estadía (nunca por noche), con el mismo cálculo que se cobra.
  const resultados = useMemo(() => {
    const m = new Map<number, ResultadoHospedaje>();
    if (!hayFechas || !edadesListas) return m;
    for (const c of tarjetas) {
      m.set(
        c.tarifa.id,
        calcularHospedaje(
          hotel,
          { productoId: hotel.id, tarifaId: c.tarifa.id, desde, hasta, adultos: pasajeros.adultos, edades: edades as number[], bebes: pasajeros.bebes },
          bloqueos,
        ),
      );
    }
    return m;
  }, [hotel, tarjetas, hayFechas, edadesListas, desde, hasta, pasajeros.adultos, pasajeros.bebes, edades, bloqueos]);
  const calculo = tarifaEfectiva ? (resultados.get(tarifaEfectiva) ?? null) : null;

  const opciones: OpcionHabitacion[] = tarjetas.map((c) => {
    const r = resultados.get(c.tarifa.id);
    const ficha = habitacionDeTarifa(habitaciones, c.tarifa);
    return {
      id: c.tarifa.id,
      titulo: nombreDeHabitacion(c.tarifa, hotel.nombre),
      plan: c.tarifa.plan?.trim() || null,
      fotos: ficha?.fotos.length ? ficha.fotos : fotosHotel,
      detalles: [
        ficha?.camas,
        ficha?.metros2 ? `${Number(ficha.metros2)} m²` : null,
        ficha?.capacidad_max ? `Hasta ${ficha.capacidad_max} personas` : null,
        ficha?.vista,
      ].filter((x): x is string => !!x),
      descripcion: ficha?.descripcion?.trim() || c.tarifa.resumen_ia?.trim() || null,
      precio: r?.ok ? r.precio : null,
      nota: r && !r.ok ? (r.error === "sin_disponibilidad" ? "Sin cupo" : "A consultar") : null,
    };
  });

  // El precio que fijó el servidor vale solo para ESTE carrito: si el cliente cambia algo, se descarta.
  const claveSel = JSON.stringify([tarifaEfectiva, desde, hasta, pasajeros]);
  const precioServidor = ajuste && ajuste.clave === claveSel ? ajuste.precio : null;
  const precio = precioServidor ?? (calculo?.ok ? calculo.precio : null);
  const feePct = config?.fee_pct ?? 0;
  const igtfPct = config?.igtf_pct ?? 0;
  const fee = precio !== null && feePct > 0 ? Math.round(precio * feePct) / 100 : 0;
  // IGTF: solo en pagos en divisas (Zelle, Binance), sobre el total ya con cargo; el servidor lo recalcula igual.
  const igtf = precio !== null && igtfPct > 0 && (riel === "zelle" || riel === "binance") ? Math.round((precio + fee) * igtfPct) / 100 : 0;
  const tasa = calculo?.ok ? calculo.tasa : null;
  const noches = calculo?.ok ? calculo.noches : hayFechas ? nochesDeEstadia(desde, hasta).length : null;

  const totales: Totales | null =
    precio !== null
      ? {
          precio, fee, feePct, igtf, igtfPct, total: precio + fee + igtf, riel, tasa,
          noches: noches ?? 0,
          lineas: calculo?.ok ? calculo.lineas : [],
          // El IGTF ya tiene su fila en el desglose (con el % de la config, que es el que cobra el servidor).
          avisos: calculo?.ok ? calculo.avisos.filter((a) => !/IGTF/.test(a)) : [],
          actualizado: precioServidor !== null,
        }
      : null;
  const sinPrecio = !hayFechas
    ? "Elija las fechas"
    : !edadesListas
      ? "Elija la edad de los niños"
      : calculo && !calculo.ok
        ? "Sin precio para esas fechas"
        : "Calculando…";

  const telefonoE164 = telefonoInternacional(buscarPais(f.iso), f.telefono);
  const errores: Record<ClaveCampo, string | null> = {
    fechas: hayFechas ? null : ERROR_CAMPO.fechas,
    edades: edadesListas ? null : "Elija la edad de cada niño.",
    precio:
      !hayFechas || !edadesListas || precio !== null ? null
      : calculo && !calculo.ok ? mensajeReserva(calculo.error, calculo.texto)
      : !tarifaEfectiva ? "Este hotel no tiene habitaciones para compra directa. Escríbanos y le ayudamos."
      : null,
    riel: riel ? null : ERROR_CAMPO.riel,
    nombre: invalido({ nombre: f.nombre }) ? ERROR_CAMPO.nombre : null,
    telefono: !telefonoE164 || invalido({ telefono: telefonoE164 }) ? ERROR_CAMPO.telefono : null,
    email: invalido({ email: f.email }) ? ERROR_CAMPO.email : null,
    acepta: acepta ? null : ERROR_CAMPO.acepta,
  };
  const ORDEN: ClaveCampo[] = ["fechas", "edades", "precio", "riel", "nombre", "telefono", "email", "acepta"];
  const primerError = ORDEN.find((k) => errores[k]) ?? null;
  const falta =
    primerError === "fechas" ? "Falta: fechas"
    : primerError === "edades" ? "Falta: la edad de los niños"
    : primerError === "precio" ? "Pruebe otras fechas"
    : primerError === "riel" ? "Falta: forma de pago"
    : primerError === "acepta" ? "Falta: aceptar la política"
    : primerError ? "Falta: sus datos"
    : null;
  const errorDe = (k: ClaveCampo) => (mostrarErrores ? errores[k] : null);

  const fueraDeHorario = Boolean(config?.activo && config.abierto === false);
  const habitacion = elegida?.tarifa.habitacion?.trim() || null;
  const mensajeWhatsApp = [
    `Hola, quiero reservar en ${hotel.nombre}`,
    habitacion ? ` (${habitacion})` : "",
    hayFechas ? `, del ${rangoFechas(desde, hasta)}` : "",
    `, ${textoViajeros(pasajeros)}`,
    riel ? `, pago por ${NOMBRE_RIEL[riel]}` : "",
    ".",
  ].join("");
  const wa = (motivo: string) => ({
    href: whatsappHref(mensajeWhatsApp),
    onClick: () => registrarEvento("click_whatsapp", { ruta: "/reservar", meta: { origen: "reservar", motivo, producto_id: hotel.id } }),
  });

  function enfocar(clave: ClaveCampo | "error") {
    if (clave === "edades" && !esEscritorio) {
      setHojaViajeros(true);
      return;
    }
    const nodo = Array.from(document.querySelectorAll<HTMLElement>(`[data-campo="${clave}"]`)).find((n) => n.getClientRects().length > 0);
    if (!nodo) return;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nodo.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "center" });
    const control =
      clave === "fechas" && desde
        ? document.getElementById("r-hasta")
        : nodo.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea, button");
    control?.focus({ preventScroll: true });
  }

  const recibirTurnstile = useCallback((t: string | null) => setTurnstileToken(t), []);

  async function crear(token: string) {
    if (precio === null || !riel) return;
    setEnviando(true);
    setError(null);
    const telefono = telefonoE164 ?? f.telefono.trim();
    const email = f.email.trim();
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: hotel.id,
          tarifa_id: tarifaEfectiva,
          desde, hasta,
          adultos: pasajeros.adultos, edades, bebes: pasajeros.bebes,
          nombre: f.nombre.trim(), telefono, email,
          riel,
          acepta_terminos: true,
          idempotency_key: `w_${base}_${firma(JSON.stringify([tarifaEfectiva, desde, hasta, pasajeros.adultos, edades, pasajeros.bebes, riel, email.toLowerCase(), telefono.replace(/\D/g, "")]))}`,
          total_mostrado: precio,
          turnstile_token: token,
        }),
      });
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (data?.ok === true && typeof data.token === "string") {
        try {
          localStorage.setItem(
            CLAVE_ABIERTA,
            JSON.stringify({ token: data.token, codigo: String(data.codigo ?? ""), expira_en: String(data.expira_en ?? ""), hotel: hotel.nombre }),
          );
        } catch {
          /* sin almacenamiento: el link igual queda en la barra del navegador */
        }
        registrarEvento("abrir_pago", { ruta: "/reservar", meta: { etapa: "reserva_creada", producto_id: hotel.id, riel, tasa } });
        // replace: «atrás» desde /pagar vuelve a la ficha, no a un formulario que crearía otra reserva.
        router.replace(`/pagar/${data.token}`);
        return; // el botón sigue «cargando» mientras navega
      }
      if (data?.error === "precio_cambio" && typeof data.precio === "number") {
        setAjuste({ clave: claveSel, precio: data.precio });
        setError({ tono: "info", texto: `El precio se actualizó a ${usd(data.precio)} según el tarifario vigente. Revise el total y toque «Reservar y pagar» de nuevo.` });
      } else {
        const codigo = data?.error as string | undefined;
        if (codigo === "fuera_de_horario" || codigo === "checkout_desactivado") reintentar();
        setError({ tono: "error", texto: mensajeReserva(codigo, data?.texto as string | undefined) });
      }
    } catch {
      setError({ tono: "error", texto: "No pudimos conectar con el servidor. Sus datos siguen aquí: inténtelo de nuevo en un momento." });
    }
    setTurnstileToken(null); // el token de Turnstile es de un solo uso
    setTurnstileVuelta((v) => v + 1);
    setEnviando(false);
  }

  // Botón tocado antes de que Turnstile entregue el token: se envía solo cuando llega.
  const crearRef = useRef(crear);
  useEffect(() => {
    crearRef.current = crear;
  });
  useEffect(() => {
    if (!esperaToken || !turnstileToken || enviando) return;
    setEsperaToken(false);
    void crearRef.current(turnstileToken);
  }, [esperaToken, turnstileToken, enviando]);

  // Si Turnstile pide la casilla, el token no llega solo: tras un instante se avisa qué falta (sin parpadeo si llega rápido).
  const [pedirTurnstile, setPedirTurnstile] = useState(false);
  useEffect(() => {
    if (!esperaToken || turnstileToken) return;
    const t = setTimeout(() => setPedirTurnstile(true), 1200);
    return () => clearTimeout(t);
  }, [esperaToken, turnstileToken]);
  const avisoTurnstile = pedirTurnstile && esperaToken && !turnstileToken;

  // Al fallar, el aviso queda al final de la columna en el teléfono: se lleva a la vista.
  useEffect(() => {
    if (error && !esEscritorio) document.querySelector('[data-campo="error"]')?.scrollIntoView({ block: "center" });
  }, [error, esEscritorio]);

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando || !config?.activo || fueraDeHorario) return;
    // El botón nunca está deshabilitado en silencio: marca los errores y lleva al primero.
    if (primerError) {
      setMostrarErrores(true);
      enfocar(primerError);
      return;
    }
    if (!turnstileToken) {
      setEsperaToken(true);
      setPedirTurnstile(false);
      document.querySelector('[data-campo="turnstile"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    void crear(turnstileToken);
  }

  // ------------------------------------------------------------------ pantallas de salida
  if (config && (config.fallo || !config.activo)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-5">
        <h1 className="titulo-marca text-balance font-display text-3xl font-bold leading-tight text-ink">{hotel.nombre}</h1>
        <Aviso tono="info">
          {config.fallo
            ? "No pudimos cargar la compra directa. Revise su conexión e inténtelo de nuevo."
            : "La compra directa no está disponible por ahora. Un asesor le arma la reserva y le indica cómo pagar."}
        </Aviso>
        {config.fallo ? (
          <Boton type="button" variante="secundario" ancho onClick={reintentar}>
            Reintentar
          </Boton>
        ) : null}
        <Boton variante="whatsapp" ancho iconoInicio={<WhatsAppIcon size={20} />} {...wa("checkout_no_disponible")}>
          Escribirnos por WhatsApp
        </Boton>
        <Boton href={`/cotizar?hotel=${hotel.id}`} variante="secundario" ancho>
          Cotizar este hotel
        </Boton>
      </div>
    );
  }

  // ------------------------------------------------------------------ formulario
  const accion = (ancho: boolean) =>
    fueraDeHorario ? (
      <Boton variante="whatsapp" ancho={ancho} className={ancho ? "" : "shrink-0"} iconoInicio={<WhatsAppIcon size={18} />} {...wa("fuera_de_horario")}>
        Reservar por WhatsApp
      </Boton>
    ) : (
      <Boton type="submit" ancho={ancho} className={ancho ? "" : "shrink-0"} cargando={enviando || esperaToken || !config}>
        {esperaToken ? "Verificando seguridad…" : "Reservar y pagar"}
      </Boton>
    );

  const errorAcepta = errorDe("acepta");
  // Aceptación + Turnstile existen UNA sola vez: en el aside (escritorio) o al final de la columna (teléfono).
  const cierre = (
    <div className="flex flex-col gap-3">
      {error ? (
        <div data-campo="error">
          <Aviso tono={error.tono}>{error.texto}</Aviso>
        </div>
      ) : null}
      {fueraDeHorario ? null : (
        <>
          <div data-campo="acepta">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
                aria-invalid={errorAcepta ? true : undefined}
                aria-describedby={errorAcepta ? "r-acepta-error" : undefined}
                className="mt-0.5 h-5 w-5 shrink-0 accent-acento"
              />
              <span>
                Acepto los{" "}
                <a className="underline underline-offset-2" href="/terminos#compra-directa" target="_blank" rel="noopener">
                  términos de servicio
                </a>{" "}
                y la{" "}
                <a className="underline underline-offset-2" href="#politica">
                  política de cambios y cancelaciones
                </a>
                .
              </span>
            </label>
            {errorAcepta ? (
              <p id="r-acepta-error" role="alert" className="mt-1 text-sm font-medium text-peligro">
                {errorAcepta}
              </p>
            ) : null}
          </div>
          <div data-campo="turnstile" className="flex flex-col gap-1">
            <TurnstileWidget key={turnstileVuelta} onToken={recibirTurnstile} />
            {avisoTurnstile ? (
              <p role="alert" className="text-sm font-medium text-peligro">
                Complete la verificación de seguridad para continuar. La reserva se envía sola al terminar.
              </p>
            ) : null}
          </div>
          <p className="text-sm text-ink-soft">Aún no se le cobra nada: en el siguiente paso verá los datos para pagar.</p>
        </>
      )}
      {/* Escritorio: la acción va al final, después de aceptar y verificar; en el teléfono la lleva la barra fija. */}
      {esEscritorio ? accion(true) : null}
    </div>
  );

  const segundosAbierta = abierta ? Math.floor((Date.parse(abierta.expira_en) - Date.now()) / 1000) : 0;

  return (
    <form onSubmit={alEnviar} noValidate className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {foto ? (
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-control lg:hidden">
              <Image src={foto} alt="" fill sizes="48px" className="object-cover" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold leading-tight text-ink lg:titulo-marca lg:text-balance lg:text-4xl">{hotel.nombre}</h1>
            {destino ? <p className="text-sm text-ink-soft lg:hidden">{destino}</p> : null}
            <p className={ROTULO + " mt-2 hidden lg:block"}>
              {destino ? `${destino} · ` : ""}Paso 1 de 3
            </p>
          </div>
          <a
            {...wa("encabezado")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribirnos por WhatsApp"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white lg:hidden"
          >
            <WhatsAppIcon size={22} />
          </a>
        </div>
        <Pasos actual={1} className="lg:hidden" />
      </header>

      {abierta && segundosAbierta > 0 ? (
        <Aviso tono="info">
          <span className="block">
            Tiene la reserva <span className="font-mono font-bold">{abierta.codigo}</span>
            {abierta.hotel && abierta.hotel !== hotel.nombre ? ` (${abierta.hotel})` : ""} esperando pago (vence en{" "}
            {plazoRestante(segundosAbierta)}).
          </span>
          <Boton href={`/pagar/${abierta.token}`} variante="secundario" tamano="sm" className="mt-2">
            Continuar al pago
          </Boton>
        </Aviso>
      ) : null}

      {fueraDeHorario ? (
        <Aviso tono="info">
          La compra directa está abierta de {horaAmPm(config?.hora_abre, 8)} a {horaAmPm(config?.hora_cierra, 20)} (hora de
          Venezuela). Puede ver el precio aquí y reservar ahora por WhatsApp con un asesor.
        </Aviso>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start xl:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <PaseFechas
            desde={desde}
            hasta={hasta}
            hoy={hoy}
            noches={noches}
            onFechas={(d, h) => poner({ desde: d, hasta: h })}
            pasajeros={pasajeros}
            onPasajeros={(p) => poner({ pasajeros: p })}
            hojaAbierta={hojaViajeros}
            onHoja={setHojaViajeros}
            errorFechas={errores.fechas}
            mostrarErrores={mostrarErrores}
          />

          <div data-campo="precio" className="flex flex-col gap-3">
            <OpcionesHabitacion opciones={opciones} elegida={tarifaEfectiva} onElegir={(id) => poner({ tarifaId: id })} hayFechas={hayFechas} />
          </div>

          <OpcionesRiel
            riel={riel}
            onElegir={(r) => poner({ riel: r })}
            detalle={riel && config ? detalleRiel(riel, config, tasa) : null}
            error={errorDe("riel")}
          />

          <section aria-labelledby="r-datos" className="flex flex-col gap-4">
            <h2 id="r-datos" className="font-display text-xl font-bold text-ink">
              Sus datos
            </h2>
            <div data-campo="nombre">
              <Campo etiqueta="Nombre y apellido" error={errorDe("nombre")} requerido>
                {(a) => <Entrada {...a} value={f.nombre} onChange={(e) => poner({ nombre: e.target.value })} autoComplete="name" maxLength={80} />}
              </Campo>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div data-campo="telefono">
                <Campo etiqueta="Teléfono (WhatsApp)" error={errorDe("telefono")} requerido>
                  {(a) => (
                    <TelefonoPais {...a} iso={f.iso} onIso={(iso) => poner({ iso })} valor={f.telefono} onValor={(v) => poner({ telefono: v })} />
                  )}
                </Campo>
              </div>
              <div data-campo="email">
                <Campo etiqueta="Correo" ayuda="Aquí le enviamos el localizador." error={errorDe("email")} requerido>
                  {(a) => (
                    <Entrada
                      {...a}
                      type="email"
                      inputMode="email"
                      value={f.email}
                      onChange={(e) => poner({ email: e.target.value })}
                      autoComplete="email"
                      maxLength={120}
                    />
                  )}
                </Campo>
              </div>
            </div>
          </section>

          <PoliticaPlegable parrafos={politica} />
          {esEscritorio ? null : cierre}
        </div>

        <aside
          aria-label="Su reserva"
          className="hidden lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100dvh-7rem)] lg:flex-col lg:gap-4 lg:overflow-y-auto lg:overscroll-contain"
        >
          <ResumenBoleto
            datos={{ hotel: hotel.nombre, foto, habitacion, plan: elegida?.tarifa.plan?.trim() || null, desde, hasta, viajeros: textoViajeros(pasajeros) }}
            totales={totales}
            sinPrecio={sinPrecio}
          />
          {esEscritorio ? cierre : null}
        </aside>
      </div>

      <BarraTotalMovil totales={totales} sinPrecio={sinPrecio} falta={fueraDeHorario ? null : falta} accion={accion(false)} />
    </form>
  );
}
