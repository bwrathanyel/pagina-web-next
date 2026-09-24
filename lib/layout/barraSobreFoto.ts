import { useEffect, type RefObject } from "react";
import { create } from "zustand";

// La barra del sitio es transparente mientras hay un hero detrás. El hero es
// quien sabe si sigue a la vista, así que lo avisa acá y el Navbar lo lee.
// Arranca en true: en "/" el primer pintado (antes de hidratar) ya sale
// transparente y no parpadea de sólida a transparente.
interface BarraSobreFoto {
  sobreFoto: boolean;
  fijar: (sobreFoto: boolean) => void;
}

export const useBarraSobreFoto = create<BarraSobreFoto>()((set) => ({
  sobreFoto: true,
  fijar: (sobreFoto) => set({ sobreFoto }),
}));

// Alto de la barra móvil: el hero deja de estar "bajo la barra" cuando su borde
// inferior sube hasta ahí.
const MARGEN_BARRA = "-72px 0px 0px 0px";

/** Llamarlo en la sección hero (la misma que lleva la clase `bajo-barra`). */
export function useHeroBajoBarra(ref: RefObject<Element | null>) {
  const fijar = useBarraSobreFoto((s) => s.fijar);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entrada]) => fijar(entrada.isIntersecting), {
      rootMargin: MARGEN_BARRA,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, fijar]);
}
