"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { MatchTeamPlayer } from "@/lib/queries/players";
import { playerProfilePath } from "@/lib/match/routes";
import {
  formatSoloRank,
  formatRiotId,
  soloWinrate,
} from "@/lib/riot/client";
import { X } from "lucide-react";

const ProfileCard = dynamic(
  () => import("@/components/react-bits/ProfileCard").then((m) => m.default),
  { ssr: false },
);

type MatchPlayerProfileModalProps = {
  player: MatchTeamPlayer | null;
  onClose: () => void;
};

export function MatchPlayerProfileModal({
  player,
  onClose,
}: MatchPlayerProfileModalProps) {
  const router = useRouter();

  const riotId =
    player?.riotGameName && player?.riotTagLine
      ? formatRiotId(player.riotGameName, player.riotTagLine)
      : null;
  const soloRank = player
    ? formatSoloRank(
        player.riotSoloTier,
        player.riotSoloRank,
        player.riotSoloLp,
      )
    : null;
  const wr = player
    ? soloWinrate(player.riotSoloWins, player.riotSoloLosses)
    : null;
  const champs = player?.riotTopChampions ?? [];

  return (
    <AnimatePresence>
      {player ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col items-center gap-5 overflow-y-auto rounded-[1.75rem] border border-white/10 bg-[#0a0e16]/95 p-5 shadow-[0_0_80px_rgba(79,114,255,0.2)] sm:p-7"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full border border-white/15 bg-black/50 p-2 text-white/70 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <ProfileCard
              avatarUrl={player.photoUrl ?? undefined}
              miniAvatarUrl={player.photoUrl ?? undefined}
              name={player.name}
              title={
                soloRank ??
                (player.championName
                  ? `Jogando de ${player.championName}`
                  : "Person dos Crias")
              }
              handle={
                riotId?.replace("#", "") ??
                player.name.toLowerCase().replace(/\s+/g, "")
              }
              status={
                player.kills != null &&
                player.deaths != null &&
                player.assists != null
                  ? `Partida ${player.kills}/${player.deaths}/${player.assists}`
                  : wr != null
                    ? `WR Solo ${wr}%`
                    : riotId
                      ? "Conta Riot vinculada"
                      : "Sem Riot ID"
              }
              statusColor={wr != null && wr >= 50 ? "#22c55e" : "#E6C357"}
              masteries={champs.slice(0, 3).map((champ) => ({
                championId: champ.championId,
                name: champ.name,
                level: champ.level,
                icon: champ.icon,
              }))}
              showUserInfo
              enableTilt
              holo={0.85}
              glare={0.55}
              backdropColor="#0b1020"
              onContactClick={() => {
                onClose();
                router.push(playerProfilePath(player.playerId));
              }}
              className="mx-auto"
            />

            {champs.length === 0 ? (
              <p className="text-center text-xs text-white/40">
                Sem maestrias sincronizadas. Vincule o Riot ID no perfil e
                atualize as stats.
              </p>
            ) : null}

            <p className="text-center text-[11px] text-white/35">
              Clique no rodapé do card para abrir o perfil · clique fora para
              fechar
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
