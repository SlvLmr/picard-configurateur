"use client";

import { CircleCheck, Coins, GraduationCap, Inbox, Minus, Package, Plus, Receipt, ShoppingCart, Trash2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { commander, type LignePanier } from "@/app/(app)/boutique/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cote } from "@/components/ui/cote";
import { Field, Select } from "@/components/ui/field";
import { Jauge } from "@/components/ui/jauge";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Categorie, ClientPortefeuille, Commande, DonneesBoutique, Produit } from "@/lib/data/boutique";
import { isClient, type RoleId } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { CATEGORIES, LIBELLE_MODE, LIBELLE_STATUT, TON_CATEGORIE, euros, iconeProduit, points } from "./produit-visuel";

type Mode = "client" | "commercial" | "interne";
type Ligne = { produit: Produit; variante: string | null; quantite: number };

/** Données fictives pour l'aperçu des autres profils par l'administrateur. */
const APERCU = {
  solde: 4820,
  enveloppe: { montant: 3000, consomme: 1240 },
  clients: [
    { id: "apercu-1", nom: "Serrurerie Lambert", niveau: "Elite", ville: "Nantes" },
    { id: "apercu-2", nom: "Atelier Keraudren", niveau: "Premium", ville: "Rennes" },
    { id: "apercu-3", nom: "Fermetures Sarthe", niveau: null, ville: "Le Mans" },
  ] as ClientPortefeuille[],
};

export function BoutiqueVue({ donnees, role }: { donnees: DonneesBoutique; role: RoleId }) {
  const { persona } = useSession();
  const reel = role === "client_gerant" || role === "atc";
  const mode: Mode = role === "client_gerant" ? "client" : role === "atc" ? "commercial" : role === "admin" && isClient(persona.role) ? "client" : role === "admin" && persona.role === "atc" ? "commercial" : "interne";
  const apercu = !reel && mode !== "interne";

  if (role === "client_equipe")
    return (
      <>
        <PageHeader title="Boutique" description="La boutique est réservée au gérant de votre entreprise." />
      </>
    );

  return <Boutique donnees={donnees} mode={mode} apercu={apercu} />;
}

function Boutique({ donnees, mode, apercu }: { donnees: DonneesBoutique; mode: Mode; apercu: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categorie, setCategorie] = useState<Categorie | "tout">("tout");
  const [selection, setSelection] = useState<Produit | null>(donnees.produits[0] ?? null);
  const [variante, setVariante] = useState<string>("");
  const [panier, setPanier] = useState<Ligne[]>([]);
  const [pointsChoisis, setPointsChoisis] = useState<number | null>(null);
  const [client, setClient] = useState<string>("");

  const solde = mode === "client" ? (apercu ? APERCU.solde : (donnees.solde ?? 0)) : 0;
  const enveloppe = mode === "commercial" ? (apercu ? APERCU.enveloppe : donnees.enveloppe) : null;
  const clients = apercu ? APERCU.clients : donnees.clients;
  const dispoEnveloppe = enveloppe ? enveloppe.montant - enveloppe.consomme : 0;

  const produits = donnees.produits.filter((p) => categorie === "tout" || p.categorie === categorie);
  const totalPoints = panier.reduce((s, l) => s + l.produit.prixPoints * l.quantite, 0);
  const totalEuros = panier.reduce((s, l) => s + l.produit.prixEuros * l.quantite, 0);
  const maxPoints = Math.min(solde, totalPoints);
  const ptsUtilises = Math.min(pointsChoisis ?? maxPoints, maxPoints);
  const resteCb = totalPoints ? Math.round(totalEuros * (1 - ptsUtilises / totalPoints) * 100) / 100 : 0;

  const prochainPalier = useMemo(() => {
    const tries = [...donnees.produits].sort((a, b) => a.prixPoints - b.prixPoints);
    return tries.find((p) => p.prixPoints > solde) ?? tries[tries.length - 1];
  }, [donnees.produits, solde]);

  const ajouter = (p: Produit) => {
    const v = p.variantes.length ? variante || p.variantes[0] : null;
    setPanier((xs) => {
      const i = xs.findIndex((l) => l.produit.id === p.id && l.variante === v);
      if (i >= 0) return xs.map((l, k) => (k === i ? { ...l, quantite: Math.min(l.quantite + 1, p.stock) } : l));
      return [...xs, { produit: p, variante: v, quantite: 1 }];
    });
    setPointsChoisis(null);
    toast(`${p.nom}${v ? ` (${v})` : ""} ajouté au panier`);
  };

  const changerQuantite = (i: number, delta: number) =>
    setPanier((xs) =>
      xs
        .map((l, k) => (k === i ? { ...l, quantite: Math.max(0, Math.min(l.quantite + delta, l.produit.stock)) } : l))
        .filter((l) => l.quantite > 0),
    );

  const passerCommande = () => {
    if (apercu) {
      toast("Aperçu : la commande est réservée aux gérants clients et aux commerciaux.");
      return;
    }
    const lignes: LignePanier[] = panier.map((l) => ({ produitId: l.produit.id, variante: l.variante, quantite: l.quantite }));
    startTransition(async () => {
      const r = await commander(lignes, mode === "client" ? ptsUtilises : null, mode === "commercial" ? client || null : null);
      toast(r.message);
      if (r.ok) {
        setPanier([]);
        setPointsChoisis(null);
        router.refresh();
      }
    });
  };

  const description =
    mode === "client"
      ? "Payez en points, par carte, ou un mélange des deux. Vos points se gagnent à chaque lead traité."
      : mode === "commercial"
        ? "Commandez pour vos clients sur votre enveloppe annuelle. Au-delà de 300 €, votre chef de marché valide la commande."
        : "Catalogue et commandes du réseau.";

  const aValider = donnees.commandes.filter((c) => c.statut === "a_valider");

  return (
    <>
      <PageHeader
        title="Boutique"
        meta={apercu ? <Badge variant="warning">Aperçu, données fictives</Badge> : null}
        description={description}
      />

      {mode === "client" ? <EnTeteClient solde={solde} palier={prochainPalier} /> : null}
      {mode === "commercial" && enveloppe ? <EnTeteCommercial enveloppe={enveloppe} /> : null}
      {mode === "commercial" && !enveloppe ? (
        <Panel className="mb-8">
          <PanelBody className="pt-5 text-sm text-text-2">Aucune enveloppe n’est ouverte pour vous cette année. Contactez votre chef de marché.</PanelBody>
        </Panel>
      ) : null}
      {mode === "interne" ? (
        <KpiBand
          className="mb-8"
          items={[
            { label: "Commandes récentes", value: donnees.commandes.length, icon: Receipt },
            { label: "À valider", value: aValider.length, icon: CircleCheck, tone: aValider.length ? "warning" : "success", note: "Commandes sur enveloppe de plus de 300 €" },
            { label: "Points dépensés", value: new Intl.NumberFormat("fr-FR").format(donnees.commandes.reduce((s, c) => s + c.pointsUtilises, 0)), unit: "pts", icon: Coins, tone: "cta" },
            { label: "Produits au catalogue", value: donnees.produits.length, icon: Package, note: `${donnees.produits.filter((p) => p.stock < 10).length} en stock faible` },
          ]}
        />
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section aria-labelledby="catalogue-titre">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <h2 id="catalogue-titre" className="font-display text-lg font-semibold text-text">
              Catalogue
            </h2>
            <Segmented
              label="Catégorie"
              value={categorie}
              onChange={setCategorie}
              options={[{ value: "tout", label: "Tout" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {produits.map((p) => (
              <li key={p.id}>
                <CarteProduit
                  produit={p}
                  mode={mode}
                  accessible={mode === "client" && solde >= p.prixPoints}
                  active={selection?.id === p.id}
                  onSelect={() => {
                    setSelection(p);
                    setVariante(p.variantes[0] ?? "");
                  }}
                />
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-8 xl:sticky xl:top-24 xl:self-start">
          {selection ? (
            <FicheProduit
              produit={selection}
              mode={mode}
              variante={variante}
              setVariante={setVariante}
              solde={solde}
              onAjouter={() => ajouter(selection)}
            />
          ) : null}

          {mode !== "interne" ? (
            <Panel>
              <PanelHeader title="Panier" description={panier.length ? `${panier.reduce((s, l) => s + l.quantite, 0)} articles` : "Vide pour l’instant"} />
              {panier.length ? (
                <>
                  <ul>
                    {panier.map((l, i) => (
                      <li key={`${l.produit.id}-${l.variante}`} className="flex items-center gap-3 border-t border-line px-6 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text">
                            {l.produit.nom}
                            {l.variante ? <span className="font-normal text-text-3"> taille {l.variante}</span> : null}
                          </p>
                          <p className="tabular text-xs text-text-3">
                            {mode === "client" ? `${points(l.produit.prixPoints * l.quantite)} ou ${euros(l.produit.prixEuros * l.quantite)}` : euros(l.produit.prixEuros * l.quantite)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" iconOnly aria-label={l.quantite === 1 ? `Retirer ${l.produit.nom}` : `Diminuer la quantité de ${l.produit.nom}`} onClick={() => changerQuantite(i, -1)}>
                            {l.quantite === 1 ? <Trash2 /> : <Minus />}
                          </Button>
                          <span className="tabular w-6 text-center text-sm font-semibold text-text">{l.quantite}</span>
                          <Button size="sm" variant="ghost" iconOnly aria-label={`Augmenter la quantité de ${l.produit.nom}`} disabled={l.quantite >= l.produit.stock} onClick={() => changerQuantite(i, 1)}>
                            <Plus />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <PanelBody className="flex flex-col gap-4 border-t border-line pt-5">
                    {mode === "client" ? (
                      <div>
                        <div className="flex items-baseline justify-between gap-4">
                          <label htmlFor="repartition" className="text-sm font-medium text-text">
                            Répartition points et carte
                          </label>
                          <span className="text-xs text-text-3">Solde {points(solde)}</span>
                        </div>
                        <input
                          id="repartition"
                          type="range"
                          min={0}
                          max={maxPoints}
                          step={Math.max(1, Math.round(maxPoints / 100))}
                          value={ptsUtilises}
                          onChange={(e) => setPointsChoisis(Number(e.target.value))}
                          disabled={maxPoints === 0}
                          className="mt-3 w-full accent-[color:var(--cta)]"
                        />
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div className="rounded-md bg-cta-soft px-3 py-2">
                            <p className="text-xs text-cta-deep">En points</p>
                            <p className="tabular text-base font-bold text-text">{points(ptsUtilises)}</p>
                          </div>
                          <div className="rounded-md bg-sunken px-3 py-2 text-right">
                            <p className="text-xs text-text-3">Par carte</p>
                            <p className="tabular text-base font-bold text-text">{euros(resteCb)}</p>
                          </div>
                        </div>
                        {maxPoints < totalPoints && solde < totalPoints ? (
                          <p className="mt-2 text-xs text-text-3">Il vous manque {points(totalPoints - solde)} pour tout payer en points.</p>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <Field label="Pour le client" htmlFor="client" hint="Laissez vide pour une commande à votre usage (salon, visite).">
                          <Select id="client" value={client} onChange={(e) => setClient(e.target.value)}>
                            <option value="">Aucun client</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nom}
                                {c.ville ? `, ${c.ville}` : ""}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-text-2">Total sur enveloppe</span>
                          <span className="tabular text-lg font-bold text-text">{euros(totalEuros)}</span>
                        </div>
                        {totalEuros > dispoEnveloppe ? (
                          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">Enveloppe insuffisante : il reste {euros(dispoEnveloppe)}.</p>
                        ) : totalEuros > 300 ? (
                          <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">Au-delà de 300 €, la commande sera validée par votre chef de marché.</p>
                        ) : null}
                      </>
                    )}
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={pending || (mode === "commercial" && (!enveloppe || totalEuros > dispoEnveloppe))}
                      onClick={passerCommande}
                    >
                      <ShoppingCart aria-hidden />
                      {pending ? "Commande en cours…" : "Commander"}
                    </Button>
                  </PanelBody>
                </>
              ) : (
                <p className="border-t border-line px-6 py-6 text-sm text-text-2">Choisissez un produit dans le catalogue puis ajoutez-le au panier.</p>
              )}
            </Panel>
          ) : null}
        </div>
      </div>

      <Historique commandes={apercu ? [] : donnees.commandes} mode={mode} apercu={apercu} />
    </>
  );
}

function EnTeteClient({ solde, palier }: { solde: number; palier: Produit | undefined }) {
  const regles = [
    { icon: Inbox, titre: "Lead accepté dans les délais", gain: "+20 pts", actif: true },
    { icon: CircleCheck, titre: "Statut d’un lead renseigné", gain: "+10 pts", actif: true },
    { icon: Receipt, titre: "Commande de produits Picard", gain: "1 pt par 10 €", actif: false },
    { icon: GraduationCap, titre: "Formation suivie", gain: "+200 pts", actif: false },
  ];
  return (
    <Panel className="mb-8">
      <div className="grid gap-8 p-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <div className="flex flex-col items-center">
          <Jauge
            value={solde}
            max={palier ? Math.max(palier.prixPoints, solde) : Math.max(solde, 1)}
            label="Solde de points par rapport au prochain palier"
            valueLabel={points(solde)}
            sousTitre={palier && palier.prixPoints > solde ? `Encore ${points(palier.prixPoints - solde)} pour « ${palier.nom} »` : "Tout le catalogue vous est accessible"}
            tone="cta"
            size={240}
          />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text">Comment gagner des points</h2>
          <ul className="mt-3">
            {regles.map((r) => (
              <li key={r.titre} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                <Picto icon={r.icon} tone={r.actif ? "cta" : "neutral"} size="sm" />
                <span className="flex-1 text-sm text-text">{r.titre}</span>
                {r.actif ? null : <Badge>Bientôt</Badge>}
                <span className="tabular text-sm font-semibold text-text">{r.gain}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function EnTeteCommercial({ enveloppe }: { enveloppe: { montant: number; consomme: number } }) {
  const reste = enveloppe.montant - enveloppe.consomme;
  const pct = enveloppe.montant ? enveloppe.consomme / enveloppe.montant : 0;
  return (
    <Panel className="mb-8">
      <div className="grid gap-6 p-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-8">
        <div className="flex items-center gap-4">
          <Picto icon={Wallet} tone="accent" size="lg" />
          <div>
            <p className="text-sm font-medium text-text-2">Reste sur votre enveloppe {new Date().getFullYear()}</p>
            <p className="font-display tabular text-2xl font-bold text-text">{euros(reste)}</p>
          </div>
        </div>
        <Cote
          label="Enveloppe consommée"
          value={enveloppe.consomme}
          max={enveloppe.montant}
          tone={pct > 0.9 ? "danger" : pct > 0.7 ? "warning" : "accent"}
          valueLabel={`${euros(enveloppe.consomme)} consommés`}
          startLabel="Enveloppe consommée"
          endLabel={euros(enveloppe.montant)}
        />
      </div>
    </Panel>
  );
}

function CarteProduit({ produit: p, mode, accessible, active, onSelect }: { produit: Produit; mode: Mode; accessible: boolean; active: boolean; onSelect: () => void }) {
  const Icon = iconeProduit(p.visuel);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group flex h-full w-full flex-col rounded-lg border bg-surface p-4 text-left shadow-card transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-text-3",
        active ? "border-accent ring-2 ring-accent-soft" : "border-line",
      )}
    >
      <div className="relative grid h-24 place-items-center rounded-md bg-sunken">
        <Picto icon={Icon} tone={TON_CATEGORIE[p.categorie]} size="lg" />
        <div className="absolute left-2 top-2 flex gap-1">
          {accessible ? <Badge variant="success">Accessible</Badge> : null}
          {p.stock === 0 ? <Badge variant="danger">Épuisé</Badge> : p.stock < 10 ? <Badge variant="warning">Plus que {p.stock}</Badge> : null}
        </div>
      </div>
      <p className="mt-3 font-semibold text-text group-hover:text-accent">{p.nom}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-text-3">{p.description}</p>
      <p className="tabular mt-auto pt-3 text-sm font-semibold text-text">
        {mode === "client" ? (
          <>
            {points(p.prixPoints)} <span className="font-normal text-text-3">ou {euros(p.prixEuros)}</span>
          </>
        ) : (
          euros(p.prixEuros)
        )}
      </p>
    </button>
  );
}

function FicheProduit({
  produit: p,
  mode,
  variante,
  setVariante,
  solde,
  onAjouter,
}: {
  produit: Produit;
  mode: Mode;
  variante: string;
  setVariante: (v: string) => void;
  solde: number;
  onAjouter: () => void;
}) {
  const Icon = iconeProduit(p.visuel);
  return (
    <Panel>
      <div className="flex gap-4 px-6 pt-5">
        <Picto icon={Icon} tone={TON_CATEGORIE[p.categorie]} size="lg" />
        <div className="min-w-0">
          <p className="text-xs text-text-3">{p.categorie}</p>
          <h2 className="text-base font-semibold text-text">{p.nom}</h2>
          <p className="mt-1 text-sm text-text-2">{p.description}</p>
        </div>
      </div>
      <PanelBody className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {mode === "client" ? (
            <div className="rounded-md bg-cta-soft px-3 py-2">
              <p className="text-xs text-cta-deep">En points</p>
              <p className="tabular text-base font-bold text-text">{points(p.prixPoints)}</p>
            </div>
          ) : null}
          <div className={cn("rounded-md bg-sunken px-3 py-2", mode !== "client" && "col-span-2")}>
            <p className="text-xs text-text-3">{mode === "client" ? "Ou par carte" : "Prix"}</p>
            <p className="tabular text-base font-bold text-text">{euros(p.prixEuros)}</p>
          </div>
        </div>
        {mode === "client" && solde < p.prixPoints ? (
          <p className="text-xs text-text-3">Vous pourrez compléter par carte : il vous manque {points(p.prixPoints - solde)}.</p>
        ) : null}
        {p.variantes.length ? (
          <div>
            <p className="mb-2 text-sm font-medium text-text">Taille</p>
            <Segmented label="Taille" size="sm" value={variante || p.variantes[0]} onChange={setVariante} options={p.variantes.map((v) => ({ value: v, label: v }))} />
          </div>
        ) : null}
        {mode !== "interne" ? (
          <Button variant="secondary" className="w-full" disabled={p.stock === 0} onClick={onAjouter}>
            <Plus aria-hidden />
            Ajouter au panier
          </Button>
        ) : (
          <p className="tabular text-xs text-text-3">Stock : {p.stock}. Référence {p.reference}.</p>
        )}
      </PanelBody>
    </Panel>
  );
}

function Historique({ commandes, mode, apercu }: { commandes: Commande[]; mode: Mode; apercu: boolean }) {
  return (
    <Panel className="mt-8">
      <PanelHeader title={mode === "interne" ? "Commandes du réseau" : "Mes commandes"} description="Les plus récentes d’abord" />
      {commandes.length === 0 ? (
        <p className="border-t border-line px-6 py-8 text-sm text-text-2">
          {apercu ? "Aperçu : l’historique s’affiche avec les commandes réelles de l’utilisateur." : "Aucune commande pour l’instant. Vos commandes et leur suivi apparaîtront ici."}
        </p>
      ) : (
        <ul>
          {commandes.map((c) => {
            const s = LIBELLE_STATUT[c.statut];
            return (
              <li key={c.id} className="grid gap-2 border-t border-line px-6 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-text">{c.reference}</span>
                    <span className="text-xs text-text-3">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(c.creeLe))}</span>
                    {c.client ? <span className="text-sm text-text-2">pour {c.client}</span> : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-text-2">
                    {c.lignes.map((l) => `${l.quantite} × ${l.nom}${l.variante ? ` (${l.variante})` : ""}`).join(", ")}
                  </p>
                </div>
                <div className="tabular text-sm text-text-2">
                  <span className="font-semibold text-text">{euros(c.totalEuros)}</span>
                  <span className="text-text-3">
                    {" "}
                    {LIBELLE_MODE[c.mode].toLowerCase()}
                    {c.mode === "mixte" ? `, ${points(c.pointsUtilises)} et ${euros(c.montantCb)}` : ""}
                  </span>
                </div>
                <Badge variant={s.variant} className="justify-self-start md:justify-self-end">
                  {s.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
