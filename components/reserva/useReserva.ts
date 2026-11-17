"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CLAVE_RESERVA_ABIERTA } from "@/lib/checkout/reservaAbierta";
import { useCheckoutConfig } from "@/components/checkout/useCheckoutConfig";
import { useEsEscritorioConocido } from "@/components/checkout/useEsEscritorio";
import { useAuth } from "@/components/providers/AuthProvider";
import { registrarEvento } from "@/lib/analitica/eventos";
import {
  calcularHospedaje, RIELES, validarContacto,
  type BloqueoFecha, type HotelParaCobrar, type ResultadoHospedaje, type Riel,
} from "@/lib/checkout/calculo";
import { ERROR_CAMPO, mensajeReserva, rangoFechas, usd } from "@/lib/checkout/formato";
import { bloqueosEnFechas, habitacionDeTarifa, type HabitacionWeb } from "@/lib/cotizador/hotel";
import { calcularPlan } from "@/lib/checkout/plan";
import { PLAN_ABONOS_VERSION } from "@/lib/checkout/politica";
import { hoyCaracas } from "@/lib/cotizador/cotizacionRapida";
import { usePaneles } from "@/lib/layout/paneles";
import { nochesDeEstadia, tarjetasPorHabitacion } from "@/lib/cotizador/estimado";
import { buscarPais, PAIS_POR_DEFECTO, separarTelefono, telefonoInternacional } from "@/lib/paises";
import { whatsappHref } from "@/lib/whatsapp";
import { ORDEN_TRAMOS, siguienteTramo, tramosCompletos, type TramoId } from "@/lib/checkout/tramos";
import { comportamientoScroll } from "@/components/ui/movimiento";
import type { Tarifa } from "@/types/supabase";
import type { ModoPago, OpcionHabitacion } from "./Opciones";
import { textoViajeros, type Pasajeros } from "./PaseFechas";
import type { Totales } from "./ResumenBoleto";

// Estado y reglas de la compra directa de hospedaje (Plan 1, rediseño F2). El total que se ve es
// informativo: el Worker (/api/checkout) lo recalcula desde la base y, si difiere, responde
// `precio_cambio` con el precio real.

const NOMBRE_RIEL: Record<Riel, string> = { zelle: "Zelle", pago_movil: "Pago Móvil", binance: "Binance" };

const desdeFirma = (s: string) => Object.fromEntries(ORDEN_TRAMOS.map((t, i) => [t, s[i] === "1"])) as Record<TramoId, boolean>;

/** Firma corta del carrito: la clave de idempotencia cambia si el cliente cambia algo, así un reintento
 * idéntico devuelve la misma reserva y un carrito distinto nunca reutiliza una reserva vieja. */
function firma(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export interface Formulario {
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

export type ClaveCampo ="fechas" | "edades" | "precio" | "plan" | "riel" | "nombre" | "telefono" | "email" | "acepta";

export interface EntradaReserva {
  hotel: HotelParaCobrar;
  habitaciones: HabitacionWeb[];
  fotosHotel: string[];
  inicial: { tarifaId: number | null; desde: string; hasta: string; pasajeros: Pasajeros | null };
}

export type Reserva = ReturnType<typeof useReserva>;

export function useReserva({ hotel, habitaciones, fotosHotel, inicial }: EntradaReserva) {
  const router = useRouter();
  const hoy = hoyCaracas();
  const pantalla = useEsEscritorioConocido();
  const esEscritorio = pantalla === true;
  const { config, reintentar } = useCheckoutConfig();
  const { user } = useAuth();
  const abrirCuenta = usePaneles((s) => s.abrirCuenta);

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
  // Solo lo que toca la persona avanza de tramo: el borrador restaurado no mueve el scroll.
  const interactuo = useRef(false);
  const poner = useCallback((p: Partial<Formulario>) => {
    interactuo.current = true;
    setF((prev) => ({ ...prev, ...p }));
  }, []);
  // Por http:// (el navegador de Instagram abre el enlace de la bio así) no existe crypto.randomUUID;
  // getRandomValues sí está en contextos no seguros.
  const [base, setBase] = useState(() =>
    Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join(""),
  );
  const [acepta, setAcepta] = useState(false);
  const [modo, setModo] = useState<ModoPago>("total");
  const [aceptaPlan, setAceptaPlan] = useState(false);
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

  // Con sesión, nombre, correo y teléfono salen de la cuenta (solo si el borrador no los trae). El
  // teléfono viene internacional y se parte en país + número nacional, que es lo que pide el campo.
  const cuentaAplicada = useRef(false);
  const [deCuenta, setDeCuenta] = useState<string | null>(null);
  useEffect(() => {
    if (!user || cuentaAplicada.current) return;
    const t = setTimeout(() => {
      cuentaAplicada.current = true;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const nombre = ([meta.nombre, meta.full_name, meta.name].find((v): v is string => typeof v === "string" && !!v.trim()) ?? "").trim().slice(0, 80);
      const email = (user.email ?? "").trim().slice(0, 120);
      const tel = separarTelefono([user.phone, meta.telefono, meta.phone].find((v): v is string => typeof v === "string" && !!v.trim()) ?? "");
      if (!nombre && !email && !tel) return;
      setF((prev) => ({
        ...prev,
        nombre: prev.nombre.trim() ? prev.nombre : nombre,
        email: prev.email.trim() ? prev.email : email,
        ...(tel && !prev.telefono.trim() ? { iso: tel.iso, telefono: tel.numero } : {}),
      }));
      setDeCuenta(email || nombre || (tel ? `+${buscarPais(tel.iso).codigo} ${tel.numero}` : null));
    }, 0);
    return () => clearTimeout(t);
  }, [user]);
  /** «No soy yo»: vacía lo que vino de la cuenta para escribir otros datos. */
  function noSoyYo() {
    poner({ nombre: "", email: "", telefono: "" });
    setDeCuenta(null);
  }
  useEffect(() => {
    if (!restaurado.current) return;
    try {
      sessionStorage.setItem(claveBorrador(hotel.id), JSON.stringify({ ...f, base }));
    } catch {
      /* sin almacenamiento (modo privado): el formulario sigue funcionando */
    }
  }, [f, base, hotel.id]);

  const { desde, hasta, pasajeros } = f;
  // Un riel del borrador que el servidor ya no ofrece se trata como no elegido.
  const riel: Riel | "" = f.riel && (!config || config.rieles.includes(f.riel)) ? f.riel : "";
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
      fotoPropia: !!ficha?.fotos.length,
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

  // Chips del hotel cuando no hay fotos por habitación: amenities y vistas de sus fichas, las más
  // repetidas primero. «Mini-bar», «Minibar» y «Mini bar» cuentan como una sola.
  const caracteristicas = useMemo(() => {
    const cuenta = new Map<string, { texto: string; n: number }>();
    for (const h of habitaciones) {
      for (const a of [...(h.amenities ?? []), h.vista]) {
        const texto = a?.trim();
        if (!texto) continue;
        const clave = texto.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
        const previa = cuenta.get(clave);
        cuenta.set(clave, { texto: previa?.texto ?? texto, n: (previa?.n ?? 0) + 1 });
      }
    }
    return [...cuenta.values()].sort((a, b) => b.n - a.n).slice(0, 8).map((c) => c.texto);
  }, [habitaciones]);

  // El precio que fijó el servidor vale solo para ESTE carrito: si el cliente cambia algo, se descarta.
  const claveSel = JSON.stringify([tarifaEfectiva, desde, hasta, pasajeros]);
  const precioServidor = ajuste && ajuste.clave === claveSel ? ajuste.precio : null;
  const precio = precioServidor ?? (calculo?.ok ? calculo.precio : null);
  const feePct = config?.fee_pct ?? 0;
  const igtfPct = config?.igtf_pct ?? 0;
  const fee = precio !== null && feePct > 0 ? Math.round(precio * feePct) / 100 : 0;
  // Plan de abonos: apagado, o con una versión de condiciones distinta de la publicada en /terminos, no
  // se ofrece. Si deja de aplicar (cerró sesión, fechas a un viaje cercano) vuelve a pago total y hay
  // que elegirlo y aceptarlo de nuevo: nunca se reactiva solo.
  const plan = config
    ? calcularPlan((precio ?? 0) + fee, desde, hoy, { ...config, plan_tc_version: config.plan_tc_version === PLAN_ABONOS_VERSION ? PLAN_ABONOS_VERSION : null })
    : null;
  const ofrecerPlan = Boolean(plan && (plan.disponible || plan.motivo !== "sin_config"));
  const planElegible = Boolean(user) && plan?.disponible === true;
  if (modo === "plan" && config && !planElegible) {
    setModo("total");
    setAceptaPlan(false);
  }
  const planListo = modo === "plan" && planElegible && precio !== null && plan?.disponible ? plan : null;
  const usarPlan = planListo !== null;
  // IGTF: solo en pagos en divisas (Zelle, Binance), sobre lo que se cobra hoy (el total con cargo, o
  // la cuota 1 si es plan); el servidor lo recalcula igual.
  const baseIgtf = planListo ? planListo.inicial : precio !== null ? precio + fee : 0;
  const igtf = precio !== null && igtfPct > 0 && (riel === "zelle" || riel === "binance") ? Math.round(baseIgtf * igtfPct) / 100 : 0;
  const tasa = calculo?.ok ? calculo.tasa : null;
  const ivaEnBs = calculo?.ok ? calculo.ivaEnBs : false;
  const noches = calculo?.ok ? calculo.noches : hayFechas ? nochesDeEstadia(desde, hasta).length : null;

  const totales: Totales | null =
    precio !== null
      ? {
          precio, fee, feePct, igtf, igtfPct, total: precio + fee + igtf, riel, tasa, ivaEnBs,
          noches: noches ?? 0,
          lineas: calculo?.ok ? calculo.lineas : [],
          // El IGTF tiene su fila en el desglose (config del checkout); el estimado ya no lo avisa.
          avisos: calculo?.ok ? calculo.avisos : [],
          actualizado: precioServidor !== null,
          plan: planListo
            ? { pct: config?.plan_pct_inicial ?? 0, inicial: planListo.inicial, hoy: planListo.inicial + igtf, cuotas: planListo.cuotas }
            : null,
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
    plan: usarPlan && !aceptaPlan ? ERROR_CAMPO.plan : null,
    riel: riel ? null : ERROR_CAMPO.riel,
    nombre: invalido({ nombre: f.nombre }) ? ERROR_CAMPO.nombre : null,
    telefono: !telefonoE164 || invalido({ telefono: telefonoE164 }) ? ERROR_CAMPO.telefono : null,
    email: invalido({ email: f.email }) ? ERROR_CAMPO.email : null,
    acepta: acepta ? null : ERROR_CAMPO.acepta,
  };
  const ORDEN: ClaveCampo[] = ["fechas", "edades", "precio", "plan", "riel", "nombre", "telefono", "email", "acepta"];
  const primerError = ORDEN.find((k) => errores[k]) ?? null;
  const falta =
    primerError === "fechas" ? "Falta: fechas"
    : primerError === "edades" ? "Falta: la edad de los niños"
    : primerError === "precio" ? "Pruebe otras fechas"
    : primerError === "plan" ? "Falta: aceptar el plan"
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

  // El setter de useState ya es estable: TurnstileWidget no se re-monta por un onToken nuevo.
  const recibirTurnstile: (t: string | null) => void = setTurnstileToken;

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
          // El plan cambia lo que se cobra: va en la firma, así pasar de total a plan nunca reutiliza la otra reserva.
          ...(usarPlan ? { plan: true, acepta_plan: aceptaPlan } : {}),
          idempotency_key: `w_${base}_${firma(JSON.stringify([tarifaEfectiva, desde, hasta, pasajeros.adultos, edades, pasajeros.bebes, riel, email.toLowerCase(), telefono.replace(/\D/g, ""), usarPlan]))}`,
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
        registrarEvento("abrir_pago", { ruta: "/reservar", meta: { etapa: "reserva_creada", producto_id: hotel.id, riel, tasa, plan: usarPlan } });
        // replace: «atrás» desde /pagar vuelve a la ficha, no a un formulario que crearía otra reserva.
        router.replace(`/pagar/${data.token}`);
        return; // el botón sigue «cargando» mientras navega
      }
      if (data?.error === "precio_cambio" && typeof data.precio === "number") {
        setAjuste({ clave: claveSel, precio: data.precio });
        setError({ tono: "info", texto: `El precio se actualizó a ${usd(data.precio)} según el tarifario vigente. Revise el total y toque «Reservar y pagar» de nuevo.` });
      } else {
        const codigo = data?.error as string | undefined;
        if (codigo === "fuera_de_horario" || codigo === "checkout_desactivado" || codigo === "tc_no_aceptado") reintentar();
        if (codigo === "tc_no_aceptado") setAceptaPlan(false);
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

  const segundosAbierta = abierta ? Math.floor((Date.parse(abierta.expira_en) - Date.now()) / 1000) : 0;

  // ------------------------------------------------------------------ tramos
  // En el teléfono un tramo terminado se pliega salvo que la persona lo reabra («Cambiar»). Uno con
  // error nunca está terminado, así que `enfocar()` siempre encuentra su campo a la vista.
  const completos = tramosCompletos(errores, precio !== null);
  const [editando, setEditando] = useState<TramoId | null>(null);
  const abierto = (t: TramoId) => !completos[t] || editando === t;
  const resumenTramo: Record<TramoId, string> = {
    fechas: [hayFechas ? rangoFechas(desde, hasta) : "", noches ? `${noches} ${noches === 1 ? "noche" : "noches"}` : "", textoViajeros(pasajeros)]
      .filter(Boolean)
      .join(" · "),
    habitacion: [habitacion ?? "Habitación", elegida?.tarifa.plan?.trim() || "", precio !== null ? usd(precio) : ""].filter(Boolean).join(" · "),
    pago: [usarPlan ? "Plan de abonos" : "Pago total", riel ? NOMBRE_RIEL[riel] : ""].filter(Boolean).join(" · "),
    datos: [f.nombre.trim(), f.telefono.trim()].filter(Boolean).join(" · "),
  };
  function cambiarTramo(t: TramoId) {
    setEditando(t);
    requestAnimationFrame(() => document.getElementById(`tramo-${t}`)?.scrollIntoView({ block: "start", behavior: comportamientoScroll() }));
  }
  const cerrarTramo = () => setEditando(null);

  // Al terminar un tramo en el teléfono, el foco y el scroll pasan al primero pendiente.
  const firmaTramos = ORDEN_TRAMOS.map((t) => (completos[t] ? "1" : "0")).join("");
  const firmaPrevia = useRef(firmaTramos);
  useEffect(() => {
    // Con la hoja de viajeros abierta, mover el foco detrás del modal rompería su trampa de foco: se
    // espera a que cierre y se compara contra lo que había antes de abrirla.
    if (hojaViajeros) return;
    const antes = firmaPrevia.current;
    firmaPrevia.current = firmaTramos;
    if (pantalla !== false || !interactuo.current || antes === firmaTramos) return;
    const sig = siguienteTramo(desdeFirma(antes), desdeFirma(firmaTramos));
    if (!sig) return;
    document.getElementById(`tramo-${sig}`)?.scrollIntoView({ block: "start", behavior: comportamientoScroll() });
    document.getElementById(`tramo-${sig}-titulo`)?.focus({ preventScroll: true });
  }, [firmaTramos, pantalla, hojaViajeros]);

  return {
    completos, abierto, editando, resumenTramo, cambiarTramo, cerrarTramo, deCuenta, noSoyYo,
    hoy, pantalla, esEscritorio, config, reintentar, user, abrirCuenta,
    f, poner, desde, hasta, pasajeros, riel, hayFechas,
    acepta, setAcepta, modo, setModo, aceptaPlan, setAceptaPlan, hojaViajeros, setHojaViajeros,
    abierta, segundosAbierta, mostrarErrores, error, enviando, esperaToken,
    turnstileVuelta, recibirTurnstile, avisoTurnstile,
    elegida, tarifaEfectiva, habitacion, opciones, caracteristicas,
    precio, plan, ofrecerPlan, tasa, noches, totales, sinPrecio,
    errores, errorDe, falta, fueraDeHorario, wa, alEnviar,
  };
}
