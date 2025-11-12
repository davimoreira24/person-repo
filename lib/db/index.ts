import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DB_URL não definido. Configure a variável no arquivo .env.local.",
  );
}

const client =
  global.__postgresClient ??
  postgres(connectionString, {
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  global.__postgresClient = client;
}

export const db = drizzle(client, { schema });

