"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Seleção inteligente",
    description:
      "Organize listas de jogadores, faça upload de fotos, personalize pontuações e monte partidas equilibradas com apenas um clique.",
  },
  {
    title: "Persistência Supabase + Drizzle",
    description:
      "Armazene jogadores, partidas e estatísticas em tabelas tipadas e escaláveis com Drizzle ORM e Supabase Storage.",
  },
  {
    title: "Visual eSports",
    description:
      "Interface escura, tipografia dramática e elementos brilhantes inspirados em League of Legends mantendo acessibilidade.",
  },
  {
    title: "Animações Framer Motion",
    description:
      "Transições suaves entre telas, entrada animada de cards e efeitos sutis para reforçar a emoção de cada partida.",
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

