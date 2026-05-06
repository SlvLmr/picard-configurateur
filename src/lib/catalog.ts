export type DoorModel = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  basePrice: number;
  highlights: string[];
  certifications: string[];
};

export type DoorColor = {
  id: string;
  name: string;
  ral: string;
  hex: string;
  finish: "mate" | "satin" | "brillant";
  premium?: boolean;
};

export type DoorHandle = {
  id: string;
  name: string;
  finish: "chrome" | "laiton" | "noir" | "inox";
  price: number;
};

export type DoorGlazing = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type DoorAccessory = {
  id: string;
  name: string;
  category: "heurtoir" | "numero" | "judas" | "boite-aux-lettres";
  price: number;
};

export type Decor = {
  id: string;
  name: string;
  category: "ext-maison" | "ext-immeuble" | "int-maison" | "int-appart";
  side: "exterieur" | "interieur";
  // Placeholder gradient until Nano Banana images are produced.
  gradient: string;
  ambiance: string;
};

export const DOOR_MODELS: DoorModel[] = [
  {
    id: "diamant-luminance",
    name: "Diamant Luminance",
    tagline: "L'élégance du verre, la sécurité du blindage",
    description:
      "Notre porte signature alliant un vitrage haute performance à un blindage A2P BP3. Lumière naturelle et sérénité absolue.",
    basePrice: 7890,
    highlights: [
      "Vitrage feuilleté SP10",
      "Isolation thermique Ud 1.1",
      "5 points de verrouillage",
    ],
    certifications: ["A2P BP3", "Acotherm", "CE"],
  },
  {
    id: "serenite",
    name: "Sérénité",
    tagline: "La protection sans compromis",
    description:
      "Le modèle plébiscité par nos clients pour son rapport sécurité-design. Disponible en 12 finitions.",
    basePrice: 5490,
    highlights: [
      "Blindage acier 2mm",
      "Cylindre breveté Picard",
      "Isolation phonique 42dB",
    ],
    certifications: ["A2P BP2", "CE"],
  },
  {
    id: "presence",
    name: "Présence",
    tagline: "Le caractère affirmé",
    description:
      "Une porte d'entrée au design contemporain, avec inserts inox et lignes nettes pour les architectures modernes.",
    basePrice: 6290,
    highlights: [
      "Inserts inox brossé",
      "Charnières invisibles",
      "Seuil PMR",
    ],
    certifications: ["A2P BP2", "CE"],
  },
  {
    id: "heritage",
    name: "Héritage",
    tagline: "L'art français de la porte d'entrée",
    description:
      "Inspirée des grandes demeures, Héritage propose des moulures sculptées et des finitions main pour bâtiments de caractère.",
    basePrice: 8990,
    highlights: [
      "Moulures massives",
      "Finitions main",
      "Patine sur mesure",
    ],
    certifications: ["A2P BP3", "CE"],
  },
];

export const DOOR_COLORS: DoorColor[] = [
  { id: "noir-9005", name: "Noir profond", ral: "RAL 9005", hex: "#0e0e0e", finish: "mate" },
  { id: "anthracite-7016", name: "Gris anthracite", ral: "RAL 7016", hex: "#293133", finish: "satin" },
  { id: "blanc-9010", name: "Blanc pur", ral: "RAL 9010", hex: "#f1ece1", finish: "satin" },
  { id: "bordeaux-3005", name: "Rouge bordeaux", ral: "RAL 3005", hex: "#5e2129", finish: "satin" },
  { id: "bleu-5008", name: "Bleu nuit", ral: "RAL 5008", hex: "#26334d", finish: "satin" },
  { id: "vert-6009", name: "Vert sapin", ral: "RAL 6009", hex: "#27352a", finish: "mate", premium: true },
  { id: "or-1036", name: "Or perle", ral: "RAL 1036", hex: "#a0794a", finish: "brillant", premium: true },
];

export const DOOR_HANDLES: DoorHandle[] = [
  { id: "ligne-droite-inox", name: "Ligne Droite — Inox", finish: "inox", price: 0 },
  { id: "ligne-droite-noir", name: "Ligne Droite — Noir mat", finish: "noir", price: 90 },
  { id: "courbe-laiton", name: "Courbe — Laiton brossé", finish: "laiton", price: 220 },
  { id: "design-chrome", name: "Design — Chrome poli", finish: "chrome", price: 180 },
];

export const DOOR_GLAZINGS: DoorGlazing[] = [
  { id: "aucun", name: "Sans vitrage", description: "Panneau plein, sécurité maximale.", price: 0 },
  { id: "bandeau-vertical", name: "Bandeau vertical", description: "Une fine bande de verre dépoli.", price: 320 },
  { id: "imposte", name: "Imposte horizontale", description: "Un vitrage haut, lumière indirecte.", price: 290 },
  { id: "triple-hublot", name: "Triple hublot", description: "Trois ouvertures circulaires alignées.", price: 410 },
];

export const DOOR_ACCESSORIES: DoorAccessory[] = [
  { id: "heurtoir-classique", name: "Heurtoir classique laiton", category: "heurtoir", price: 140 },
  { id: "heurtoir-design", name: "Heurtoir design noir", category: "heurtoir", price: 160 },
  { id: "numero-laiton", name: "Numéro de rue laiton", category: "numero", price: 45 },
  { id: "numero-inox", name: "Numéro de rue inox", category: "numero", price: 55 },
  { id: "judas-optique", name: "Judas optique 200°", category: "judas", price: 80 },
  { id: "judas-numerique", name: "Judas numérique HD", category: "judas", price: 290 },
  { id: "bal-encastree", name: "Boîte aux lettres encastrée", category: "boite-aux-lettres", price: 220 },
];

export const DECORS: Decor[] = [
  // Extérieurs maison/villa
  { id: "villa-mediterraneenne", name: "Villa méditerranéenne", category: "ext-maison", side: "exterieur", gradient: "from-amber-100 via-rose-200 to-orange-300", ambiance: "Crépi clair, oliviers, lumière dorée." },
  { id: "maison-pierre-bourgogne", name: "Maison de pierre bourguignonne", category: "ext-maison", side: "exterieur", gradient: "from-stone-200 via-stone-400 to-stone-600", ambiance: "Pierre apparente, vigne vierge." },
  { id: "longere-normande", name: "Longère normande", category: "ext-maison", side: "exterieur", gradient: "from-emerald-100 via-stone-300 to-amber-200", ambiance: "Colombages, jardin verdoyant." },
  { id: "villa-contemporaine", name: "Villa contemporaine", category: "ext-maison", side: "exterieur", gradient: "from-zinc-200 via-zinc-400 to-zinc-700", ambiance: "Béton lissé, baies vitrées." },
  { id: "chalet-alpin", name: "Chalet alpin", category: "ext-maison", side: "exterieur", gradient: "from-amber-700 via-amber-900 to-stone-800", ambiance: "Bois sombre, neige, montagne." },

  // Extérieurs immeuble
  { id: "haussmannien-paris", name: "Immeuble haussmannien", category: "ext-immeuble", side: "exterieur", gradient: "from-stone-300 via-stone-500 to-stone-700", ambiance: "Pierre de taille, balcons en fer forgé." },
  { id: "immeuble-art-deco", name: "Art Déco lyonnais", category: "ext-immeuble", side: "exterieur", gradient: "from-amber-200 via-rose-300 to-rose-500", ambiance: "Façade ocre, mosaïques." },
  { id: "residence-moderne", name: "Résidence moderne", category: "ext-immeuble", side: "exterieur", gradient: "from-slate-200 via-slate-400 to-slate-600", ambiance: "Béton clair, végétalisation." },
  { id: "loft-industriel", name: "Loft industriel", category: "ext-immeuble", side: "exterieur", gradient: "from-zinc-700 via-stone-700 to-amber-900", ambiance: "Briques rouges, fer forgé." },

  // Intérieurs maison
  { id: "hall-villa-design", name: "Hall de villa design", category: "int-maison", side: "interieur", gradient: "from-stone-100 via-stone-200 to-stone-400", ambiance: "Marbre poli, escalier suspendu." },
  { id: "entree-cosy-bois", name: "Entrée cosy bois", category: "int-maison", side: "interieur", gradient: "from-amber-100 via-amber-300 to-amber-700", ambiance: "Parquet chêne, console en bois." },
  { id: "vestibule-classique", name: "Vestibule classique", category: "int-maison", side: "interieur", gradient: "from-slate-100 via-slate-200 to-slate-500", ambiance: "Tomettes, moulures, miroir doré." },

  // Intérieurs appartement
  { id: "couloir-haussmannien", name: "Couloir haussmannien", category: "int-appart", side: "interieur", gradient: "from-stone-100 via-stone-300 to-stone-500", ambiance: "Parquet point de Hongrie, moulures." },
  { id: "loft-beton", name: "Loft béton", category: "int-appart", side: "interieur", gradient: "from-zinc-200 via-zinc-400 to-zinc-700", ambiance: "Béton ciré, verrière atelier." },
  { id: "appart-scandinave", name: "Appartement scandinave", category: "int-appart", side: "interieur", gradient: "from-amber-50 via-stone-100 to-stone-300", ambiance: "Bois clair, lin, lumière douce." },
];

export type Configuration = {
  modelId: string;
  colorId: string;
  handleId: string;
  glazingId: string;
  accessoryIds: string[];
  decorExteriorId: string;
  decorInteriorId: string;
};

export const DEFAULT_CONFIG: Configuration = {
  modelId: "diamant-luminance",
  colorId: "anthracite-7016",
  handleId: "ligne-droite-inox",
  glazingId: "bandeau-vertical",
  accessoryIds: ["judas-optique", "numero-laiton"],
  decorExteriorId: "haussmannien-paris",
  decorInteriorId: "couloir-haussmannien",
};

export function computePrice(config: Configuration): number {
  const model = DOOR_MODELS.find((m) => m.id === config.modelId);
  const handle = DOOR_HANDLES.find((h) => h.id === config.handleId);
  const glazing = DOOR_GLAZINGS.find((g) => g.id === config.glazingId);
  const accessories = DOOR_ACCESSORIES.filter((a) =>
    config.accessoryIds.includes(a.id),
  );
  const color = DOOR_COLORS.find((c) => c.id === config.colorId);

  const base = model?.basePrice ?? 0;
  const opts =
    (handle?.price ?? 0) +
    (glazing?.price ?? 0) +
    accessories.reduce((s, a) => s + a.price, 0) +
    (color?.premium ? 250 : 0);

  return base + opts;
}
