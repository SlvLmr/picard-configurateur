import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

const PAGE_CONNEXION = "/connexion";

/**
 * Accès réservé : toute page exige une session (identifiant + mot de passe).
 * Rafraîchit aussi la session Supabase à chaque requête.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (liste) => {
        liste.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        liste.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const surConnexion = request.nextUrl.pathname === PAGE_CONNEXION;

  if (!user && !surConnexion) {
    const url = request.nextUrl.clone();
    url.pathname = PAGE_CONNEXION;
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (user && surConnexion) {
    const url = request.nextUrl.clone();
    url.pathname = "/accueil";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
