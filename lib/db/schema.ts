import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    photoUrl: text("photo_url"),
    score: integer("score").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameIdx: index("players_name_idx").on(table.name),
  }),
);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  winnerTeam: integer("winner_team"),
});

export const matchPlayers = pgTable(
  "match_players",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    team: integer("team").notNull(),
  },
  (table) => ({
    matchIdx: index("match_players_match_idx").on(table.matchId),
  }),
);

export const awardTypeEnum = pgEnum("match_award_type", ["mvp", "dud"]);

export const matchAwards = pgTable("match_awards", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  awardType: awardTypeEnum("award_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const playersRelations = relations(players, ({ many }) => ({
  matchPlayers: many(matchPlayers),
  matchAwards: many(matchAwards),
}));

export const matchesRelations = relations(matches, ({ many }) => ({
  matchPlayers: many(matchPlayers),
  awards: many(matchAwards),
}));

export const matchPlayersRelations = relations(matchPlayers, ({ one }) => ({
  player: one(players, {
    fields: [matchPlayers.playerId],
    references: [players.id],
  }),
  match: one(matches, {
    fields: [matchPlayers.matchId],
    references: [matches.id],
  }),
}));

export const matchAwardsRelations = relations(matchAwards, ({ one }) => ({
  match: one(matches, {
    fields: [matchAwards.matchId],
    references: [matches.id],
  }),
  player: one(players, {
    fields: [matchAwards.playerId],
    references: [players.id],
  }),
}));

export const schema = {
  players,
  matches,
  matchPlayers,
  matchAwards,
};

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type MatchAward = typeof matchAwards.$inferSelect;

