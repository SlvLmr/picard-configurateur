"use client";

import { CheckCheck, ChevronDown, ImagePlus, Pin, SendHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { publierAnnonce } from "@/app/(app)/administration/contenus/actions";
import { SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { useToast } from "@/components/ui/toast";
import { CIBLES, type Cible } from "@/lib/cibles";
import { cn } from "@/lib/cn";
import type { Annonce } from "@/lib/data/accueil";
import { supabaseNavigateur } from "@/lib/supabase/client";
import { Visionneuse, type PhotoVisionneuse } from "./visionneuse";

type Filtre = "toutes" | Annonce["ton"];

/** Nom coloré en tête de bulle, comme l'expéditeur dans un groupe */
const TON = {
  info: { label: "Information", couleur: "var(--wa-vert-fonce)" },
  operation: { label: "Opération", couleur: "#e26b00" },
  important: { label: "Important", couleur: "#ea0038" },
} as const;

const jour = (iso: string) => iso.slice(0, 10);
const dateLongue = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(iso));
const heure = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const libellePhotos = (n: number) => (n > 1 ? `${n} photos` : "Photo");

function libelleJour(iso: string) {
  const d = new Date(`${jour(iso)}T12:00:00`);
  const auj = new Date();
  auj.setHours(12, 0, 0, 0);
  const ecart = Math.round((auj.getTime() - d.getTime()) / 86400000);
  if (ecart === 0) return "Aujourd’hui";
  if (ecart === 1) return "Hier";
  if (ecart > 1 && ecart < 7) return new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(d);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** Ce que la bulle affiche : le titre seulement s'il n'est pas déjà le début du message. */
function texteDe(a: Annonce) {
  const photosSeules = a.photos.length > 0 && a.contenu === a.titre && a.titre === libellePhotos(a.photos.length);
  if (photosSeules) return { titre: null, contenu: null };
  return { titre: a.contenu.startsWith(a.titre) ? null : a.titre, contenu: a.contenu };
}

/* ───────── Mosaïque de photos dans la bulle ───────── */
function Mosaique({ a, onOuvrir, horodatage, onCharge }: { a: Annonce; onOuvrir: (i: number) => void; horodatage: React.ReactNode; onCharge: () => void }) {
  const n = a.photos.length;
  const visibles = a.photos.slice(0, 4);
  return (
    <div className={cn("relative grid gap-1 overflow-hidden rounded-md", n === 1 ? "grid-cols-1" : "grid-cols-2")}>
      {visibles.map((p, i) => (
        <button
          key={p.chemin}
          type="button"
          onClick={() => onOuvrir(i)}
          aria-label={`Ouvrir la photo ${i + 1}`}
          className={cn("group relative block overflow-hidden bg-black/5", n === 1 ? "max-h-80" : "aspect-square", n === 3 && i === 0 && "col-span-2 aspect-[2/1]")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt="" onLoad={onCharge} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {i === 3 && n > 4 ? <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-display text-2xl font-semibold text-white">+{n - 4}</span> : null}
        </button>
      ))}
      {horodatage ? (
        <span className="pointer-events-none absolute bottom-0 right-0 flex items-center gap-1 rounded-tl-lg bg-gradient-to-tl from-black/50 to-transparent px-2 pb-1 pt-4 text-xs text-white">{horodatage}</span>
      ) : null}
    </div>
  );
}

/* ───────── Aperçu de lien ───────── */
function ApercuLien({ a }: { a: Annonce }) {
  if (!a.lienUrl) return null;
  const interne = a.lienUrl.startsWith("/");
  const classe = "mb-1 flex items-center gap-3 rounded-md bg-[color-mix(in_srgb,var(--wa-texte)_6%,transparent)] p-2 transition-colors hover:bg-[color-mix(in_srgb,var(--wa-texte)_10%,transparent)]";
  const contenu = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-nav">
        <SymboleEspacePro className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--wa-texte)]">{a.lienLibelle ?? "En savoir plus"}</span>
        <span className="block truncate text-xs text-[var(--wa-texte-2)]">{interne ? "espace-pro" : a.lienUrl.replace(/^https?:\/\//, "").split("/")[0]}</span>
      </span>
    </>
  );
  return interne ? (
    <Link href={a.lienUrl} className={classe}>
      {contenu}
    </Link>
  ) : (
    <a href={a.lienUrl} target="_blank" rel="noreferrer" className={classe}>
      {contenu}
    </a>
  );
}

/* ───────── Zone d'écriture (administrateur) ───────── */
function Composeur() {
  const toast = useToast();
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [fichiers, setFichiers] = useState<{ f: File; url: string }[]>([]);
  const [ton, setTon] = useState<Annonce["ton"]>("info");
  const [cible, setCible] = useState<Cible>("tous");
  const [epinglee, setEpinglee] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const champ = useRef<HTMLTextAreaElement>(null);
  const selecteur = useRef<HTMLInputElement>(null);
  const actif = texte.trim().length > 0 || fichiers.length > 0;

  useEffect(() => {
    const t = champ.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
  }, [texte]);
  useEffect(() => () => fichiers.forEach((x) => URL.revokeObjectURL(x.url)), [fichiers]);

  const ajouter = (liste: FileList | null) => {
    if (!liste) return;
    const images = Array.from(liste).filter((f) => f.type.startsWith("image/"));
    const trop = images.filter((f) => f.size > 15 * 1024 * 1024);
    if (trop.length) toast("Une photo dépasse 15 Mo, elle n’a pas été ajoutée.");
    setFichiers((l) => [...l, ...images.filter((f) => f.size <= 15 * 1024 * 1024).map((f) => ({ f, url: URL.createObjectURL(f) }))].slice(0, 10));
  };

  const envoyer = async () => {
    if (!actif || envoi) return;
    setEnvoi(true);
    const supabase = supabaseNavigateur();
    const chemins: string[] = [];
    for (let i = 0; i < fichiers.length; i++) {
      const f = fichiers[i].f;
      const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const chemin = `${new Date().getFullYear()}/${Date.now()}-${i}.${ext || "jpg"}`;
      const { error } = await supabase.storage.from("ep-annonces").upload(chemin, f, { contentType: f.type, upsert: false });
      if (error) {
        if (chemins.length) await supabase.storage.from("ep-annonces").remove(chemins);
        setEnvoi(false);
        return toast("L’envoi d’une photo a échoué. Réessayez.");
      }
      chemins.push(chemin);
    }
    const propre = texte.trim();
    const titre = propre ? propre.split("\n")[0].slice(0, 120) : libellePhotos(chemins.length);
    const res = await publierAnnonce({ titre, contenu: propre || titre, ton, lienLibelle: "", lienUrl: "", cible, debut: "", fin: "", epinglee, photos: chemins });
    if (!res.ok && chemins.length) await supabase.storage.from("ep-annonces").remove(chemins);
    setEnvoi(false);
    toast(res.message);
    if (res.ok) {
      setTexte("");
      setFichiers([]);
      setEpinglee(false);
      router.refresh();
    }
  };

  return (
    <footer className="border-t border-[var(--wa-ligne)] bg-[var(--wa-barre)]">
      {actif ? (
        <div className="flex flex-col gap-3 px-3 pt-3 sm:px-4">
          {fichiers.length ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {fichiers.map((x, i) => (
                <span key={x.url} className="relative size-20 shrink-0 overflow-hidden rounded-md shadow-[var(--wa-ombre)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.url} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFichiers((l) => l.filter((_, k) => k !== i))}
                    aria-label="Retirer la photo"
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(Object.keys(TON) as Annonce["ton"][]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={ton === t}
                onClick={() => setTon(t)}
                className={cn("h-8 rounded-full px-3 font-medium transition-colors", ton === t ? "bg-[var(--wa-vert-pale)] text-[var(--wa-vert-fonce)]" : "bg-[var(--wa-bulle)] text-[var(--wa-texte-2)] hover:text-[var(--wa-texte)]")}
              >
                {TON[t].label}
              </button>
            ))}
            <select
              aria-label="Destinataires"
              value={cible}
              onChange={(e) => setCible(e.target.value as Cible)}
              className="h-8 rounded-full border-0 bg-[var(--wa-bulle)] px-3 text-xs font-medium text-[var(--wa-texte)] focus:outline-none focus:ring-2 focus:ring-[var(--wa-vert)]"
            >
              {(Object.keys(CIBLES) as Cible[]).map((c) => (
                <option key={c} value={c}>
                  {CIBLES[c].label}
                </option>
              ))}
            </select>
            <label className="ml-auto flex h-8 cursor-pointer items-center gap-2 font-medium text-[var(--wa-texte-2)]">
              <input type="checkbox" checked={epinglee} onChange={(e) => setEpinglee(e.target.checked)} className="accent-[var(--wa-vert)]" />
              Épingler
            </label>
          </div>
        </div>
      ) : null}
      <div className="flex items-end gap-2 px-3 py-3 sm:px-4">
        <input ref={selecteur} type="file" accept="image/*" multiple hidden onChange={(e) => {
          ajouter(e.target.files);
          e.target.value = "";
        }} />
        <button type="button" onClick={() => selecteur.current?.click()} aria-label="Joindre des photos" title="Joindre des photos" className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--wa-icone)] transition-colors hover:bg-[color-mix(in_srgb,var(--wa-texte)_8%,transparent)]">
          <ImagePlus className="size-6" />
        </button>
        <textarea
          ref={champ}
          rows={1}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              envoyer();
            }
          }}
          onPaste={(e) => {
            if (e.clipboardData.files.length) {
              e.preventDefault();
              ajouter(e.clipboardData.files);
            }
          }}
          placeholder="Écrire au réseau"
          aria-label="Message au réseau"
          className="min-h-10 flex-1 resize-none rounded-lg border-0 bg-[var(--wa-bulle)] px-4 py-2 text-base leading-6 text-[var(--wa-texte)] placeholder:text-[var(--wa-texte-2)] focus:outline-none"
        />
        <button
          type="button"
          onClick={envoyer}
          disabled={!actif || envoi}
          aria-label="Envoyer"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--wa-vert)] text-white transition-[transform,opacity] hover:scale-105 disabled:scale-100 disabled:opacity-40"
        >
          <SendHorizontal className={cn("size-5", envoi && "animate-pulse")} />
        </button>
      </div>
    </footer>
  );
}

/**
 * Canal des messages du réseau : la chaîne officielle de Picard Serrures, façon messagerie.
 * Intégré à l'accueil : il prend la hauteur de sa carte, sans l'en-tête de chaîne (la carte le porte).
 */
export function CanalMessages({ annonces, admin }: { annonces: Annonce[]; admin: boolean }) {
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [surbrillance, setSurbrillance] = useState<string | null>(null);
  const [visionneuse, setVisionneuse] = useState<{ photos: PhotoVisionneuse[]; depart: number } | null>(null);
  const [enBas, setEnBas] = useState(true);
  const filRef = useRef<HTMLDivElement>(null);

  // Ordre chronologique, la plus récente en bas, comme une conversation
  const liste = useMemo(
    () =>
      (filtre === "toutes" ? annonces : annonces.filter((a) => a.ton === filtre))
        .slice()
        .sort((a, b) => a.debut.localeCompare(b.debut) || a.creeLe.localeCompare(b.creeLe)),
    [annonces, filtre],
  );
  const epinglee = annonces.find((a) => a.epinglee) ?? null;
  const compte = (t: Annonce["ton"]) => annonces.filter((a) => a.ton === t).length;

  const descendre = (comportement: ScrollBehavior = "smooth") => {
    const f = filRef.current;
    if (f) f.scrollTo({ top: f.scrollHeight, behavior: comportement });
  };
  useEffect(() => descendre("instant" as ScrollBehavior), [filtre, annonces.length]);

  const allerA = (id: string) => {
    setFiltre("toutes");
    setTimeout(() => {
      document.getElementById(`annonce-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setSurbrillance(id);
      setTimeout(() => setSurbrillance(null), 1600);
    }, 50);
  };

  const groupes: { jour: string; annonces: Annonce[] }[] = [];
  for (const a of liste) {
    const j = jour(a.debut);
    if (groupes.at(-1)?.jour === j) groupes.at(-1)!.annonces.push(a);
    else groupes.push({ jour: j, annonces: [a] });
  }

  return (
    <div className="wa flex h-[640px] flex-col overflow-hidden rounded-md border border-line">
      {/* En-tête du canal */}
      <header className="border-b border-[var(--wa-ligne)] bg-[var(--wa-barre)] px-4 py-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Filtrer les messages">
          {(
            [
              ["toutes", "Tous", annonces.length],
              ["operation", "Opérations", compte("operation")],
              ["important", "Important", compte("important")],
              ["info", "Informations", compte("info")],
            ] as const
          ).map(([v, l, n]) => (
            <button
              key={v}
              type="button"
              aria-pressed={filtre === v}
              onClick={() => setFiltre(v)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors",
                filtre === v ? "bg-[var(--wa-vert-pale)] text-[var(--wa-vert-fonce)]" : "bg-[var(--wa-bulle)] text-[var(--wa-texte-2)] hover:text-[var(--wa-texte)]",
              )}
            >
              {l}
              <span className="tabular text-xs opacity-70">{n}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Message épinglé */}
      {epinglee ? (
        <button type="button" onClick={() => allerA(epinglee.id)} className="flex items-center gap-3 border-b border-[var(--wa-ligne)] bg-[var(--wa-bulle)] px-4 py-2 text-left sm:px-6">
          <Pin aria-hidden className="size-4 shrink-0 rotate-45 text-[var(--wa-icone)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-[var(--wa-vert-fonce)]">Message épinglé</span>
            <span className="block truncate text-sm text-[var(--wa-texte)]">{epinglee.titre}</span>
          </span>
        </button>
      ) : null}

      {/* Fil, sur le papier peint */}
      <div className="wa-fond min-h-0 flex-1">
        <div
          ref={filRef}
          onScroll={(e) => {
            const f = e.currentTarget;
            setEnBas(f.scrollHeight - f.scrollTop - f.clientHeight < 120);
          }}
          className="scroll-nav absolute inset-0 overflow-y-auto px-3 py-4 sm:px-6"
        >
          {liste.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="rounded-lg bg-[var(--wa-bulle)] px-4 py-2 text-sm text-[var(--wa-texte-2)] shadow-[var(--wa-ombre)]">Aucun message dans cette catégorie pour le moment.</p>
            </div>
          ) : (
            <ol className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              <li className="mx-auto max-w-md rounded-lg bg-[#ffeecd] px-3 py-2 text-center text-xs text-[#54656f] shadow-[var(--wa-ombre)] [[data-theme=dark]_&]:bg-[#182229] [[data-theme=dark]_&]:text-[#ffd279]">
                Chaîne officielle de Picard Serrures. Seule l’équipe Picard publie ici ; vous recevez les messages en lecture.
              </li>
              {groupes.map((g) => (
                <li key={g.jour} className="flex flex-col gap-1">
                  <p className="sticky top-0 z-10 mx-auto mb-2 rounded-lg bg-[var(--wa-bulle)] px-3 py-1 text-xs font-medium text-[var(--wa-texte-2)] shadow-[var(--wa-ombre)]">{libelleJour(g.jour).replace(/^./, (c) => c.toLocaleUpperCase("fr-FR"))}</p>
                  <ul className="flex flex-col gap-1">
                    {g.annonces.map((a, i) => {
                      const premier = i === 0;
                      const { titre, contenu } = texteDe(a);
                      const memeJour = jour(a.creeLe) === jour(a.debut);
                      const horodatage = (
                        <>
                          <span className="tabular">{memeJour ? heure(a.creeLe) : dateLongue(a.debut)}</span>
                          <CheckCheck aria-label="Distribué" className="size-4 text-[var(--wa-bleu)]" />
                        </>
                      );
                      const sansTexte = !titre && !contenu && !a.lienUrl;
                      return (
                        <li key={a.id} id={`annonce-${a.id}`} className={cn("bulle-entree flex", premier ? "mt-2" : "")} style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
                          <article
                            className={cn(
                              "relative rounded-lg bg-[var(--wa-bulle)] p-1 shadow-[var(--wa-ombre)] transition-shadow duration-500",
                              a.photos.length ? "w-[min(340px,88%)]" : "max-w-[min(560px,88%)] sm:max-w-[65%]",
                              premier && "rounded-tl-none",
                              surbrillance === a.id && "ring-2 ring-[var(--wa-vert)]",
                            )}
                          >
                            {premier ? <span aria-hidden className="absolute -left-2 top-0 h-3 w-2 bg-[var(--wa-bulle)] [clip-path:polygon(0_0,100%_0,100%_100%)]" /> : null}
                            {premier || a.ton !== "info" || a.epinglee ? (
                              <p className="flex items-center gap-2 px-2 pt-1 text-sm font-semibold" style={{ color: TON[a.ton].couleur }}>
                                {premier ? "Picard Serrures" : TON[a.ton].label}
                                {premier && a.ton !== "info" ? <span className="text-xs font-medium opacity-80">{TON[a.ton].label}</span> : null}
                                {a.epinglee ? <Pin aria-label="Épinglé" className="size-3 rotate-45 text-[var(--wa-icone)]" /> : null}
                              </p>
                            ) : null}
                            {a.photos.length ? (
                              <div className={cn(premier || a.ton !== "info" || a.epinglee ? "mt-1" : "")}>
                                <Mosaique
                                  a={a}
                                  horodatage={sansTexte ? horodatage : null}
                                  onCharge={() => {
                                    if (enBas) descendre("instant" as ScrollBehavior);
                                  }}
                                  onOuvrir={(k) =>
                                    setVisionneuse({
                                      depart: k,
                                      photos: a.photos.map((p) => ({ url: p.url, legende: contenu ?? "", date: a.creeLe })),
                                    })
                                  }
                                />
                              </div>
                            ) : null}
                            {!sansTexte ? (
                              <div className="px-2 pb-1 pt-1">
                                {titre ? <h2 className="text-sm font-semibold text-[var(--wa-texte)]">{titre}</h2> : null}
                                {a.lienUrl ? <div className="mt-1"><ApercuLien a={a} /></div> : null}
                                {contenu ? (
                                  <p className="whitespace-pre-line break-words text-sm leading-6 text-[var(--wa-texte)]">
                                    {contenu}
                                    {/* Réserve la place de l'heure en fin de ligne, comme dans une messagerie */}
                                    <span aria-hidden className="inline-block w-20" />
                                  </p>
                                ) : null}
                                {a.fin ? <p className="text-xs italic text-[var(--wa-texte-2)]">Valable jusqu’au {dateLongue(a.fin)}</p> : null}
                                <span className="float-right -mt-5 ml-2 flex items-center gap-1 text-xs text-[var(--wa-texte-2)]">{horodatage}</span>
                              </div>
                            ) : null}
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>
        {!enBas ? (
          <button
            type="button"
            onClick={() => descendre()}
            aria-label="Aller au dernier message"
            className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-[var(--wa-bulle)] text-[var(--wa-icone)] shadow-lg transition-transform hover:scale-105"
          >
            <ChevronDown className="size-6" />
          </button>
        ) : null}
      </div>

      {admin ? <Composeur /> : null}

      {visionneuse ? <Visionneuse photos={visionneuse.photos} depart={visionneuse.depart} onFermer={() => setVisionneuse(null)} /> : null}
    </div>
  );
}
