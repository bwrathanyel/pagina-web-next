"use client";

import { useEffect, useState } from "react";

const EVALUADO_KEY = "lotus360_onboarding_evaluado";
const ASIGNADO_KEY = "lotus360_onboarding_asignado";

/** Gate 50/50 de onboarding, evaluado una sola vez por dispositivo y
 * persistido para siempre (nunca se re-evalúa ni se reintenta), sea cual
 * sea el resultado. Todo local (localStorage) -- ver spec, no necesita
 * server-side para un A/B por dispositivo. */
export function useOnboarding() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Toggle client-only (localStorage no existe en el render del server) --
    // el mismatch de hidratación es intencional acá, siempre arranca oculto.
    const evaluado = localStorage.getItem(EVALUADO_KEY) === "1";
    if (evaluado) return;
    const asignado = Math.random() < 0.5;
    localStorage.setItem(EVALUADO_KEY, "1");
    localStorage.setItem(ASIGNADO_KEY, asignado ? "1" : "0");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (asignado) setMostrar(true);
  }, []);

  function cerrar() {
    setMostrar(false);
  }

  return { mostrar, cerrar };
}
