import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
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
  votingSessionId: uuid("voting_session_id"),
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

export const votingSessionStatusEnum = pgEnum("voting_session_status", [
  "active",
  "completed",
]);

export const votingSessions = pgTable("voting_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  winnerTeam: integer("winner_team").notNull(),
  status: votingSessionStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const votes = pgTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    votingSessionId: uuid("voting_session_id")
      .notNull()
      .references(() => votingSessions.id, { onDelete: "cascade" }),
    voterToken: uuid("voter_token").notNull(),
    mvpPlayerId: integer("mvp_player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    dudPlayerId: integer("dud_player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("votes_session_idx").on(table.votingSessionId),
    voterIdx: index("votes_voter_idx").on(table.voterToken),
  }),
);

export const playersRelations = relations(players, ({ many }) => ({
  matchPlayers: many(matchPlayers),
  matchAwards: many(matchAwards),
}));

export const matchesRelations = relations(matches, ({ many, one }) => ({
  matchPlayers: many(matchPlayers),
  awards: many(matchAwards),
  votingSession: one(votingSessions, {
    fields: [matches.votingSessionId],
    references: [votingSessions.id],
  }),
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

export const votingSessionsRelations = relations(
  votingSessions,
  ({ one, many }) => ({
    match: one(matches, {
      fields: [votingSessions.matchId],
      references: [matches.id],
    }),
    votes: many(votes),
  }),
);

export const votesRelations = relations(votes, ({ one }) => ({
  votingSession: one(votingSessions, {
    fields: [votes.votingSessionId],
    references: [votingSessions.id],
  }),
  mvpPlayer: one(players, {
    fields: [votes.mvpPlayerId],
    references: [players.id],
  }),
  dudPlayer: one(players, {
    fields: [votes.dudPlayerId],
    references: [players.id],
  }),
}));

export const schema = {
  players,
  matches,
  matchPlayers,
  matchAwards,
  votingSessions,
  votes,
};

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type MatchAward = typeof matchAwards.$inferSelect;
export type VotingSession = typeof votingSessions.$inferSelect;
export type Vote = typeof votes.$inferSelect;

