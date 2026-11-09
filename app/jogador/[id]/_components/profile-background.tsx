"use client";

import dynamic from "next/dynamic";
import LetterGlitchCanvas from "@/components/react-bits/LetterGlitchCanvas";

const ShapeWaves = dynamic(
  () => import("@/components/react-bits/ShapeWaves"),
  { ssr: false },
);

/** Background custom só pra esses jogadores. */
const SPECIAL_BACKGROUNDS: Record<
  number,
  { kind: "shape-waves"; text: string }
> = {
  22: { kind: "shape-waves", text: "GOAT" },
};

type ProfileBackgroundProps = {
  playerId: number;
  rankPosition: number;
};

export function ProfileBackground({
  playerId,
  rankPosition,
}: ProfileBackgroundProps) {
  const special = SPECIAL_BACKGROUNDS[playerId];

  if (special?.kind === "shape-waves") {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{ backgroundColor: "#000000" }}
        aria-hidden
      >
        <ShapeWaves
          text={special.text}
          textSize={0.72}
          fontWeight={700}
          shapes="mixed"
          cellSize={11}
          dotSize={0.8}
          color="#E6C357"
          hoverColor="#FFFFFF"
          backgroundColor="#000000"
          speed={1}
          brightness={0.45}
          glow={0.4}
          fade={0.3}
          interactive={false}
          intro
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  const colors =
    rankPosition === 1
      ? ["#FFD700", "#FFF1A8", "#E6C357", "#FFFFFF"]
      : rankPosition === 2
        ? ["#E8ECF5", "#C0C6D8", "#FFFFFF", "#8A93A8"]
        : rankPosition === 3
          ? ["#D19063", "#E0A57A", "#FFD4A8", "#FFFFFF"]
          : ["#4F72FF", "#61DCA3", "#E6C357", "#FFFFFF"];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: "#05070f" }}
      aria-hidden
    >
      <LetterGlitchCanvas
        glitchColors={colors}
        glitchSpeed={rankPosition === 1 ? 40 : 55}
        centerVignette
        outerVignette
        smooth
        backgroundColor="#05070f"
      />
    </div>
  );
}
