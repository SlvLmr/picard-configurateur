"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PERSONAS, type Persona } from "./roles";

export type Brand = "picard" | "eliot";
export type Theme = "light" | "dark";

type Session = {
  persona: Persona;
  setPersona: (id: string) => void;
  brand: Brand;
  setBrand: (b: Brand) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<Session | null>(null);

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* stockage indisponible : on garde l'état en mémoire */
  }
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const [brand, setBrandState] = useState<Brand>("picard");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const p = read("ep.persona");
    if (p && PERSONAS.some((x) => x.id === p)) setPersonaId(p);
    const b = document.documentElement.dataset.brand as Brand | undefined;
    const t = document.documentElement.dataset.theme as Theme | undefined;
    if (b) setBrandState(b);
    if (t) setThemeState(t);
  }, []);

  const setPersona = useCallback((id: string) => {
    setPersonaId(id);
    write("ep.persona", id);
  }, []);
  const setBrand = useCallback((b: Brand) => {
    setBrandState(b);
    document.documentElement.dataset.brand = b;
    write("ep.brand", b);
  }, []);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    write("ep.theme", t);
  }, []);

  const value = useMemo(
    () => ({
      persona: PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0],
      setPersona,
      brand,
      setBrand,
      theme,
      setTheme,
    }),
    [personaId, setPersona, brand, setBrand, theme, setTheme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSession doit être utilisé dans <SessionProvider>");
  return s;
}

/** Script injecté avant le rendu pour éviter le flash de thème. */
export const themeInitScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('ep.theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;d.dataset.brand=localStorage.getItem('ep.brand')||'picard';}catch(e){}})();`;
