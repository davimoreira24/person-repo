import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

type SupabaseClient = ReturnType<typeof createClient>;

declare global {
  // eslint-disable-next-line no-var
  var __supabaseAdmin: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __supabaseAnon: SupabaseClient | undefined;
}

const createAdminClient = () =>
  createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
  });

const createAnonClient = () =>
  createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });

export const supabaseAdmin =
  global.__supabaseAdmin ?? createAdminClient();
export const supabaseAnon = global.__supabaseAnon ?? createAnonClient();

if (process.env.NODE_ENV !== "production") {
  global.__supabaseAdmin = supabaseAdmin;
  global.__supabaseAnon = supabaseAnon;
}

export const playerBucket = serverEnv.SUPABASE_STORAGE_BUCKET;

