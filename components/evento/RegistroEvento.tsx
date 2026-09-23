"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const inputClass =
  "mt-1.5 min-h-12 w-full rounded-xl border border-dusk-text/15 bg-dusk px-4 text-base text-dusk-text outline-none transition placeholder:text-dusk-text-soft/50 focus:border-gold focus:ring-2 focus:ring-gold/20";

type Registro = { codigo: string; nombre: string; telefono: string };

function telefonoPareceValido(valor: string) {
  if (!/^[+\d\s().-]+$/.test(valor.trim())) return false;
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 15;
}

// 584141234567 -> 0414-123.45.67 (así lo reconoce el staff al escribirlo en el stand)
function telefonoLegible(norm: string) {
  if (/^58\d{10}$/.test(norm)) {
    const d = `0${norm.slice(2)}`;
    return `${d.slice(0, 4)}-${d.slice(4, 7)}.${d.slice(7, 9)}.${d.slice(9)}`;
  }
  return `+${norm}`;
}

function parsearGuardado(raw: string | null): Registro | null {
  try {
    const data = JSON.parse(raw ?? "null");
    return data && typeof data.codigo === "string" && typeof data.telefono === "string" ? data : null;
  } catch {
    return null;
  }
}

function suscribirStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function RegistroEvento({ evento }: { evento: string }) {
  const clave = `lotus-juega-${evento}`;
  const guardadoRaw = useSyncExternalStore(
    suscribirStorage,
    () => { try { return localStorage.getItem(clave); } catch { return null; } },
    () => null,
  );
  const [enMemoria, setEnMemoria] = useState<Registro | null>(null);
  const [ignorarGuardado, setIgnorarGuardado] = useState(false);
  const registro = enMemoria ?? (ignorarGuardado ? null : parsearGuardado(guardadoRaw));

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    if (!telefonoPareceValido(telefono)) {
      setError("Escribe tu número completo, por ejemplo 0414-1234567.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      // Sin casillas: el aviso bajo el botón informa que continuar equivale a
      // aceptar las bases y recibir promociones, y el API exige acepta_bases.
      const resp = await fetch("/api/evento-registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento, nombre: nombre.trim(), telefono: telefono.trim(),
          acepta_bases: true, acepta_promos: true, empresa,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) throw new Error(data.error || "error");
      const nuevo: Registro = { codigo: data.codigo, telefono: data.telefono, nombre: nombre.trim() };
      try {
        localStorage.setItem(clave, JSON.stringify(nuevo));
      } catch {
        // sin almacenamiento: el código igual queda en pantalla
      }
      setEnMemoria(nuevo);
    } catch (submitError) {
      const codigo = submitError instanceof Error ? submitError.message : "";
      setError(
        codigo === "datos_invalidos"
          ? "Revisa tu nombre y teléfono para continuar."
          : codigo === "evento_cerrado"
            ? "El registro para este evento está cerrado."
            : "No pudimos registrarte. Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  // Si la tarjeta del código queda fuera de pantalla tras enviar (la página
  // cambia de alto), se lleva a la vista. Solo aplica al registro recién hecho
  // (enMemoria), no al código restaurado al abrir la página, que ya carga arriba.
  const tarjetaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (enMemoria) tarjetaRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [enMemoria]);

  if (registro) {
    return (
      <div ref={tarjetaRef} className="scroll-mt-6 rounded-[28px] border border-gold/30 bg-dusk-2 p-7 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-gold">Tu código para jugar</p>
        <p className="mt-5 select-all font-mono text-6xl font-bold tracking-[0.22em] text-dusk-text" aria-live="polite">
          {registro.codigo}
        </p>
        <p className="mt-3 font-mono text-lg text-dusk-text-soft">{telefonoLegible(registro.telefono)}</p>
        <p className="mt-6 leading-7 text-dusk-text-soft">
          {registro.nombre.split(" ")[0]}, muestra esta pantalla en el stand de <span className="text-dusk-text">Lotus 360</span> para
          jugar. Tómale captura por si pierdes la señal.
        </p>
        <button
          type="button"
          onClick={() => {
            try { localStorage.removeItem(clave); } catch { /* sin almacenamiento */ }
            setEnMemoria(null);
            setIgnorarGuardado(true);
            setNombre(""); setTelefono("");
          }}
          className="mt-8 text-sm font-bold text-dusk-text-soft underline underline-offset-4"
        >
          Registrar a otra persona
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-[28px] border border-dusk-text/12 bg-dusk-2 p-5">
      <div className="grid gap-4">
        <label className="text-sm font-bold text-dusk-text">
          Nombre y apellido
          <input required autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} placeholder="Tu nombre completo" />
        </label>
        <label className="text-sm font-bold text-dusk-text">
          Teléfono (WhatsApp)
          <input required type="tel" autoComplete="tel" inputMode="tel" value={telefono} onChange={(e) => { setTelefono(e.target.value); setError(null); }} className={inputClass} placeholder="0414-1234567" />
        </label>

        <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="empresa" />
      </div>

      {error && <p className="mt-4 rounded-xl bg-coral/15 px-4 py-3 text-sm font-bold text-coral-bright" role="alert">{error}</p>}

      <button type="submit" disabled={enviando} className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-gold px-6 text-lg font-bold text-btn-ink disabled:opacity-60">
        {enviando ? "Registrando…" : "Obtener mi código"}
      </button>

      <p className="mt-3 text-xs leading-5 text-dusk-text-soft">
        Al continuar aceptas las bases: una participación por persona y por teléfono; premios de hospedaje para
        mayores de edad, con cédula, intransferibles y sujetos a disponibilidad. También aceptas recibir
        promociones de Lotus 360 por WhatsApp.
      </p>
    </form>
  );
}
