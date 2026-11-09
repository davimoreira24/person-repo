"use client";

/**
 * Letter Glitch em Canvas 2D (estável).
 * A versão WebGL2 do React Bits falhava em silêncio em alguns browsers
 * e deixava a página sem fundo.
 */

import { useEffect, useRef } from "react";

type LetterGlitchCanvasProps = {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  className?: string;
  backgroundColor?: string;
};

const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>/\\|[]{}=+?-_";

function randomChar() {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)] ?? "A";
}

export default function LetterGlitchCanvas({
  glitchColors = ["#ffffff", "#61dca3", "#E6C357"],
  glitchSpeed = 50,
  centerVignette = true,
  outerVignette = true,
  smooth = true,
  className = "",
  backgroundColor = "#05070f",
}: LetterGlitchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    let letters: Array<{
      char: string;
      color: string;
      targetColor: string;
      colorProgress: number;
    }> = [];
    let cols = 0;
    let rows = 0;
    const fontSize = 14;
    const gap = 4;
    const cell = fontSize + gap;

    const pickColor = () =>
      glitchColors[Math.floor(Math.random() * glitchColors.length)] ?? "#ffffff";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / cell) + 1;
      rows = Math.ceil(height / cell) + 1;
      letters = Array.from({ length: cols * rows }, () => {
        const color = pickColor();
        return {
          char: randomChar(),
          color,
          targetColor: color,
          colorProgress: 1,
        };
      });
      draw();
    };

    const draw = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i]!;
        const x = (i % cols) * cell;
        const y = Math.floor(i / cols) * cell;
        ctx.fillStyle = letter.color;
        ctx.globalAlpha = 0.55 + Math.random() * 0.2;
        ctx.fillText(letter.char, x, y);
      }
      ctx.globalAlpha = 1;

      if (outerVignette) {
        const g = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.25,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.72,
        );
        g.addColorStop(0, "rgba(5,7,15,0)");
        g.addColorStop(1, "rgba(5,7,15,0.85)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }

      if (centerVignette) {
        const g = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.min(width, height) * 0.45,
        );
        g.addColorStop(0, "rgba(5,7,15,0.55)");
        g.addColorStop(1, "rgba(5,7,15,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const hexToRgb = (hex: string) => {
      const h = hex.replace("#", "");
      const full =
        h.length === 3
          ? h
              .split("")
              .map((c) => c + c)
              .join("")
          : h;
      const n = Number.parseInt(full, 16);
      if (Number.isNaN(n)) return { r: 255, g: 255, b: 255 };
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    };

    const mix = (a: string, b: string, t: number) => {
      const A = hexToRgb(a);
      const B = hexToRgb(b);
      const r = Math.round(A.r + (B.r - A.r) * t);
      const g = Math.round(A.g + (B.g - A.g) * t);
      const bl = Math.round(A.b + (B.b - A.b) * t);
      return `rgb(${r},${g},${bl})`;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < glitchSpeed) return;
      last = now;

      const updates = Math.max(1, Math.floor(letters.length * 0.05));
      for (let n = 0; n < updates; n++) {
        const i = Math.floor(Math.random() * letters.length);
        const letter = letters[i];
        if (!letter) continue;
        letter.char = randomChar();
        letter.targetColor = pickColor();
        if (!smooth) {
          letter.color = letter.targetColor;
          letter.colorProgress = 1;
        } else {
          letter.colorProgress = 0;
        }
      }

      if (smooth) {
        for (const letter of letters) {
          if (letter.colorProgress < 1) {
            letter.colorProgress = Math.min(1, letter.colorProgress + 0.05);
            letter.color = mix(
              letter.color,
              letter.targetColor,
              letter.colorProgress,
            );
          }
        }
      }

      draw();
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [
    backgroundColor,
    centerVignette,
    glitchColors,
    glitchSpeed,
    outerVignette,
    smooth,
  ]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 h-full w-full overflow-hidden ${className}`}
      style={{ backgroundColor }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
    </div>
  );
}
