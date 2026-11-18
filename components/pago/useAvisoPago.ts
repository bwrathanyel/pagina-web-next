"use client";

import { useEffect, useRef, useState } from "react";
import { registrarEvento } from "@/lib/analitica/eventos";
import { mensajePago } from "@/lib/checkout/formato";
import { comprimirImagen, decidirComprobante } from "@/lib/pago/comprimir";
import { archivoABase64, COMPROBANTE_LIMITE_BYTES, declarar, type RielPago } from "@/lib/pago/pagar";

/** Borrador del aviso en sessionStorage: sobrevive a recargar la pestaña (o a que
 *  el navegador de Instagram la recargue al volver de la app del banco). */
interface Borrador {
  referencia: string;
  archivo?: { nombre: string; mime: string; base64: string };
}
/** Tope del archivo guardado en el borrador (base64 ≈ 4/3 del binario; sessionStorage ronda 5 MB). */
const BORRADOR_MAX_BASE64 = 2_200_000;

const clave = (token: string) => `lotus:aviso-pago:${token}`;

function leerBorrador(token: string): Borrador | null {
  try {
    const crudo = window.sessionStorage.getItem(clave(token));
    const b = crudo ? (JSON.parse(crudo) as Borrador) : null;
    return b && typeof b.referencia === "string" ? b : null;
  } catch {
    return null;
  }
}

function guardarBorrador(token: string, b: Borrador | null) {
  try {
    if (!b || (!b.referencia && !b.archivo)) window.sessionStorage.removeItem(clave(token));
    else window.sessionStorage.setItem(clave(token), JSON.stringify(b));
  } catch {
    // Sin espacio o almacenamiento bloqueado: el borrador es una comodidad, no hace falta avisar.
  }
}

function deBase64({ nombre, mime, base64 }: NonNullable<Borrador["archivo"]>): File | null {
  try {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], nombre, { type: mime });
  } catch {
    return null;
  }
}

/** Estado y envío del aviso «¿Ya pagó?»: referencia, comprobante comprimido y borrador. */
export function useAvisoPago({
  token, riel, rielElegido, onDeclarado,
}: {
  token: string;
  riel: RielPago;
  /** Link sin método fijo: el riel que eligió el cliente viaja con el aviso. */
  rielElegido: boolean;
  onDeclarado: () => void;
}) {
  // PagoPendiente solo se monta en el cliente (PagarCliente pinta el esqueleto hasta tener el pago),
  // así que el borrador se lee en el primer render sin desajuste de hidratación.
  const [inicial] = useState(() => (typeof window === "undefined" ? null : leerBorrador(token)));
  const [referencia, setReferenciaCruda] = useState(inicial?.referencia ?? "");
  const [errorReferencia, setErrorReferencia] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(() => (inicial?.archivo ? deBase64(inicial.archivo) : null));
  const [achicado, setAchicado] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refInput = useRef<HTMLInputElement>(null);

  // base64 del archivo actual: se calcula una vez y sirve al borrador y al envío.
  const base64 = useRef<{ file: File; valor: string } | null>(
    inicial?.archivo && archivo ? { file: archivo, valor: inicial.archivo.base64 } : null,
  );
  async function base64De(file: File) {
    if (base64.current?.file === file) return base64.current.valor;
    const valor = await archivoABase64(file);
    base64.current = { file, valor };
    return valor;
  }

  useEffect(() => {
    let vivo = true;
    const t = window.setTimeout(async () => {
      let guardado: Borrador["archivo"];
      if (archivo) {
        const b64 = await base64De(archivo).catch(() => null);
        if (!vivo) return;
        if (b64 && b64.length <= BORRADOR_MAX_BASE64) guardado = { nombre: archivo.name, mime: archivo.type, base64: b64 };
      }
      guardarBorrador(token, { referencia, archivo: guardado });
    }, 400);
    return () => { vivo = false; window.clearTimeout(t); };
  }, [token, referencia, archivo]);

  function setReferencia(v: string) {
    setReferenciaCruda(v);
    setErrorReferencia(null);
    setError(null);
  }

  async function elegirArchivo(file: File | null) {
    setError(null);
    if (!file) return;
    const decision = decidirComprobante(file.type, file.size);
    if (decision === "formato" || decision === "tamano") {
      setError(mensajePago(decision === "formato" ? "comprobante_formato_invalido" : "comprobante_muy_grande"));
      return;
    }
    if (decision === "tal_cual") {
      setAchicado(false);
      setArchivo(file);
      return;
    }
    setProcesando(true);
    try {
      const listo = await comprimirImagen(file);
      if (listo.size > COMPROBANTE_LIMITE_BYTES) {
        setError(mensajePago("comprobante_muy_grande"));
        return;
      }
      setAchicado(listo !== file);
      setArchivo(listo);
    } catch {
      setError("No pudimos abrir esa imagen. Pruebe con otra captura o con un PDF.");
    } finally {
      setProcesando(false);
    }
  }

  function quitarArchivo() {
    setArchivo(null);
    setAchicado(false);
    setError(null);
  }

  async function enviarCon() {
    setEnviando(true);
    setError(null);
    try {
      const comprobanteBase64 = archivo ? await base64De(archivo) : undefined;
      const res = await declarar({
        token,
        referencia: referencia.trim(),
        comprobanteBase64,
        comprobanteMime: archivo?.type,
        riel: rielElegido ? riel : undefined,
      });
      if (res.ok) {
        guardarBorrador(token, null);
        registrarEvento("pago_declarado", { meta: { token } });
        onDeclarado();
        return;
      }
      setError(mensajePago(res.error));
    } catch {
      // Solo puede fallar la lectura del archivo: declarar no lanza (la red cae como error "sin_red").
      setError("No pudimos leer el comprobante. Pruebe con otro archivo.");
    } finally {
      setEnviando(false);
    }
  }
  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando || procesando) return;
    if (!referencia.trim()) {
      setErrorReferencia("Escriba el número de referencia del pago.");
      refInput.current?.focus();
      return;
    }
    void enviarCon();
  }

  return {
    referencia, setReferencia, errorReferencia, refInput,
    archivo, achicado, procesando, elegirArchivo, quitarArchivo,
    enviando, error, alEnviar,
    restaurado: Boolean(inicial?.referencia || inicial?.archivo),
  };
}

export type AvisoPagoEstado = ReturnType<typeof useAvisoPago>;
