"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface ParticleFieldProps {
  density?: number;
}

export function ParticleField({ density = 24 }: ParticleFieldProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: density }).map((_, index) => {
        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = 6 + Math.random() * 6;

        return (
          <motion.span
            key={`particle-${index}`}
            className="absolute rounded-full bg-white/40 shadow-[0_0_12px_rgba(230,195,87,0.45)]"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              y: [0, -12, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              repeat: Infinity,
              duration,
              ease: "easeInOut",
              delay: Math.random() * 4,
            }}
          />
        );
      }),
    [density],
  );

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {particles}
    </div>
  );
}

