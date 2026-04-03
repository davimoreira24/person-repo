"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const gradients = [
  "radial-gradient(circle at 20% 20%, rgba(64,155,255,0.25), transparent 55%)",
  "radial-gradient(circle at 80% 30%, rgba(230,195,87,0.18), transparent 50%)",
  "radial-gradient(circle at 50% 80%, rgba(63,92,197,0.25), transparent 60%)",
];

export function AuroraBackground() {
  const layers = useMemo(
    () =>
      gradients.map((gradient, index) => (
        <motion.div
          key={gradient}
          className="absolute inset-0 blur-3xl"
          style={{ backgroundImage: gradient }}
          initial={{ opacity: 0.4, scale: 1.06 }}
          animate={{
            /* Faixa menor = menos “respiração” na costura entre tons do fundo */
            opacity: [0.5, 0.64, 0.5],
            scale: [1.04, 1.1, 1.04],
            rotate: [0, index === 0 ? 1.2 : -1.2, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 22 + index * 5,
            ease: "easeInOut",
          }}
        />
      )),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-hero-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {layers}
    </div>
  );
}

