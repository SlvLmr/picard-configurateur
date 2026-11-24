import { NextResponse, type NextRequest } from "next/server";
import { supabaseServeur } from "@/lib/supabase/server";

/** Retour d'un lien envoyé par e-mail (réinitialisation du mot de passe). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const suite = searchParams.get("suite");
  const destination = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/accueil";
  if (code) {
    const { error } = await supabaseServeur().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destination}`);
  }
  return NextResponse.redirect(`${origin}/mot-de-passe-oublie?expire=1`);
}
