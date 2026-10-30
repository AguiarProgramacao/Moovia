import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { authStorage } from "./authStorage";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publicKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

function isPublicKey(key: string | undefined) {
  if (!key) return false;
  if (key.startsWith("sb_publishable_")) return true;
  // Legacy anon keys are JWTs. Never initialize a browser client with an admin key.
  try {
    const payload = key.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized)).role === "anon";
  } catch {
    return false;
  }
}

export const supabaseConfigurationError =
  !url || !publicKey
    ? "Configure a URL e a chave pública do Supabase no arquivo .env.local."
    : !isPublicKey(publicKey)
      ? "A chave configurada não é uma chave pública publishable ou anon."
      : (() => {
          try {
            return new URL(url).protocol === "https:"
              ? null
              : "A URL do Supabase deve usar HTTPS.";
          } catch {
            return "A URL configurada para o Supabase é inválida.";
          }
        })();

export const supabase =
  !supabaseConfigurationError && url && publicKey
    ? createClient<Database>(url, publicKey, {
        auth: {
          storage: authStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function requireSupabase() {
  if (!supabase)
    throw new Error(supabaseConfigurationError ?? "Supabase não configurado.");
  return supabase;
}
