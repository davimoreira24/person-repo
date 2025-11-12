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
          initial={{ opacity: 0.35, scale: 1.1 }}
          animate={{
            opacity: [0.45, 0.75, 0.45],
            scale: [1.05, 1.18, 1.05],
            rotate: [0, index === 0 ? 2 : -2, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 18 + index * 4,
            ease: "easeInOut",
          }}
        />
      )),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-hero-grid opacity-80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />
      {layers}
    </div>
  );
}

