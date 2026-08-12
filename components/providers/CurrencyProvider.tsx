"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const CLAVE_LOCALSTORAGE = "lotus_moneda";

interface CurrencyContextValue {
  moneda: "USD" | "VES";
  alternarMoneda: () => void;
  tasaUSD: number | null;
  tasaEUR: number | null;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  moneda: "USD",
  alternarMoneda: () => {},
  tasaUSD: null,
  tasaEUR: null,
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

/** Toggle USD/Bs para toda la web -- mismo espíritu que next-themes para el
 * tema, pero armado a mano porque no hay librería equivalente para moneda.
 * Lee la tasa BCV UNA vez al montar y la guarda en memoria para toda la
 * sesión: convertir en cada render contra una tasa fresca del server rompería
 * el cache de ISR de 1h de app/layout.tsx, así que la conversión siempre pasa
 * por acá (client-side), nunca por el HTML server-rendered. */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [moneda, setMoneda] = useState<"USD" | "VES">("USD");
  const [tasaUSD, setTasaUSD] = useState<number | null>(null);
  const [tasaEUR, setTasaEUR] = useState<number | null>(null);

  useEffect(() => {
    const guardada = window.localStorage.getItem(CLAVE_LOCALSTORAGE);
    if (guardada === "VES" || guardada === "USD") setMoneda(guardada);

    supabaseBrowser()
      .from("tasas_cambio")
      .select("moneda, tasa")
      .then(({ data }) => {
        if (!data) return;
        const usd = data.find((r) => r.moneda === "USD")?.tasa;
        const eur = data.find((r) => r.moneda === "EUR")?.tasa;
        if (usd) setTasaUSD(Number(usd));
        if (eur) setTasaEUR(Number(eur));
      });
  }, []);

  const alternarMoneda = useCallback(() => {
    setMoneda((m) => {
      const nueva = m === "USD" ? "VES" : "USD";
      window.localStorage.setItem(CLAVE_LOCALSTORAGE, nueva);
      return nueva;
    });
  }, []);

  return (
    <CurrencyContext.Provider value={{ moneda, alternarMoneda, tasaUSD, tasaEUR }}>
      {children}
    </CurrencyContext.Provider>
  );
}
