"use client";

import { LazyMotion, MotionConfig } from "motion/react";

// Los componentes nuevos usan `m.*`, que pesa poco en el bundle inicial; las
// features (domMax: hace falta por el layoutId del tab bar y el arrastre de
// Hoja) llegan en un chunk aparte después de hidratar. Los `motion.*` que
// quedan siguen funcionando porque cargan sus propias features.
// reducedMotion="user": con prefers-reduced-motion, motion salta transform y
// layout y deja solo opacidad, igual que el bloque global de globals.css.
const cargarFeatures = () => import("./motion-features").then((r) => r.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={cargarFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
