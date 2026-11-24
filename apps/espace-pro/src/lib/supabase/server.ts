import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

/** Client Supabase côté serveur, lié à la session de l'utilisateur (cookies). */
export function supabaseServeur() {
  const store = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (liste) => {
        try {
          liste.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* appelé depuis un Server Component : le middleware rafraîchit la session */
        }
      },
    },
  });
}
