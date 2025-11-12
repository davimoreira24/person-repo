"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Seleção inteligente",
    description:
      "Organize listas de jogadores, faça upload de fotos, personalize pontuações e monte partidas equilibradas com apenas um clique.",
  },
  {
    title: "Aqui é anti-amuletos",
    description:
      "Caso um jogador comece a trollar muitas partidas, o sistema automaticamente balanceará com outros jogadores",
  },
  {
    title: "Votação automática",
    description:
      "Ao final de cada partida, os jogadores poderão votar no MVP e no Animal da partida, o sistema automaticamente balanceará com outros jogadores",
  },
];

export function FeatureGrid() {
  return (
    <motion.div
      id="features"
      className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-2"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
      }}
    >
      {features.map((feature) => (
        <motion.div
          key={feature.title}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-panel relative flex flex-col gap-3 p-6 text-left"
        >
          <h3 className="font-display text-xl text-white">{feature.title}</h3>
          <p className="text-sm text-white/70">{feature.description}</p>
          <span className="absolute right-6 top-6 h-12 w-12 rounded-full border border-white/10 bg-white/5" />
        </motion.div>
      ))}
    </motion.div>
  );
}
