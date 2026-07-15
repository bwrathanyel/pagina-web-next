import Image from "next/image";

interface BrandMarkProps {
  dark?: boolean;
  size?: "sm" | "md";
  priority?: boolean;
}

export function BrandMark({ dark = false, size = "md", priority = false }: BrandMarkProps) {
  return (
    <span
      className={
        "relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-sm " +
        (size === "sm" ? "h-10 w-10" : "h-11 w-11") +
        (dark
          ? " border-gold/25 bg-gradient-to-br from-dusk-2 to-dusk"
          : " border-coral/15 bg-gradient-to-br from-gold/20 via-card to-coral/10")
      }
    >
      <Image
        src="/logo-lotus360-transparent.png"
        alt="Símbolo de Destino y Eventos Lotus 360"
        fill
        sizes={size === "sm" ? "40px" : "44px"}
        className="object-contain p-1.5"
        priority={priority}
      />
    </span>
  );
}
