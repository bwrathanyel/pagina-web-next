/** Sello dorado de la promo de niño gratis: va donde iría el precio del niño
 * (pedido del dueño, 2026-09-24: nada de "$0", confunde). Dorado y tinta de
 * botón no cambian con el tema, así que se lee igual en claro y en oscuro. */
export function SelloNinoGratis({ cantidad = 1, className = "" }: { cantidad?: number; className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center whitespace-nowrap rounded-pill bg-gold px-3 py-1.5 font-mono text-xs font-bold uppercase leading-none tracking-wide text-btn-ink " +
        className
      }
    >
      {cantidad} {cantidad === 1 ? "niño gratis" : "niños gratis"}
    </span>
  );
}
