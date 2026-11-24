import { NextResponse, type NextRequest } from "next/server";
import { supabaseServeur } from "@/lib/supabase/server";

/** Retour du lien de connexion envoyé par e-mail. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabaseServeur().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/accueil`);
  }
  return NextResponse.redirect(`${origin}/connexion`);
}
