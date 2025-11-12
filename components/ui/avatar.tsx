"use client";

import Image from "next/image";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: 40,
  md: 64,
  lg: 96,
};

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const dimension = sizes[size];
  const initials = React.useMemo(
    () =>
      alt
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase(),
    [alt],
  );

  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full bg-secondary/50 text-sm font-semibold uppercase text-primary",
        className,
      )}
      style={{ width: dimension, height: dimension }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${dimension}px`}
          className="object-cover"
        />
      ) : (
        <span>{initials.slice(0, 2)}</span>
      )}
    </motion.div>
  );
}

